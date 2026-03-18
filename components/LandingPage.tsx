import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Crosshair, ArrowRight } from 'lucide-react';

// --- GLOBAL STYLES & THEME INJECTION ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
      --background: 201 100% 5%;
      --foreground: 0 0% 100%;
      --muted-foreground: 240 4% 66%;
      
      --font-display: 'Instrument Serif', serif;
      --font-body: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    body {
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      font-family: var(--font-body);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      margin: 0;
      padding: 0;
      overflow-x: hidden; /* Prevent horizontal scroll, allow vertical if needed on tiny screens */
    }

    /* Cinematic Film Grain Overlay */
    .film-grain {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100dvh;
      pointer-events: none;
      z-index: 50;
      opacity: 0.04;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    }

    /* Enhanced Liquid Glass Effect */
    .liquid-glass {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02), 0 8px 32px -4px rgba(0,0,0,0.5);
      position: relative;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(.16,.84,.24,1);
    }
      
    .liquid-glass::before {
      content: '';
      position: absolute;
      inset: -1px;
      background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 100%);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      padding: 1px;
      border-radius: inherit;
      pointer-events: none;
    }

    .liquid-glass::after {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 50%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: skewX(-20deg);
      transition: 0.7s ease;
    }
    
    .liquid-glass:hover::after { left: 200%; }
    .liquid-glass:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
      box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.05), 0 12px 40px -4px rgba(0,0,0,0.6);
    }
    .liquid-glass:active { transform: translateY(1px); }

    /* High-End Cinematic Blur Reveals */
    @keyframes blur-rise {
      0% { opacity: 0; filter: blur(16px); transform: translateY(30px) scale(0.98); }
      100% { opacity: 1; filter: blur(0px); transform: translateY(0) scale(1); }
    }
    @keyframes fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    .animate-blur-rise { animation: blur-rise 1.4s cubic-bezier(.16,.84,.24,1) both; }
    .animate-fade-in { animation: fade-in 2s ease-out both; }

    /* Utilities */
    .delay-100 { animation-delay: 100ms; }
    .delay-300 { animation-delay: 300ms; }
    .delay-500 { animation-delay: 500ms; }
    .delay-700 { animation-delay: 700ms; }
    .delay-1000 { animation-delay: 1000ms; }

    /* Optimize Volumetric Glow: Only on devices with a mouse */
    @media (hover: none) and (pointer: coarse) {
      .ambient-glow { display: none !important; }
    }
  `}} />
);

interface Props {
  onLaunch: () => void;
  isLaunching?: boolean;
}

export default function LandingPage({ onLaunch, isLaunching }: Props) {
  const [isMuted, setIsMuted] = useState(true);
  const [time, setTime] = useState('');
  const cursorRef = useRef<HTMLDivElement>(null);

  // Real-time clock for the HUD
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + now.getMilliseconds().toString().padStart(3, '0'));
    };
    const interval = setInterval(updateTime, 47);
    return () => clearInterval(interval);
  }, []);

  // Ambient cursor tracking (Volumetric Glow)
  useEffect(() => {
    // Only track if device supports hover
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const handleMouseMove = (e: MouseEvent) => {
        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        }
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col selection:bg-white/20 bg-[#02050A]">
      <GlobalStyles />
      <div className="film-grain" />

      {/* Ambient Cursor Glow (Hidden on mobile via CSS) */}
      <div 
        ref={cursorRef}
        className="ambient-glow fixed top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 transition-opacity duration-1000 mix-blend-screen"
        style={{ willChange: 'transform' }}
      />
      
      {/* Video Background Layer - Fixed to viewport */}
      <div className="fixed inset-0 z-0 w-full h-[100dvh]">
        <video
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover opacity-80 mix-blend-luminosity grayscale-[30%]"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02050A]/90 via-transparent to-[#02050A] pointer-events-none" />
      </div>

      {/* --- TELEMETRY HUD FRAMING --- */}
      {/* Hidden/Simplified on mobile (< md) to prevent overlapping */}
      <div className="absolute inset-4 sm:inset-6 z-20 pointer-events-none flex flex-col justify-between animate-fade-in delay-1000 font-mono text-[8px] sm:text-[10px] text-white/30 tracking-widest uppercase">
        <div className="flex justify-between items-start">
          <div className="hidden md:flex items-center gap-2">
            <Crosshair size={12} className="animate-[spin_10s_linear_infinite]" />
            <span>LAT. 19.2215° N // LON. 73.1645° E</span>
          </div>
          <div className="text-right ml-auto">
            <span className="hidden sm:inline">LUXOR9.CORE_SYS</span>
            <div className="text-blue-400/50 mt-1">{time}</div>
          </div>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="hidden md:flex flex-col gap-1">
            <span>MEM: ALLOCATED</span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              STATUS: ONLINE
            </span>
          </div>
          <div className="mt-auto ml-auto md:ml-0 pointer-events-auto">
            <button 
              className="opacity-50 hover:opacity-100 transition-opacity p-2 -mr-2 sm:mr-0 cursor-pointer" 
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>
      {/* ----------------------------- */}

      {/* Navigation Bar */}
      <nav className="relative z-30 flex flex-row items-center justify-between px-6 sm:px-8 md:px-16 py-6 sm:py-10 w-full animate-blur-rise delay-100">
        <div 
          className="text-xl sm:text-2xl md:text-3xl tracking-tight text-[hsl(var(--foreground))] cursor-pointer select-none flex items-start gap-1" 
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Luxor9
          <span className="text-[8px] sm:text-[10px] opacity-60 mt-1 sm:mt-2 font-body font-medium uppercase tracking-widest">Core</span>
        </div>

        <div className="hidden lg:flex items-center gap-10 xl:gap-12 text-[11px] xl:text-[12px] uppercase tracking-[0.15em] font-medium text-[hsl(var(--muted-foreground))]">
          <a href="#" className="text-[hsl(var(--foreground))] transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full">Home</a>
          <a href="#" className="hover:text-[hsl(var(--foreground))] transition-colors">Studio</a>
          <a href="#" className="hover:text-[hsl(var(--foreground))] transition-colors">Intelligence</a>
          <a href="#" className="hover:text-[hsl(var(--foreground))] transition-colors">Journal</a>
        </div>

        <button className="liquid-glass rounded-full px-5 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-[12px] uppercase tracking-[0.1em] font-medium text-[hsl(var(--foreground))] cursor-pointer hidden md:block shrink-0">
          Access Terminal
        </button>
      </nav>

      {/* Hero Content Layer */}
      <main className="relative z-30 flex flex-col flex-1 items-center justify-center text-center px-4 sm:px-6 -mt-10 sm:-mt-16 pb-12">
        
        {/* Creator Badge */}
        <div className="animate-blur-rise delay-300 mb-6 sm:mb-10 inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-md shadow-2xl overflow-hidden group max-w-[90vw]">
           <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,1)] animate-pulse shrink-0" />
           <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-medium text-white/70 truncate">
             Forged Day & Night
           </span>
        </div>

        {/* Fluid Typography H1: Scales perfectly from 320px to Ultrawide */}
        <h1 
          className="text-[clamp(2.5rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.04em] max-w-[95vw] lg:max-w-6xl font-normal text-[hsl(var(--foreground))] animate-blur-rise delay-500"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Where <span className="italic text-white/60 px-1 sm:px-2 font-light">dreams</span> rise <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 block sm:inline mt-2 sm:mt-0">through the silence.</span>
        </h1>

        {/* Fluid Typography P */}
        <p className="text-[hsl(var(--muted-foreground))] text-[clamp(0.875rem,2vw,1.125rem)] max-w-[90vw] sm:max-w-xl md:max-w-2xl mt-8 sm:mt-12 leading-[1.6] sm:leading-[1.8] animate-blur-rise delay-700 font-light">
          Built by the relentless, for the relentless. Amid the noise of the world, we forged a digital sanctuary designed for sharp focus, deep thought, and inspired action.
        </p>

        {/* Primary CTA */}
        <div className="mt-10 sm:mt-16 animate-blur-rise delay-1000 flex flex-col items-center gap-4 sm:gap-6 w-full max-w-[280px] sm:max-w-none">
          <button 
            onClick={onLaunch}
            className="liquid-glass rounded-full pl-6 pr-2 py-2 sm:pl-8 sm:pr-3 sm:py-3 text-[12px] sm:text-[14px] uppercase tracking-[0.1em] font-semibold text-[hsl(var(--foreground))] cursor-pointer flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 group"
          >
            <span className="ml-2 sm:ml-0">{isLaunching ? 'Initializing...' : 'Begin Journey'}</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white text-black flex items-center justify-center group-hover:rotate-[-45deg] transition-transform duration-500">
              <ArrowRight size={16} strokeWidth={2.5} className="sm:w-[18px] sm:h-[18px]" />
            </div>
          </button>
          
          <div className="flex items-center gap-3 sm:gap-4 text-white/30 text-[8px] sm:text-[10px] uppercase font-mono tracking-widest w-full justify-center">
            <div className="flex-1 max-w-[20px] sm:max-w-[32px] h-[1px] bg-white/20" />
            <span className="truncate">Secure Connection Established</span>
            <div className="flex-1 max-w-[20px] sm:max-w-[32px] h-[1px] bg-white/20" />
          </div>
        </div>

      </main>

    </div>
  );
}
