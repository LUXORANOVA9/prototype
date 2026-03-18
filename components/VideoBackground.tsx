import React, { useEffect, useState } from 'react';

type Props = {
  poster?: string;
  srcHigh: string;
  srcWebm?: string;
  srcLow?: string;
};

export default function VideoBackground({ poster, srcHigh, srcWebm, srcLow }: Props) {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const choose = () => {
      if (typeof window === 'undefined') return;
      const w = window.innerWidth;
      if (w < 640 && srcLow) setSrc(srcLow);
      else setSrc(srcWebm ?? srcHigh);
    };
    choose();
    window.addEventListener('resize', choose);
    return () => window.removeEventListener('resize', choose);
  }, [srcHigh, srcLow, srcWebm]);

  return (
    <div aria-hidden className="absolute inset-0 w-full h-full overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity grayscale-[30%]"
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#02050A]/95 via-transparent to-[#02050A] pointer-events-none" />
    </div>
  );
}
