'use client';

import React, { useRef, useState } from 'react';

interface MagneticButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export default function MagneticButton({ 
  children, 
  strength = 15, 
  className = '',
  ...props 
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    const distanceX = (clientX - centerX) / (width / 2);
    const distanceY = (clientY - centerY) / (height / 2);

    setPosition({ 
      x: distanceX * strength, 
      y: distanceY * strength 
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block transition-transform duration-300 ease-out ${className}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      {...props}
    >
      <div 
        className="transition-transform duration-300 ease-out w-full h-full"
        style={{ transform: `translate(${position.x * 0.3}px, ${position.y * 0.3}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
