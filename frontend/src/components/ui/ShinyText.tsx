'use client';

import React from 'react';

interface ShinyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

export default function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = '',
  ...props
}: ShinyTextProps) {
  const animationStyle = disabled
    ? {}
    : {
        animation: `pulse-glow ${speed}s ease-in-out infinite`,
      };

  return (
    <span
      className={`inline-block relative z-10 ${className}`}
      style={animationStyle}
      {...props}
    >
      {text}
      {!disabled && (
        <span 
          className="absolute left-0 top-0 -z-10 w-full h-full blur-[6px] opacity-40 select-none pointer-events-none"
          aria-hidden="true"
        >
          {text}
        </span>
      )}
    </span>
  );
}
