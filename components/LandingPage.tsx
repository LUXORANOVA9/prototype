// @ts-nocheck
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate, useInView } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, MeshDistortMaterial, Sparkles as Sparkles3D, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { 
  ArrowRight, Terminal, Server, BrainCircuit,
  Database, Hexagon, Sparkles, CheckCircle2, Code, Layers, Zap, Globe
} from 'lucide-react';

const MotionDiv = motion.div as any;
const MotionNav = motion.nav as any;
const MotionSection = motion.section as any;
const MotionP = motion.p as any;
const MotionH2 = motion.h2 as any;

interface Props {
  onLaunch: () => void;
  isLaunching?: boolean;
}

interface ScrollProps {
    scrollContainer?: any; // Changed from RefObject to any to support manual object structure
}

// --- UTILITY: HOOKS ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
};

// --- UTILITY: TEXT DECODER ---
const DecryptText: React.FC<{ text: string; className?: string; revealDelay?: number; parentHover?: boolean; animateOnView?: boolean }> = ({ text, className, revealDelay = 0, parentHover, animateOnView }) => {
  const [displayText, setDisplayText] = useState(text);
  const [hasAnimated, setHasAnimated] = useState(false);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_!@#$%^&*";
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20%" });

  useEffect(() => {
      if (animateOnView && !hasAnimated) {
          setDisplayText(text.split('').map(() => chars[Math.floor(Math.random() * chars.length)]).join(''));
      }
  }, [animateOnView, hasAnimated, text]);

  useEffect(() => {
    const shouldAnimate = parentHover || (animateOnView && isInView);
    if (shouldAnimate) {
        let iteration = 0;
        const interval = setInterval(() => {
          setDisplayText(text
            .split("")
            .map((letter, index) => {
              if (index < iteration) return text[index];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
          );
          if (iteration >= text.length) {
              clearInterval(interval);
              setHasAnimated(true);
          }
          iteration += 1 / 3;
        }, 30);
        return () => clearInterval(interval);
    } else if (!hasAnimated && !animateOnView) {
        setDisplayText(text);
    }
  }, [parentHover, isInView, animateOnView, text, hasAnimated]);

  return <span ref={ref} className={className}>{displayText}</span>;
};

// --- UTILITY: CUSTOM CURSOR ---
const CustomCursor: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') || 
        target.closest('a') || 
        target.closest('.cursor-interactive') ||
        target.classList.contains('cursor-pointer');
        
      setIsHovering(!!isClickable);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <>
      <MotionDiv
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-amber-500 rounded-full pointer-events-none z-[100] mix-blend-difference"
        animate={{ x: mousePosition.x - 3, y: mousePosition.y - 3 }}
        transition={{ type: 'tween', ease: 'linear', duration: 0 }}
      />
      <MotionDiv
        className="fixed top-0 left-0 w-8 h-8 border border-white/40 rounded-full pointer-events-none z-[100] mix-blend-difference"
        animate={{ 
            x: mousePosition.x - 16, 
            y: mousePosition.y - 16,
            scale: isHovering ? 1.8 : 1,
            borderColor: isHovering ? 'rgba(245, 158, 11, 0.8)' : 'rgba(255, 255, 255, 0.3)',
            borderWidth: isHovering ? '2px' : '1px',
            backgroundColor: isHovering ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
        }}
        transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      />
    </>
  );
};

// --- 3D COMPONENTS ---

const NeuralOrb = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
        meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh ref={meshRef}>
            <icosahedronGeometry args={[1.5, 15]} />
            <MeshDistortMaterial
                color="#09090b"
                envMapIntensity={0.8}
                clearcoat={1}
                clearcoatRoughness={0.1}
                metalness={0.95}
                roughness={0.1}
                distort={0.4}
                speed={1.5}
            />
        </mesh>
        <mesh scale={1.8} rotation={[0.5, 0.5, 0]}>
            <icosahedronGeometry args={[1, 2]} />
            <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.03} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={2.5}>
            <torusGeometry args={[1, 0.005, 16, 100]} />
            <meshBasicMaterial color="#71717a" transparent opacity={0.2} />
        </mesh>
    </Float>
  );
};

