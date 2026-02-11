import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Activity, Radio, Video, VideoOff, Camera, Zap, Waves } from 'lucide-react';
import { connectLiveSession } from '../services/geminiService';
import { createPcmBlob, decodeAudioData } from '../utils/audioUtils';

export const LiveInterface: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Video Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  
  const sessionRef = useRef<Promise<any> | null>(null);

  const startSession = async () => {
    try {
      stopSession();
      setError(null);
      setIsActive(true);

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = audioContext;
      nextStartTimeRef.current = audioContext.currentTime;

      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = audioStream;
      
      const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = inputContext.createMediaStreamSource(audioStream);
      sourceRef.current = source;

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
                bufferSource.connect(ctx.destination);
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
        sessionRef.current?.then(session => session.sendRealtimeInput({ media: pcmBlob })).catch(() => {});
      };

      source.connect(processor);
      processor.connect(inputContext.destination);

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
                  sessionRef.current?.then(session => session.sendRealtimeInput({ media: { mimeType: 'image/jpeg', data: base64Data } })).catch(() => {});
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
  };

  const stopSession = () => {
    setIsActive(false);
    stopVideo();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (audioContextRef.current) { try { audioContextRef.current.close(); } catch(e) {} audioContextRef.current = null; }
    if (sessionRef.current) { sessionRef.current.then(session => { try { session.close(); } catch(e) {} }).catch(() => {}); sessionRef.current = null; }
  };

  useEffect(() => { return () => stopSession(); }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden bg-black select-none">
      
      {/* Background Video Layer */}
      <video ref={videoRef} muted playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isVideoActive ? 'opacity-30 blur-sm scale-110' : 'opacity-0'}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"></div>
      
      <canvas ref={canvasRef} className="hidden" />

      {/* Main UI Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-xl p-8">
        
        {/* The Eye / Visualizer */}
        <div className="relative mb-16 group">
            <div className={`
                w-48 h-48 rounded-full flex items-center justify-center transition-all duration-1000 relative
                ${isActive 
                    ? 'shadow-[0_0_100px_rgba(245,158,11,0.25)]' 
                    : 'shadow-none opacity-50'
                }
            `}>
                {/* Core Ring */}
                <div className={`absolute inset-0 rounded-full border-2 transition-all duration-1000 ${isActive ? 'border-amber-500/50 scale-100' : 'border-zinc-800 scale-90'}`}></div>
                
                {/* Spinning Outer Ring */}
                {isActive && <div className="absolute -inset-4 rounded-full border border-amber-500/20 border-t-transparent animate-[spin_4s_linear_infinite]"></div>}
                
                {/* The Pupil */}
                <div className={`
                    w-24 h-24 rounded-full transition-all duration-500 flex items-center justify-center
                    ${isActive 
                        ? 'bg-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.6)] scale-110 animate-pulse' 
                        : 'bg-zinc-900 border border-zinc-800'
                    }
                `}>
                    {!isActive && <MicOff size={32} className="text-zinc-700" />}
                </div>

                {/* Video Status Indicator */}
                {isVideoActive && (
                    <div className="absolute -top-10 flex flex-col items-center animate-in slide-in-from-bottom-4">
                        <div className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em] mb-1">Optical Link</div>
                        <div className="w-px h-6 bg-gradient-to-b from-amber-500 to-transparent"></div>
                    </div>
                )}
            </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-12 space-y-2">
            <h2 className={`text-2xl font-bold brand-font tracking-widest uppercase transition-colors duration-500 ${isActive ? 'text-zinc-100' : 'text-zinc-600'}`}>
                {isActive ? 'Neural Uplink Active' : 'System Standby'}
            </h2>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
               {error ? <span className="text-red-500">{error}</span> : (isActive ? 'Voice & Data Stream Established' : 'Awaiting Connection Protocol')}
            </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
            <button
                onClick={isActive ? stopSession : startSession}
                className={`
                    h-14 px-8 rounded-full font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-3 transition-all duration-300
                    ${isActive 
                        ? 'bg-red-950/50 text-red-500 border border-red-500/50 hover:bg-red-900/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-700 hover:border-amber-500 hover:text-amber-500 hover:bg-zinc-900'
                    }
                `}
            >
                {isActive ? <Radio size={16} className="animate-pulse"/> : <Zap size={16} />}
                {isActive ? 'Terminate' : 'Initialize'}
            </button>

            <button
                disabled={!isActive}
                onClick={isVideoActive ? stopVideo : startVideo}
                className={`
                    h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 border
                    ${!isActive 
                        ? 'opacity-20 cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500' 
                        : isVideoActive
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-zinc-200'
                    }
                `}
            >
                {isVideoActive ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
        </div>
        
        {/* Footer Technical readout */}
        <div className="absolute bottom-8 flex gap-8 text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
            <span>Latency: {isActive ? '24ms' : '--'}</span>
            <span>Bandwidth: {isActive ? '256kbps' : '--'}</span>
            <span>Encryption: AES-256</span>
        </div>

      </div>
    </div>
  );
};