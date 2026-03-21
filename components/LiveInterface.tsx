import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, Video, VideoOff, Camera, Zap, Volume2, Maximize2, Minimize2, Settings2 } from 'lucide-react';
import { connectLiveSession } from '../services/geminiService';
import { createPcmBlob, decodeAudioData } from '../utils/audioUtils';

interface LiveInterfaceProps {
  externalAudioBase64?: string;
}

export const LiveInterface: React.FC<LiveInterfaceProps> = ({ externalAudioBase64 }) => {
  const [isActive, setIsActive] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  // Visualizer & UI Refs
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const isVideoExpandedRef = useRef(isVideoExpanded);

  // Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  const sessionRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    isVideoExpandedRef.current = isVideoExpanded;
  }, [isVideoExpanded]);

  const drawVisualizer = () => {
    if (!visualizerCanvasRef.current) return;
    const canvas = visualizerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    let inputDataArray = new Uint8Array(0);
    let outputDataArray = new Uint8Array(0);

    if (inputAnalyserRef.current) {
      const bufferLength = inputAnalyserRef.current.frequencyBinCount;
      inputDataArray = new Uint8Array(bufferLength);
      inputAnalyserRef.current.getByteFrequencyData(inputDataArray);
    }

    if (outputAnalyserRef.current) {
      const bufferLength = outputAnalyserRef.current.frequencyBinCount;
      outputDataArray = new Uint8Array(bufferLength);
      outputAnalyserRef.current.getByteFrequencyData(outputDataArray);
    }

    let aiVolume = 0;
    let userVolume = 0;

    if (outputDataArray.length > 0) {
      aiVolume = outputDataArray.reduce((a, b) => a + b, 0) / outputDataArray.length;
      setIsAiSpeaking(aiVolume > 10);
    } else {
      setIsAiSpeaking(false);
    }

    if (inputDataArray.length > 0) {
      userVolume = inputDataArray.reduce((a, b) => a + b, 0) / inputDataArray.length;
    }

    // Directly scale the orb for 60fps reactivity
    if (orbRef.current) {
      const scale = isActive ? 1 + (aiVolume / 255) * 0.2 + (userVolume / 255) * 0.05 : 1;
      orbRef.current.style.transform = `scale(${scale})`;
    }

    const drawCircularWave = (dataArray: Uint8Array, color: string, baseRadius: number, amplitude: number, direction: 1 | -1) => {
      if (dataArray.length === 0) return;
      ctx.beginPath();
      const centerX = width / 2;
      const centerY = height / 2;
      const sliceAngle = (Math.PI * 2) / dataArray.length;

      for (let i = 0; i <= dataArray.length; i++) {
        const index = i % dataArray.length;
        // Mirror data for a symmetrical, seamless circular waveform
        const mirroredIndex = index < dataArray.length / 2 ? index * 2 : (dataArray.length - index - 1) * 2;
        const safeIndex = Math.min(mirroredIndex, dataArray.length - 1);
        const v = dataArray[safeIndex] / 255.0;

        const r = baseRadius + (v * amplitude * direction);
        const x = centerX + Math.cos(i * sliceAngle) * r;
        const y = centerY + Math.sin(i * sliceAngle) * r;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // Only draw the large circular visualizer if the video isn't taking up the full screen
    if (!isVideoExpandedRef.current && isActive) {
      // Draw Input (User) Wave - Cyan, pointing inwards
      drawCircularWave(inputDataArray, 'rgba(6, 182, 212, 0.6)', 140, 30, -1);
      // Draw Output (AI) Wave - Amber, pointing outwards
      drawCircularWave(outputDataArray, 'rgba(245, 158, 11, 0.9)', 140, 60, 1);
    }

    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  const startSession = async () => {
    try {
      stopSession();
      setError(null);
      setIsActive(true);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      nextStartTimeRef.current = audioContext.currentTime;

      const outputAnalyser = audioContext.createAnalyser();
      outputAnalyser.fftSize = 256;
      outputAnalyser.connect(audioContext.destination);
      outputAnalyserRef.current = outputAnalyser;

      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = audioStream;
      
      const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = inputContext.createMediaStreamSource(audioStream);
      sourceRef.current = source;

      const inputAnalyser = inputContext.createAnalyser();
      inputAnalyser.fftSize = 256;
      source.connect(inputAnalyser);
      inputAnalyserRef.current = inputAnalyser;

      const processor = inputContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const sessionPromise = connectLiveSession(
        () => console.log('Live Session Open'),
        async (audioBase64) => {
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
            const ctx = audioContextRef.current;
            try {
                const uint8 = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
                const audioBuffer = await decodeAudioData(uint8, ctx, 24000);
                const bufferSource = ctx.createBufferSource();
                bufferSource.buffer = audioBuffer;
                bufferSource.connect(outputAnalyser); 
                const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
                bufferSource.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
            } catch (err) {}
        },
        () => { stopSession(); },
        (err) => { setError('Connection error occurred.'); stopSession(); }
      );

      sessionRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        sessionRef.current?.then(session => session.sendRealtimeInput({ audio: pcmBlob })).catch(() => {});
      };

      source.connect(processor);
      processor.connect(inputContext.destination);

      // Start visualizer
      if (visualizerCanvasRef.current) {
        visualizerCanvasRef.current.width = visualizerCanvasRef.current.offsetWidth;
        visualizerCanvasRef.current.height = visualizerCanvasRef.current.offsetHeight;
      }
      drawVisualizer();

    } catch (e: any) {
      setError(e.message || "Failed to initialize session");
      setIsActive(false);
      stopSession();
    }
  };

  const startVideo = async () => {
      try {
          const vStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
          videoStreamRef.current = vStream;
          setIsVideoActive(true);
          
          if (videoRef.current) {
              videoRef.current.srcObject = vStream;
              videoRef.current.play();
          }

          if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
          
          frameIntervalRef.current = window.setInterval(() => {
              if (!canvasRef.current || !videoRef.current) return;
              const ctx = canvasRef.current.getContext('2d');
              if (!ctx) return;
              const vid = videoRef.current;
              if (vid.readyState === vid.HAVE_ENOUGH_DATA) {
                  canvasRef.current.width = vid.videoWidth;
                  canvasRef.current.height = vid.videoHeight;
                  ctx.drawImage(vid, 0, 0);
                  const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionRef.current?.then(session => session.sendRealtimeInput({ video: { mimeType: 'image/jpeg', data: base64Data } })).catch(() => {});
              }
          }, 500); 

      } catch (e) {
          setError("Camera access denied.");
      }
  };

  const stopVideo = () => {
      if (frameIntervalRef.current) { clearInterval(frameIntervalRef.current); frameIntervalRef.current = null; }
      if (videoStreamRef.current) { videoStreamRef.current.getTracks().forEach(t => t.stop()); videoStreamRef.current = null; }
      setIsVideoActive(false);
      setIsVideoExpanded(false);
  };

  const stopSession = () => {
    setIsActive(false);
    setIsAiSpeaking(false);
    stopVideo();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (inputAnalyserRef.current) { inputAnalyserRef.current.disconnect(); inputAnalyserRef.current = null; }
    if (outputAnalyserRef.current) { outputAnalyserRef.current.disconnect(); outputAnalyserRef.current = null; }
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
    if (sessionRef.current) { sessionRef.current.then(session => { try { session.close(); } catch(e) {} }).catch(() => {}); sessionRef.current = null; }
    
    // Clear canvas
    if (visualizerCanvasRef.current) {
      const ctx = visualizerCanvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, visualizerCanvasRef.current.width, visualizerCanvasRef.current.height);
    }
    if (orbRef.current) {
      orbRef.current.style.transform = 'scale(1)';
    }
  };

  useEffect(() => { 
    // Handle window resize for canvas
    const handleResize = () => {
      if (visualizerCanvasRef.current) {
        visualizerCanvasRef.current.width = visualizerCanvasRef.current.offsetWidth;
        visualizerCanvasRef.current.height = visualizerCanvasRef.current.offsetHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      stopSession(); 
    };
  }, []);

  useEffect(() => {
    if (externalAudioBase64) {
      playExternalAudio(externalAudioBase64);
    }
  }, [externalAudioBase64]);

  const playExternalAudio = async (base64: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = audioContext;
        nextStartTimeRef.current = audioContext.currentTime;

        const outputAnalyser = audioContext.createAnalyser();
        outputAnalyser.fftSize = 256;
        outputAnalyser.connect(audioContext.destination);
        outputAnalyserRef.current = outputAnalyser;
        
        setIsActive(true);
        if (!animationFrameRef.current) {
          drawVisualizer();
        }
      }
      
      const ctx = audioContextRef.current;
      const uint8 = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const audioBuffer = await decodeAudioData(uint8, ctx, 24000);
      const bufferSource = ctx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(outputAnalyserRef.current!);
      
      const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
      bufferSource.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
    } catch (err) {
      console.error("Error playing external audio", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden bg-[#050505] select-none font-sans text-white">
      
      {/* Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none"></div>

      {/* Video Layer (Dynamic PiP or Fullscreen) */}
      <div className={`
        transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden
        ${!isVideoActive ? 'opacity-0 scale-95 pointer-events-none absolute top-8 right-8 w-72 aspect-[4/3] rounded-3xl' : ''}
        ${isVideoActive && isVideoExpanded ? 'absolute inset-0 w-full h-full z-0 rounded-none' : ''}
        ${isVideoActive && !isVideoExpanded ? 'absolute top-8 right-8 w-72 sm:w-80 aspect-[4/3] z-30 rounded-3xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl' : ''}
      `}>
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
        
        {/* Subtle vignette over video */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none"></div>
        
        {/* Video Overlays */}
        {isVideoActive && (
          <>
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              <span className="text-[10px] font-mono text-white uppercase tracking-wider">Live Feed</span>
            </div>
            <button 
              onClick={() => setIsVideoExpanded(!isVideoExpanded)}
              className="absolute bottom-4 right-4 p-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-colors"
              title={isVideoExpanded ? "Minimize Video" : "Maximize Video"}
            >
              {isVideoExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            
            {/* Corner Accents (only in PiP mode) */}
            {!isVideoExpanded && (
                <>
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30 m-3 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 m-3 pointer-events-none"></div>
                </>
            )}
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Main Orb & Visualizer Layer */}
      <div className={`
        transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex items-center justify-center
        ${isVideoExpanded ? 'absolute bottom-32 right-8 w-48 h-48 z-20' : 'absolute inset-0 w-full h-full z-10'}
      `}>
        {/* Canvas for Circular Visualizer */}
        <canvas 
            ref={visualizerCanvasRef} 
            className={`absolute inset-0 w-full h-full transition-opacity duration-500 pointer-events-none ${isActive && !isVideoExpanded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* The Orb */}
        <div ref={orbRef} className="relative z-20 flex items-center justify-center transition-transform duration-75">
            <div className={`
                rounded-full flex items-center justify-center transition-all duration-700 relative
                ${isVideoExpanded ? 'w-24 h-24' : 'w-48 h-48'}
                ${isActive 
                    ? isAiSpeaking 
                        ? 'shadow-[0_0_100px_rgba(245,158,11,0.4)]' 
                        : 'shadow-[0_0_60px_rgba(6,182,212,0.2)]'
                    : 'shadow-none opacity-40'
                }
            `}>
                {/* Outer Glow */}
                <div className={`absolute inset-0 rounded-full transition-all duration-700 blur-2xl ${isActive ? (isAiSpeaking ? 'bg-amber-500/40' : 'bg-cyan-500/30') : 'bg-transparent'}`}></div>
                
                {/* Core */}
                <div className={`
                    rounded-full transition-all duration-500 flex items-center justify-center relative overflow-hidden backdrop-blur-xl
                    ${isVideoExpanded ? 'w-20 h-20' : 'w-36 h-36'}
                    ${isActive 
                        ? isAiSpeaking
                            ? 'bg-gradient-to-br from-amber-400/90 to-orange-600/90 border-2 border-amber-300 shadow-inner'
                            : 'bg-gradient-to-br from-cyan-500/90 to-blue-700/90 border-2 border-cyan-300 shadow-inner'
                        : 'bg-zinc-900/80 border-2 border-zinc-700'
                    }
                `}>
                    {/* Inner ripples when active */}
                    {isActive && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-white/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                            <div className="absolute inset-0 rounded-full border border-white/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>
                        </>
                    )}
                    {!isActive ? <MicOff size={isVideoExpanded ? 20 : 36} className="text-zinc-500" /> : (isAiSpeaking ? <Volume2 size={isVideoExpanded ? 20 : 36} className="text-white drop-shadow-lg" /> : <Mic size={isVideoExpanded ? 20 : 36} className="text-white drop-shadow-lg" />)}
                </div>
            </div>
        </div>
      </div>

      {/* Header HUD */}
      <div className="absolute top-8 left-8 flex flex-col gap-2 z-30 pointer-events-none">
          <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse' : 'bg-zinc-600'}`}></div>
              <span className="text-xs font-mono text-zinc-300 uppercase tracking-[0.2em]">{isActive ? 'Luxora (Luxor9) Active' : 'Luxora Offline'}</span>
          </div>
          {isActive && (
              <div className="flex flex-col gap-1 mt-2 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span>Latency: <span className="text-emerald-400">24ms</span></span>
                  <span>Uplink: <span className="text-cyan-400">Secure</span></span>
                  {isAiSpeaking && <span className="text-amber-400 animate-pulse">Luxora Transmitting...</span>}
              </div>
          )}
          {error && <div className="mt-2 text-[10px] font-mono text-red-400 uppercase tracking-widest bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/20 backdrop-blur-md inline-block">{error}</div>}
      </div>

      {/* Controls Dock */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40">
          <div className="flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
              
              <button
                  onClick={isActive ? stopSession : startSession}
                  className={`
                      h-14 px-8 rounded-full font-bold text-[11px] tracking-[0.2em] uppercase flex items-center gap-3 transition-all duration-300
                      ${isActive 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:text-red-300' 
                          : 'bg-white text-black hover:bg-zinc-200 hover:scale-105'
                      }
                  `}
              >
                  {isActive ? <Radio size={16} className="animate-pulse"/> : <Zap size={16} />}
                  {isActive ? 'Terminate' : 'Initialize'}
              </button>

              <div className="w-px h-8 bg-white/10 mx-2"></div>

              <button
                  disabled={!isActive}
                  onClick={isVideoActive ? stopVideo : startVideo}
                  className={`
                      h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 border
                      ${!isActive 
                          ? 'opacity-30 cursor-not-allowed border-transparent bg-white/5 text-zinc-500' 
                          : isVideoActive
                              ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-amber-400'
                              : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }
                  `}
                  title={isVideoActive ? "Disable Camera" : "Enable Camera"}
              >
                  {isVideoActive ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                  className="h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 border border-transparent hover:bg-white/10 text-zinc-400 hover:text-white"
                  title="Settings"
              >
                  <Settings2 size={20} />
              </button>
          </div>
      </div>

    </div>
  );
};