const ScrollCrystal = ({ scrollYProgress }: { scrollYProgress: any }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [rotationSpeed] = useState(0.2);

    useFrame((state, delta) => {
        if (meshRef.current) {
            const scroll = scrollYProgress.get();
            meshRef.current.rotation.x += delta * rotationSpeed + (scroll * 0.1);
            meshRef.current.rotation.y += delta * (rotationSpeed * 0.5) + (scroll * 0.2);
            
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05 + (scroll * 0.3);
            meshRef.current.scale.setScalar(pulse);
        }
    });

    return (
        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[1.5, 1]} />
                <MeshDistortMaterial 
                    color="#f59e0b" 
                    emissive="#b45309"
                    emissiveIntensity={0.2}
                    wireframe 
                    transparent 
                    opacity={0.15} 
                    distort={0.4}
                    speed={2}
                />
            </mesh>
            <mesh scale={0.5}>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.2} />
            </mesh>
        </Float>
    )
}

const FeatureShape = () => {
  return (
    <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
        <mesh rotation={[0.5, 0.5, 0]}>
            <torusKnotGeometry args={[1.5, 0.3, 100, 16]} />
            <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.08} />
        </mesh>
    </Float>
  )
}

const Scene3D = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }} dpr={[1, 2]} gl={{ powerPreference: "high-performance", alpha: true }}>
            <Suspense fallback={null}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1.5} color="#f59e0b" />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
                
                <NeuralOrb />
                <Sparkles3D count={80} scale={8} size={2} speed={0.4} opacity={0.3} color="#f59e0b" />
                
                <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
                <fog attach="fog" args={['#050505', 5, 20]} />
            </Suspense>
        </Canvas>
    </div>
  );
};

const SecondaryScene3D = () => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }} gl={{ alpha: true }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <FeatureShape />
                </Suspense>
            </Canvas>
        </div>
    )
}

const NarrativeScene3D = ({ scrollYProgress }: { scrollYProgress: any }) => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-80 h-full w-full">
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }} gl={{ alpha: true }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.8} />
                    <ScrollCrystal scrollYProgress={scrollYProgress} />
                </Suspense>
            </Canvas>
        </div>
    )
}

