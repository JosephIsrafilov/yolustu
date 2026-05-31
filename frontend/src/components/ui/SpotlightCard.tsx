'use client';

import React, { useRef, useState } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string; // Kept for interface compatibility
  className?: string;
}

export default function SpotlightCard({
  children,
  spotlightColor = 'rgba(20,184,166,0.12)',
  className = '',
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl border border-slate-100/50 bg-white p-8 transition-all duration-300 ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40 bg-[linear-gradient(135deg,rgba(20,184,166,0.03)_0%,rgba(99,102,241,0.04)_50%,rgba(236,72,153,0.03)_100%)] bg-[length:200%_200%] z-0"
        style={{
          animation: 'google-aurora 10s ease infinite',
        }}
      />

      {/* Mouse tracking Google-style spotlight radial overlay (Teal -> Indigo -> Rose) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(350px circle at ${position.x}px ${position.y}px, ${spotlightColor} 0%, rgba(99,102,241,0.08) 50%, rgba(236,72,153,0.02) 80%, transparent 100%)`,
        }}
      />

      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}
