import { useRef, useEffect } from 'react';

/**
 * Hook to apply Luxor9 motion physics to an element.
 * 
 * Usage:
 * const ref = useLuxorMotion({ 
 *   animation: 'scale-in', 
 *   delay: 100, 
 *   duration: 'base' 
 * });
 * <div ref={ref}>Content</div>
 */
export const useLuxorMotion = (config: {
    animation?: 'fade-in' | 'slide-up' | 'scale-in' | 'pulse';
    duration?: 'instant' | 'fast' | 'base' | 'slow' | 'deliberate' | 'cinematic';
    easing?: 'default' | 'entrance' | 'exit' | 'depth';
    delay?: number;
} = {}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const durationVar = `var(--duration-${config.duration || 'base'})`;
        const easingVar = `var(--ease-luxor-${config.easing || 'default'})`;
        
        el.style.transition = `all ${durationVar} ${easingVar}`;
        
        if (config.animation) {
            el.style.animation = `luxor-${config.animation} ${durationVar} ${easingVar} forwards`;
        }
        
        if (config.delay) {
            el.style.animationDelay = `${config.delay}ms`;
            el.style.transitionDelay = `${config.delay}ms`;
        }

    }, [config.animation, config.duration, config.easing, config.delay]);

    return ref;
};