// --- UTILITY: 3D TILT SPOTLIGHT CARD ---
const SpotlightCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; borderBeam?: boolean }> = ({ children, className = "", onClick, borderBeam }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isMobile = useIsMobile();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [5, -5]); 
  const rotateY = useTransform(x, [-0.5, 0.5], [-5, 5]);

  useEffect(() => {
    if (!isMobile) return;
    let frameId: number;
    const animate = () => {
        const time = Date.now() / 2500;
        const radius = 80;
        mouseX.set(150 + Math.cos(time) * radius);
        mouseY.set(150 + Math.sin(time) * radius);
        frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isMobile, mouseX, mouseY]);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    if (isMobile) return;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
    x.set((clientX - left) / width - 0.5);
    y.set((clientY - top) / height - 0.5);
  }

  function handleMouseLeave() {
      if (isMobile) return;
      x.set(0);
      y.set(0);
  }

  return (
    <MotionDiv
      style={{ 
          rotateX: isMobile ? 0 : rotateX, 
          rotateY: isMobile ? 0 : rotateY, 
          transformStyle: "preserve-3d" 
      }}
      className={`group relative border border-zinc-800 bg-zinc-900/50 overflow-hidden perspective-1000 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <MotionDiv
        className={`pointer-events-none absolute -inset-px transition duration-300 z-10 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${isMobile ? '300px' : '400px'} circle at ${mouseX}px ${mouseY}px,
              rgba(245, 158, 11, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      {borderBeam && (
          <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute inset-0 rounded-xl [mask:linear-gradient(white,white)] content-[''] before:absolute before:inset-0 before:bg-[conic-gradient(from_0deg,transparent_0_340deg,#f59e0b_360deg)] before:animate-[border-beam_4s_linear_infinite] before:[mask:linear-gradient(white,white)] before:[mask-composite:exclude] before:p-[1px]"></div>
          </div>
      )}
      <div className="relative h-full z-20 cursor-interactive" style={{ transform: isMobile ? "none" : "translateZ(20px)" }}>{children}</div>
      <style>{`
        @keyframes border-beam {
            100% { transform: rotate(1turn); }
        }
      `}</style>
    </MotionDiv>
  );
};

// --- COMPONENTS ---

const NavHeader: React.FC<{ onLaunch: () => void }> = ({ onLaunch }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <MotionNav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl h-16 flex items-center pt-safe pointer-events-none"
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between pointer-events-auto">
        <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={onLaunch}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-white brand-font tracking-widest group-hover:border-amber-500/50 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all duration-300">
            L9
            </div>
            <span className="font-bold text-zinc-200 tracking-[0.2em] brand-font text-xs group-hover:text-white transition-colors hidden sm:block">
                <DecryptText text="OVERSEER" parentHover={isHovered} />
            </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={onLaunch} className="hidden sm:flex text-[10px] font-mono text-zinc-500 hover:text-white uppercase tracking-widest gap-2 items-center transition-colors">
            <Terminal size={12} /> Read Protocol
            </button>
            <button 
            onClick={onLaunch}
            className="bg-zinc-100 hover:bg-white text-black px-4 sm:px-5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-[0.15em] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] cursor-pointer"
            >
            Initialize <ArrowRight size={12} />
            </button>
        </div>
        </div>
    </MotionNav>
  );
};

const HeroCanvas: React.FC<{ onLaunch: () => void } & ScrollProps & { isLaunching?: boolean }> = ({ onLaunch, scrollContainer, isLaunching }) => {
  const { scrollY } = useScroll({ container: scrollContainer });
  const yText = useTransform(scrollY, [0, 500], [0, 150]);
  const opacityText = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 overflow-hidden bg-[#050505]">
      <Scene3D />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] z-0"></div>
      <div className="relative z-10 text-center max-w-5xl mx-auto perspective-1000 pt-20 pointer-events-none w-full">
        <MotionDiv style={{ y: yText, opacity: opacityText }} className="flex flex-col items-center">
            <MotionDiv 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[9px] sm:text-[10px] font-mono text-amber-500 mb-6 sm:mb-8 backdrop-blur-md shadow-lg ring-1 ring-amber-500/20 pointer-events-auto"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-[pulse_2s_infinite]"></div>
              SYSTEM STANDBY // AWAITING DIRECTIVE
            </MotionDiv>
            <MotionDiv 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 mb-6 sm:mb-8 brand-font tracking-tight leading-[1] sm:leading-[0.9] flex flex-col items-center gap-2 sm:gap-0 pointer-events-auto w-full"
            >
              <div className="relative group cursor-default">
                  <DecryptText text="ORCHESTRATE" className="text-zinc-100" parentHover={true} />
                  <div className="absolute -inset-1 bg-white/5 filter blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <span className="text-zinc-600">INTELLIGENCE</span>
              <span className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl mt-2 text-zinc-700">AT SCALE.</span>
            </MotionDiv>
            <MotionP 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base md:text-xl text-zinc-400 max-w-xl mx-auto mb-10 sm:mb-12 font-light leading-relaxed px-4 pointer-events-auto"
            >
              The first operating system for agentic workflows. Decompose goals, assign roles, and execute enterprise operations from one neural interface.
            </MotionP>
            <MotionDiv 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-6 pointer-events-auto"
            >
              <button onClick={onLaunch} className="group relative w-full sm:w-auto px-8 py-4 bg-zinc-100 text-black rounded-sm font-bold text-xs uppercase tracking-[0.2em] hover:bg-white transition-all overflow-hidden shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] active:scale-95">
                <span className="relative z-10 flex items-center justify-center gap-2">Initialize System</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              </button>
              <button onClick={onLaunch} className="w-full sm:w-auto px-8 py-4 bg-transparent border border-zinc-800 text-zinc-400 rounded-sm font-bold text-xs uppercase tracking-[0.2em] hover:border-zinc-600 hover:text-white transition-all font-mono flex items-center justify-center gap-2 hover:bg-zinc-900 cursor-interactive active:scale-95">
                <span className="animate-pulse">_</span> READ_PROTOCOL
              </button>
            </MotionDiv>
        </MotionDiv>
      </div>
    </section>
  );
};

const TrustStrip: React.FC = () => {
    const brands = ['ACME_CORP', 'SIRIUS_CYBERNETICS', 'TYRELL', 'MASSIVE_DYNAMIC', 'CYBERDYNE', 'WEYLAND', 'SOYLENT', 'UMBRELLA'];
    return (
        <MotionSection 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="py-8 border-b border-white/5 bg-[#050505] relative z-20 overflow-hidden cursor-default pointer-events-none"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505] z-10 pointer-events-none"></div>
            <div className="flex gap-16 animate-marquee whitespace-nowrap min-w-full">
                {[...brands, ...brands].map((name, i) => (
                    <div key={i} className="flex items-center gap-3 group cursor-default opacity-30 hover:opacity-100 transition-opacity duration-500">
                        <Hexagon size={16} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
                        <span className="text-[10px] font-bold brand-font text-zinc-600 tracking-[0.2em] group-hover:text-zinc-300 transition-colors">{name}</span>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .animate-marquee { animation: marquee 60s linear infinite; }
            `}</style>
        </MotionSection>
    );
};

const ScrollNarrative: React.FC<{ onLaunch: () => void } & ScrollProps> = ({ onLaunch, scrollContainer }) => {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: targetRef, container: scrollContainer, offset: ["start start", "end end"] });
  const isMobile = useIsMobile();

  const op1 = useTransform(scrollYProgress, [0, 0.15], [1, 0]); 
  const op2 = useTransform(scrollYProgress, [0.1, 0.25, 0.4], [0, 1, 0]); 
  const op3 = useTransform(scrollYProgress, [0.35, 0.5, 0.65], [0, 1, 0]); 
  const op4 = useTransform(scrollYProgress, [0.6, 0.75, 0.9], [0, 1, 0]); 
  const op5 = useTransform(scrollYProgress, [0.85, 1], [0, 1]); 
  
  const yParallax = useTransform(scrollYProgress, [0.6, 0.9], isMobile ? [0, 0] : [100, -100]);
  const scale = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <div ref={targetRef} className="h-[400vh] bg-[#050505] relative z-10">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden flex flex-col items-center justify-center">
        <NarrativeScene3D scrollYProgress={scrollYProgress} />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-zinc-800 to-transparent -translate-x-1/2"></div>
        <div className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 h-32 w-0.5 bg-zinc-900 hidden md:block rounded-full overflow-hidden">
          <MotionDiv style={{ scaleY: scale, transformOrigin: "top" }} className="w-full h-full bg-amber-500"></MotionDiv>
        </div>

        <MotionDiv style={{ opacity: op1 }} className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
           <div className="font-mono text-xl sm:text-3xl md:text-5xl font-bold text-white tracking-tighter text-center relative max-w-lg md:max-w-none bg-[#050505]/90 p-8 border border-white/5 rounded-xl shadow-2xl backdrop-blur-md">
              <span className="text-zinc-600 mr-4">{">"}</span>Goal: Build Fintech MVP<span className="animate-pulse ml-1 text-amber-500">_</span>
           </div>
        </MotionDiv>

        <MotionDiv style={{ opacity: op2 }} className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
            <div className="relative flex flex-col items-center w-full max-w-4xl">
                <div className="mt-8 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-12 lg:gap-24 text-center z-10 w-full max-w-sm md:max-w-none">
                    {[{icon:Code, l:"Frontend"}, {icon:Database, l:"Data Schema"}, {icon:Server, l:"Infra"}].map((n, i) => (
                        <div key={i} className="flex flex-row md:flex-col items-center md:justify-center gap-4 bg-black/80 md:bg-transparent p-4 md:p-0 rounded-xl md:rounded-none border md:border-none border-white/10 backdrop-blur-md">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-300 shadow-[0_0_30px_rgba(255,255,255,0.05)] ring-1 ring-white/10 relative overflow-hidden group shrink-0">
                                <n.icon size={20} className="relative z-10 group-hover:text-white transition-colors md:w-6 md:h-6" />
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-black/50 px-2 py-1 rounded w-full md:w-auto">{n.l}</div>
                        </div>
                    ))}
                </div>
            </div>
        </MotionDiv>

        <MotionDiv style={{ opacity: op3 }} className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
            <MotionDiv style={{ y: yParallax }} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl pointer-events-auto">
                {['DEVELOPER', 'ANTIGRAVITY', 'VISIONARY'].map((role, i) => (
                    <SpotlightCard key={i} className={`p-6 rounded-xl backdrop-blur-md shadow-2xl relative overflow-hidden transform transition-all duration-500 bg-black/80 ${i === 1 ? 'md:-mt-12' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-[10px] font-bold text-amber-500 tracking-widest">{role}.EXE</div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>
                        <div className="space-y-3 font-mono text-[10px] text-zinc-400">
                            <div className="flex gap-2"><span className="text-zinc-600">{">"}</span> context: 128k</div>
                            <div className="flex gap-2"><span className="text-zinc-600">{">"}</span> task_id: {8000+i}</div>
                            <div className="text-emerald-500/70 pt-2">... execution_stream_active ...</div>
                        </div>
                    </SpotlightCard>
                ))}
            </MotionDiv>
        </MotionDiv>

        <MotionDiv style={{ opacity: op4 }} className="absolute inset-0 flex items-center justify-center pointer-events-none px-4">
             <div className="w-full max-w-3xl aspect-video bg-[#09090b] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden font-mono text-xs p-4 md:p-6 text-zinc-400 ring-1 ring-white/10 relative">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                 <div className="space-y-2 relative z-10">
                     <div className="flex justify-between border-b border-white/5 pb-2 mb-4">
                         <span>STDOUT</span>
                         <span className="text-emerald-500">EXEC_COMPLETE</span>
                     </div>
                     <div className="text-white">{">"} merging artifacts...</div>
                     <div className="text-emerald-500">[SUCCESS] frontend_bundle built (42ms)</div>
                     <div className="text-emerald-500">[SUCCESS] db_schema applied (12ms)</div>
                     <div className="text-emerald-500">[SUCCESS] infra_provisioned: us-east-1</div>
                 </div>
             </div>
        </MotionDiv>

        <MotionDiv style={{ opacity: op5 }} className="absolute inset-0 flex items-center justify-center pointer-events-auto px-6">
             <div className="text-center">
                 <div className="text-sm font-mono text-zinc-500 mb-6 uppercase tracking-widest">Awaiting Input.</div>
                 <button onClick={onLaunch} className="group relative px-12 py-6 bg-white text-black font-bold text-sm tracking-[0.2em] uppercase rounded-sm overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_50px_rgba(255,255,255,0.15)] active:scale-95">
                     <span className="relative z-10">Access Console</span>
                     <div className="absolute inset-0 bg-amber-500 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                 </button>
             </div>
        </MotionDiv>
      </div>
    </div>
  );
};

const FeatureDeepDive: React.FC = () => {
  return (
    <section className="py-24 bg-[#050505] border-t border-white/5 relative z-10 overflow-hidden">
        <SecondaryScene3D />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-20 text-center">
                <MotionH2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 brand-font mb-6"
                >
                    <DecryptText text="NEURAL ARCHITECTURE" animateOnView />
                </MotionH2>
                <p className="text-zinc-500 max-w-2xl mx-auto text-lg">Stop managing prompts. Start managing architecture.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SpotlightCard className="rounded-2xl p-8 md:p-10 min-h-[320px] h-auto flex flex-col justify-between bg-zinc-900/40">
                    <div>
                        <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-amber-500">
                            <BrainCircuit size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Context Retention</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">Persistent vector memory allows Luxor9 to recall project details, user preferences, and past decisions across sessions.</p>
                    </div>
                </SpotlightCard>
                <SpotlightCard className="rounded-2xl p-8 md:p-10 min-h-[320px] h-auto flex flex-col justify-between bg-zinc-900/40">
                    <div>
                        <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-blue-500">
                            <Layers size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Multi-Agent Swarm</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">Specialized sub-agents (Director, Researcher, Developer) execute tasks in parallel, coordinated by the Overseer.</p>
                    </div>
                </SpotlightCard>
                <SpotlightCard className="rounded-2xl p-8 md:p-10 min-h-[320px] h-auto flex flex-col justify-between bg-zinc-900/40">
                    <div>
                        <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-purple-500">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Real-time Canvas</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">Generates live React components, Mermaid diagrams, and HTML artifacts instantly in a secure sandbox.</p>
                    </div>
                </SpotlightCard>
            </div>
        </div>
    </section>
  );
};

const LandingPage: React.FC<Props> = ({ onLaunch, isLaunching }) => {
    // State-based ref to ensure the container element is mounted before children try to attach scroll listeners
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Synchronously update the ref object to avoid race conditions with child effects
    if (scrollEl) {
        // @ts-ignore
        scrollRef.current = scrollEl;
    }

    return (
        <div className="relative h-screen w-full bg-[#050505] overflow-hidden text-white selection:bg-amber-500/30">
            <NavHeader onLaunch={onLaunch} />
            
            <div 
                ref={setScrollEl} 
                className="absolute inset-0 overflow-y-auto overflow-x-hidden custom-scrollbar scroll-smooth"
            >
                {/* Only render scroll-dependent components when the container ref is available */}
                {scrollEl && (
                    <>
                        <HeroCanvas onLaunch={onLaunch} scrollContainer={scrollRef} isLaunching={isLaunching} />
                        <TrustStrip />
                        <ScrollNarrative onLaunch={onLaunch} scrollContainer={scrollRef} />
                        <FeatureDeepDive />
                        
                        <footer className="py-12 border-t border-white/5 bg-black text-center relative z-10">
                            <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-4">Luxor9 Neural Architecture</div>
                            <div className="text-zinc-800 text-[10px]">© 2024 SYSTEM_CORE</div>
                        </footer>
                    </>
                )}
            </div>
            
            <CustomCursor />
        </div>
    );
};

export default LandingPage;
