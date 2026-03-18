import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Crosshair, ArrowRight, ChevronDown, Cpu, Shield, Zap, Lightbulb, GitMerge, Layers, Rocket } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import HeroContent from './HeroContent';

// --- GLOBAL STYLES & THEME INJECTION ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap');

    :root {
      --background: 210 100% 3%;
      --foreground: 0 0% 100%;
      --muted-foreground: 240 4% 55%;
      --amber: #f59e0b;
      
      --font-display: 'Instrument Serif', serif;
      --font-body: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --font-story: 'Playfair Display', serif;
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
      opacity: 0.035;
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
      background: linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.08) 100%);
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
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
      transform: skewX(-20deg);
      transition: 0.7s ease;
    }
    
    .liquid-glass:hover::after { left: 200%; }
    .liquid-glass:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
      transform: translateY(-2px);
      box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.04), 0 12px 40px -4px rgba(0,0,0,0.6);
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

    /* Selection */
    ::selection {
      background: rgba(245, 158, 11, 0.3);
      color: white;
    }

    /* Optimize Volumetric Glow: Only on devices with a mouse */
    @media (hover: none) and (pointer: coarse) {
      .ambient-glow { display: none !important; }
    }

    /* Scroll reveal */
    .reveal {
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 0.8s cubic-bezier(.16,.84,.24,1), transform 0.8s cubic-bezier(.16,.84,.24,1);
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
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
  const prefersReduced = useReducedMotion();

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

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.15 });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full flex flex-col selection:bg-amber-500/30 bg-[#02050A]">
      <GlobalStyles />
      <div className="film-grain" />

      {/* Ambient Cursor Glow (Hidden on mobile via CSS) */}
      <div 
        ref={cursorRef}
        className="ambient-glow fixed top-0 left-0 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10 transition-opacity duration-1000 mix-blend-screen"
        style={{ willChange: 'transform' }}
      />
      
      {/* Video Background Layer - Fixed to viewport */}
      <div className="fixed inset-0 z-0 w-full h-[100dvh]">
        <video
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover opacity-50 mix-blend-luminosity grayscale-[40%] brightness-[0.6]"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(245,158,11,0.04)_0%,transparent_60%),radial-gradient(ellipse_at_70%_80%,rgba(59,130,246,0.03)_0%,transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02050A]/90 via-[#02050A]/30 to-[#02050A] pointer-events-none" />
      </div>

      {/* --- TELEMETRY HUD FRAMING --- */}
      <div className="fixed inset-4 sm:inset-6 z-20 pointer-events-none flex flex-col justify-between animate-fade-in delay-1000 font-mono text-[8px] sm:text-[10px] text-white/20 tracking-widest uppercase">
        <div className="flex justify-between items-start">
          <div className="hidden md:flex items-center gap-2">
            <Crosshair size={12} className="animate-[spin_10s_linear_infinite]" />
            <span>LAT. 19.2215 N // LON. 73.1645 E</span>
          </div>
          <div className="text-right ml-auto">
            <span className="hidden sm:inline">LUXOR9.AI_FACTORY</span>
            <div className="text-amber-500/40 mt-1 font-mono">{time}</div>
          </div>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="hidden md:flex flex-col gap-1">
            <span>MEM: ALLOCATED</span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              STATUS: ONLINE
            </span>
          </div>
          <div className="mt-auto ml-auto md:ml-0 pointer-events-auto">
            <button 
              className="opacity-40 hover:opacity-100 transition-opacity p-2 -mr-2 sm:mr-0 cursor-pointer" 
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute video" : "Mute video"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </div>
      {/* ----------------------------- */}

      {/* HERO SECTION — The Boy and The Chair */}
      <HeroContent onLaunch={onLaunch} isLaunching={isLaunching} />

      {/* STORY SECTION 1: The Spark */}
      <section className="relative z-30 min-h-screen flex items-center justify-center px-6 py-24 bg-gradient-to-b from-transparent via-[#02050A]/80 to-[#02050A]">
        <div className="max-w-4xl mx-auto text-center reveal">
          <motion.div
            initial={prefersReduced ? undefined : { opacity: 0, y: 40, filter: 'blur(10px)' }}
            whileInView={prefersReduced ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-8 h-[1px] bg-amber-500/40"></div>
              <span className="text-[10px] font-mono text-amber-500/60 tracking-[0.3em] uppercase">Chapter 01</span>
              <div className="w-8 h-[1px] bg-amber-500/40"></div>
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl mb-8 text-white" style={{ fontFamily: 'var(--font-display)' }}>
              The <span className="italic text-white/50">Spark</span>
            </h2>
            <div className="w-12 h-[1px] bg-amber-500/40 mx-auto mb-10" />
            <p className="text-lg md:text-2xl text-[hsl(var(--muted-foreground))] font-light leading-relaxed md:leading-loose">
              It started with a question. Not a grand one — just a small, nagging thought
              that kept him up at night: <em className="text-white/60" style={{ fontFamily: 'var(--font-story)' }}>"What if I could make the computer think?"</em>
              He didn't have answers. He had curiosity. And sometimes, that's more than enough.
            </p>
          </motion.div>
        </div>
      </section>

      {/* STORY SECTION 2: The Factory Floor */}
      <section className="relative z-30 min-h-screen flex items-center justify-center px-6 py-24 bg-black/40 backdrop-blur-md border-y border-white/5">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={prefersReduced ? undefined : { opacity: 0, y: 40 }}
            whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16 reveal"
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-8 h-[1px] bg-amber-500/40"></div>
              <span className="text-[10px] font-mono text-amber-500/60 tracking-[0.3em] uppercase">Chapter 02</span>
              <div className="w-8 h-[1px] bg-amber-500/40"></div>
            </div>
            <h2 className="text-3xl md:text-5xl text-white" style={{ fontFamily: 'var(--font-display)' }}>
              The <span className="italic text-white/50">Factory</span> Floor
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-6 max-w-2xl mx-auto font-light text-lg">
              What began as a single screen became a command center. Agents assembled at his fingertips —
              each one a specialist, each one waiting for direction.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Zap,
                title: "Neural Velocity",
                desc: "Thought-to-action latency reduced to absolute zero. The factory processes your intent before you finish typing."
              },
              {
                icon: Cpu,
                title: "Architectural Purity",
                desc: "Built on uncompromising, brutalist design. Every pixel serves a purpose. No excess. No noise."
              },
              {
                icon: Shield,
                title: "Cognitive Isolation",
                desc: "A walled garden shielding your focus from the chaos of the web. Enter the flow state and remain there."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={prefersReduced ? undefined : { opacity: 0, y: 30, filter: 'blur(10px)' }}
                whileInView={prefersReduced ? undefined : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: idx * 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="liquid-glass p-8 md:p-10 rounded-2xl flex flex-col items-start text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/8 border border-amber-500/15 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-500">
                  <feature.icon size={20} className="text-amber-500" />
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

      {/* STORY SECTION 3: The Protocol (Timeline) */}
      <section className="relative z-30 min-h-screen flex flex-col items-center justify-center px-6 py-32 bg-[#02050A]">
        <div className="max-w-5xl mx-auto w-full relative">
          <motion.div
            initial={prefersReduced ? undefined : { opacity: 0, y: 40 }}
            whileInView={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-24 reveal"
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-8 h-[1px] bg-amber-500/40"></div>
              <span className="text-[10px] font-mono text-amber-500/60 tracking-[0.3em] uppercase">Chapter 03</span>
              <div className="w-8 h-[1px] bg-amber-500/40"></div>
            </div>
            <h2 className="text-4xl md:text-6xl text-white" style={{ fontFamily: 'var(--font-display)' }}>
              The <span className="italic text-white/50">Protocol</span>
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-6 max-w-2xl mx-auto font-light text-lg">
              Raw chaos in. Structured brilliance out. The boy built a system that could take
              a vague idea and turn it into something real. Something deployable.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Central Line */}
            <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-amber-500/30 to-transparent md:-translate-x-1/2" />

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
                title: "Factory Deployment",
                desc: "The blueprint materializes. Ideas are translated into actionable, deployable reality at the speed of thought.",
                icon: Rocket
              }
            ].map((step, idx) => (
              <div key={idx} className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 mb-20 last:mb-0 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Timeline Node */}
                <div className="absolute left-0 md:left-1/2 w-14 h-14 rounded-full bg-[#02050A] border border-amber-500/20 flex items-center justify-center md:-translate-x-1/2 z-10 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <step.icon size={18} className="text-amber-500" />
                  </div>
                </div>

                {/* Content */}
                <motion.div 
                  initial={prefersReduced ? undefined : { opacity: 0, x: idx % 2 === 0 ? 40 : -40, filter: 'blur(10px)' }}
                  whileInView={prefersReduced ? undefined : { opacity: 1, x: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`ml-20 md:ml-0 w-full md:w-1/2 ${idx % 2 === 0 ? 'md:pl-16 text-left' : 'md:pr-16 md:text-right'}`}
                >
                  <div className="liquid-glass p-8 rounded-2xl group hover:border-amber-500/20 transition-colors duration-500">
                    <div className="text-[10px] font-mono text-amber-500 mb-3 tracking-widest uppercase">{step.phase}</div>
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

      {/* STORY SECTION 4: Your Chair Awaits */}
      <section className="relative z-30 min-h-[70vh] flex flex-col items-center justify-center px-6 py-24 text-center bg-gradient-to-t from-[#02050A] to-transparent">
        <motion.div
          initial={prefersReduced ? undefined : { opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          whileInView={prefersReduced ? undefined : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center reveal"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-[1px] bg-amber-500/40"></div>
            <span className="text-[10px] font-mono text-amber-500/60 tracking-[0.3em] uppercase">Chapter 04</span>
            <div className="w-8 h-[1px] bg-amber-500/40"></div>
          </div>
          <h2 className="text-5xl md:text-7xl lg:text-8xl mb-6 text-white" style={{ fontFamily: 'var(--font-display)' }}>
            Your <span className="italic text-white/50">Chair</span> Awaits
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] text-lg max-w-lg mb-12 font-light leading-relaxed" style={{ fontFamily: 'var(--font-story)' }}>
            The boy's story isn't over. It never was his alone.<br/>
            It was always yours too.
          </p>
          
          <button 
            onClick={onLaunch}
            className="liquid-glass rounded-full pl-8 pr-3 py-3 text-[14px] uppercase tracking-[0.15em] font-semibold text-white cursor-pointer flex items-center justify-between gap-8 group"
          >
            <span>{isLaunching ? 'Initializing...' : 'Enter the Factory'}</span>
            <div className="w-12 h-12 shrink-0 rounded-full bg-amber-500 text-black flex items-center justify-center group-hover:rotate-[-45deg] transition-transform duration-500">
              <ArrowRight size={20} strokeWidth={2.5} />
            </div>
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-30 border-t border-white/5 py-8 px-6 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-mono text-zinc-600 uppercase tracking-widest bg-[#02050A]">
        <div>2026 LUXOR9 AI FACTORY // ALL RIGHTS RESERVED</div>
        <div className="flex gap-8">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>SYSTEM ONLINE</span>
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse"></div>NEURAL CORE ACTIVE</span>
        </div>
      </footer>

    </div>
  );
}
