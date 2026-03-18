import { useEffect, useRef } from 'react';

type Options = { strength?: number; enabled?: boolean };

export default function useParallax({ strength = 10, enabled = true }: Options = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pos = { x: 0, y: 0, tx: 0, ty: 0 };

  useEffect(() => {
    if (!enabled) return;

    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const py = (e.clientY - rect.top - rect.height / 2) / rect.height;
      pos.x = px * strength;
      pos.y = py * strength;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    const update = () => {
      pos.tx += (pos.x - pos.tx) * 0.12;
      pos.ty += (pos.y - pos.ty) * 0.12;
      if (ref.current) ref.current.style.transform = `translate3d(${pos.tx}px, ${pos.ty}px, 0)`;
      rafRef.current = null;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove as any);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [strength, enabled]);

  return ref;
}
