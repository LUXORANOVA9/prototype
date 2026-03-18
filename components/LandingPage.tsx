import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Crosshair, ArrowRight, ChevronDown, Cpu, Shield, Zap, Lightbulb, GitMerge, Layers, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

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
      overflow-x: hidden;
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
    <div className="relative w-full flex flex-col selection:bg-white/20 bg-[#02050A]">
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
      <div className="fixed inset-4 sm:inset-6 z-20 pointer-events-none flex flex-col justify-between animate-fade-in delay-1000 font-mono text-[8px] sm:text-[10px] text-white/30 tracking-widest uppercase">
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

      {/* HERO SECTION */}
      <section className="relative z-30 min-h-[100dvh] flex flex-col">
        {/* Navigation Bar */}
        <nav className="flex flex-row items-center justify-between px-6 sm:px-8 md:px-16 py-6 sm:py-10 w-full animate-blur-rise delay-100">
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

        {/* Hero Content */}
        <main className="flex flex-col flex-1 items-center justify-center text-center px-4 sm:px-6 pb-24">
          
          {/* Creator Badge */}
          <div className="animate-blur-rise delay-300 mb-6 sm:mb-10 inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-md shadow-2xl overflow-hidden group max-w-[90vw]">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,1)] animate-pulse shrink-0" />
            <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-medium text-white/70 truncate">
              Forged Day & Night
            </span>
          </div>

          {/* Fluid Typography H1 */}
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

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ChevronDown size={24} className="text-white" />
        </div>
      </section>

      {/* STORY SECTION 1: The Genesis */}
      <section className="relative z-30 min-h-screen flex items-center justify-center px-6 py-24 bg-gradient-to-b from-transparent via-[#02050A]/80 to-[#02050A]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-4xl md:text-6xl lg:text-7xl mb-8 text-[hsl(var(--foreground))]" style={{ fontFamily: 'var(--font-display)' }}>
              The Genesis of <span className="italic text-white/50">Silence</span>
            </h2>
            <div className="w-12 h-[1px] bg-blue-500/50 mx-auto mb-10" />
            <p className="text-lg md:text-2xl text-[hsl(var(--muted-foreground))] font-light leading-relaxed md:leading-loose">
              We looked at the digital landscape and saw a wasteland of distraction. Luxor9 was forged as an antidote. A cognitive sanctuary where raw thought crystallizes into execution. No vanity metrics. No algorithmic noise. Just you, the machine, and the work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* STORY SECTION 2: The Arsenal (Grid) */}
      <section className="relative z-30 min-h-screen flex items-center justify-center px-6 py-24 bg-black/40 backdrop-blur-md border-y border-white/5">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl text-[hsl(var(--foreground))]" style={{ fontFamily: 'var(--font-display)' }}>
              Tools for the <span className="italic text-white/50">Relentless</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Zap,
                title: "Neural Velocity",
                desc: "Thought-to-action latency reduced to absolute zero. Our core processes your intent before you finish typing."
              },
              {
                icon: Cpu,
                title: "Architectural Purity",
                desc: "Built on a foundation of uncompromising, brutalist design. Every pixel serves a purpose. No excess."
              },
              {
                icon: Shield,
                title: "Cognitive Isolation",
                desc: "A walled garden shielding your focus from the chaos of the web. Enter the flow state and remain there."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="liquid-glass p-8 md:p-10 rounded-2xl flex flex-col items-start text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <feature.icon size={20} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-[hsl(var(--muted-foreground))] font-light leading-relaxed text-sm md:text-base">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY SECTION 2.5: Brainstorming Steps / Ideation Protocol */}
      <section className="relative z-30 min-h-screen flex flex-col items-center justify-center px-6 py-32 bg-[#02050A]">
        <div className="max-w-5xl mx-auto w-full relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-6xl text-[hsl(var(--foreground))]" style={{ fontFamily: 'var(--font-display)' }}>
              The <span className="italic text-white/50">Ideation</span> Protocol
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-6 max-w-2xl mx-auto font-light text-lg">
              A systematic approach to cognitive extraction. Watch as raw chaos is refined into structured brilliance.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Central Line */}
            <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/30 to-transparent md:-translate-x-1/2" />

            {[
              {
                phase: "Phase 01",
                title: "Signal Extraction",
                desc: "Dump raw, unfiltered thoughts into the void. The engine captures every fragment without judgment or friction.",
                icon: Lightbulb
              },
              {
                phase: "Phase 02",
                title: "Pattern Recognition",
                desc: "The neural core scans the noise, identifying hidden connections and clustering related concepts into logical nodes.",
                icon: GitMerge
              },
              {
                phase: "Phase 03",
                title: "Architectural Synthesis",
                desc: "Nodes are forged into a coherent structure. Chaos becomes a blueprint. Ambiguity becomes a clear roadmap.",
                icon: Layers
              },
              {
                phase: "Phase 04",
                title: "Core Deployment",
                desc: "The blueprint materializes. Ideas are translated into actionable, deployable reality at the speed of thought.",
                icon: Rocket
              }
            ].map((step, idx) => (
              <div key={idx} className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 mb-20 last:mb-0 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Timeline Node */}
                <div className="absolute left-0 md:left-1/2 w-14 h-14 rounded-full bg-[#02050A] border border-white/10 flex items-center justify-center md:-translate-x-1/2 z-10 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <step.icon size={18} className="text-blue-400" />
                  </div>
                </div>

                {/* Content */}
                <motion.div 
                  initial={{ opacity: 0, x: idx % 2 === 0 ? 40 : -40, filter: 'blur(10px)' }}
                  whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`ml-20 md:ml-0 w-full md:w-1/2 ${idx % 2 === 0 ? 'md:pl-16 text-left' : 'md:pr-16 md:text-right'}`}
                >
                  <div className="liquid-glass p-8 rounded-2xl group hover:border-blue-500/30 transition-colors duration-500">
                    <div className="text-[10px] font-mono text-blue-400 mb-3 tracking-widest uppercase">{step.phase}</div>
                    <h3 className="text-2xl font-medium text-white mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{step.title}</h3>
                    <p className="text-[hsl(var(--muted-foreground))] font-light leading-relaxed text-sm md:text-base">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY SECTION 3: Final CTA */}
      <section className="relative z-30 min-h-[70vh] flex flex-col items-center justify-center px-6 py-24 text-center bg-gradient-to-t from-[#02050A] to-transparent">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <h2 className="text-5xl md:text-7xl lg:text-8xl mb-12 text-[hsl(var(--foreground))]" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to <span className="italic text-white/50">Ascend?</span>
          </h2>
          
          <button 
            onClick={onLaunch}
            className="liquid-glass rounded-full pl-8 pr-3 py-3 text-[14px] uppercase tracking-[0.15em] font-semibold text-[hsl(var(--foreground))] cursor-pointer flex items-center justify-between gap-8 group"
          >
            <span>{isLaunching ? 'Initializing...' : 'Enter the Core'}</span>
            <div className="w-12 h-12 shrink-0 rounded-full bg-white text-black flex items-center justify-center group-hover:rotate-[-45deg] transition-transform duration-500">
              <ArrowRight size={20} strokeWidth={2.5} />
            </div>
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-30 border-t border-white/5 py-8 px-6 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest bg-[#02050A]">
        <div>© 2026 LUXOR9.CORE // ALL RIGHTS RESERVED</div>
        <div className="flex gap-8">
          <span className="hover:text-white cursor-pointer transition-colors">SYSTEM STATUS: ONLINE</span>
          <span className="hover:text-white cursor-pointer transition-colors">NEURAL CORE: ACTIVE</span>
        </div>
      </footer>

    </div>
  );
}
