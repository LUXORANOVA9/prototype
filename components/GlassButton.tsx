import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function GlassButton({ children, className = '', ...rest }: Props) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((s) => s.id !== id)), 650);
  };

  return (
    <motion.button
      {...rest}
      onClick={(e) => {
        createRipple(e as any);
        if (rest.onClick) rest.onClick(e);
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`relative overflow-hidden liquid-glass inline-flex items-center justify-center rounded-full transition-transform shadow-sm border-root cursor-pointer ${className}`}
    >
      {/* Edge light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          boxShadow: 'inset 0 0 18px rgba(255,255,255,0.03), 0 1px 0 rgba(255,255,255,0.02)',
        }}
      />
      {children}
      {/* Ripples */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ opacity: 0.35, scale: 0 }}
            animate={{ opacity: 0, scale: 2.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 0.84, 0.24, 1] }}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: 160,
              height: 160,
              borderRadius: 999,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle at center, rgba(255,255,255,0.06), rgba(255,255,255,0.02) 60%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
