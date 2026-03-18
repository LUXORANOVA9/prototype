import React, { useEffect } from 'react';
import { motion, Variants, useReducedMotion } from 'framer-motion';
import GlassButton from './GlassButton';
import useParallax from '../hooks/useParallax';
import { mark, trackEvent } from '../utils/analytics';

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.3,
    },
  },
};

const itemVariant: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: [0.16, 0.84, 0.24, 1] },
  },
};

const fadeVariant: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, ease: [0.16, 0.84, 0.24, 1] },
  },
};

export default function HeroContent({
  onLaunch,
  isLaunching,
}: {
  onLaunch: () => void;
  isLaunching?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const parallaxRef = useParallax({ strength: 8, enabled: !prefersReduced });

  useEffect(() => {
    mark('hero:mounted');
  }, []);

  const handleCTAClick = () => {
    mark('cta:clicked');
    trackEvent('cta', { label: 'Begin Journey' });
    onLaunch();
  };

  return (
    <section
      ref={parallaxRef}
      className="relative z-30 min-h-[100dvh] flex flex-col"
      aria-labelledby="hero-heading"
    >
      {/* Navigation Bar */}
      <motion.nav
        variants={prefersReduced ? undefined : fadeVariant}
        initial={prefersReduced ? undefined : 'hidden'}
        animate={prefersReduced ? undefined : 'show'}
        className="flex flex-row items-center justify-between px-6 sm:px-8 md:px-16 py-6 sm:py-10 w-full"
      >
        <div
          className="text-xl sm:text-2xl md:text-3xl tracking-tight text-white cursor-pointer select-none flex items-start gap-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Luxor9
          <span className="text-[8px] sm:text-[10px] opacity-60 mt-1 sm:mt-2 font-body font-medium uppercase tracking-widest">
            Ai Factory
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-10 xl:gap-12 text-[11px] xl:text-[12px] uppercase tracking-[0.15em] font-medium text-white/40">
          <a href="#" className="text-white transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-white after:rounded-full">
            Home
          </a>
          <a href="#" className="hover:text-white transition-colors">Factory</a>
          <a href="#" className="hover:text-white transition-colors">Intelligence</a>
          <a href="#" className="hover:text-white transition-colors">Journal</a>
        </div>

        <GlassButton className="rounded-full px-5 sm:px-6 py-2 sm:py-2.5 text-[10px] sm:text-[12px] uppercase tracking-[0.1em] font-medium text-white hidden md:block shrink-0">
          Access Terminal
        </GlassButton>
      </motion.nav>

      {/* Hero Content */}
      <motion.main
        className="flex flex-col flex-1 items-center justify-center text-center px-4 sm:px-6 pb-24"
        variants={prefersReduced ? undefined : containerVariants}
        initial={prefersReduced ? undefined : 'hidden'}
        animate={prefersReduced ? undefined : 'show'}
      >
        {/* Creator Badge */}
        <motion.div
          variants={prefersReduced ? undefined : itemVariant}
          className="mb-6 sm:mb-10 inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 rounded-full border border-white/10 bg-black/20 backdrop-blur-md shadow-2xl overflow-hidden group max-w-[90vw]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,1)] animate-pulse shrink-0" />
          <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-medium text-white/70 truncate">
            A Boy, A Chair, A World of Code
          </span>
        </motion.div>

        {/* Story Heading */}
        <motion.h1
          id="hero-heading"
          variants={prefersReduced ? undefined : itemVariant}
          className="text-[clamp(2.5rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.04em] max-w-[95vw] lg:max-w-6xl font-normal text-white hero-text-backdrop"
          style={{
            fontFamily: 'var(--font-display)',
            letterSpacing: '-2.46px',
            lineHeight: 0.95,
          }}
        >
          He sat down.
          <br />
          <span className="italic text-white/50 px-1 sm:px-2 font-light">The world</span>{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600 block sm:inline mt-2 sm:mt-0">
            changed.
          </span>
        </motion.h1>

        {/* Story Subtext */}
        <motion.p
          variants={prefersReduced ? undefined : itemVariant}
          className="text-white/50 text-[clamp(0.875rem,2vw,1.125rem)] max-w-[90vw] sm:max-w-xl md:max-w-2xl mt-8 sm:mt-12 leading-[1.6] sm:leading-[1.8] font-light"
        >
          In a quiet room, a boy sat before a glowing screen. Fingers resting on the keys. Eyes
          reflecting lines of light. He didn't know it yet — but what he was about to build would
          change everything.
        </motion.p>

        {/* Story Beat 2 */}
        <motion.div
          variants={prefersReduced ? undefined : itemVariant}
          className="mt-8 sm:mt-10 max-w-2xl text-center"
        >
          <p className="text-white/30 text-sm sm:text-base font-light leading-relaxed italic">
            "Every factory begins with a single spark. His was curiosity. The furnace was code. The
            product? A universe."
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={prefersReduced ? undefined : itemVariant}
          className="mt-10 sm:mt-16 flex flex-col items-center gap-4 sm:gap-6 w-full max-w-[280px] sm:max-w-none"
        >
          <GlassButton
            onClick={handleCTAClick}
            className="rounded-full pl-6 pr-2 py-2 sm:pl-8 sm:pr-3 sm:py-3 text-[12px] sm:text-[14px] uppercase tracking-[0.1em] font-semibold text-white cursor-pointer flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6"
          >
            <span className="ml-2 sm:ml-0">
              {isLaunching ? 'Initializing...' : 'Begin Journey'}
            </span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-amber-500 text-black flex items-center justify-center group-hover:rotate-[-45deg] transition-transform duration-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="sm:w-[18px] sm:h-[18px]">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </GlassButton>

          <div className="flex items-center gap-3 sm:gap-4 text-white/30 text-[8px] sm:text-[10px] uppercase font-mono tracking-widest w-full justify-center">
            <div className="flex-1 max-w-[20px] sm:max-w-[32px] h-[1px] bg-white/20" />
            <span className="truncate">Luxor9 Ai Factory — Secure Connection</span>
            <div className="flex-1 max-w-[20px] sm:max-w-[32px] h-[1px] bg-white/20" />
          </div>
        </motion.div>
      </motion.main>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </motion.div>
    </section>
  );
}
