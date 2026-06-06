'use client';

import React from 'react';

interface TireLoaderProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function TireLoader({ size = 'md' }: TireLoaderProps) {
  const sizeClasses = {
    sm: 'w-32 h-20',
    md: 'w-48 h-32',
    lg: 'w-64 h-40',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={sizeClasses[size]}
      >
        <ellipse cx="100" cy="100" rx="20" ry="3" fill="var(--color-navy)" opacity="0.15" />

        <line
          x1="20"
          y1="100"
          x2="180"
          y2="100"
          stroke="var(--color-border)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="8 8"
          className="animate-road-move"
        />

        <g>
          <circle cx="75" cy="95" r="7" fill="var(--color-teal-200)" opacity="0.6" className="smoke-puff-1" />
          <circle cx="75" cy="95" r="9" fill="var(--color-teal-100)" opacity="0.5" className="smoke-puff-2" />
          <circle cx="75" cy="95" r="11" fill="var(--color-foam)" opacity="0.4" className="smoke-puff-3" />
        </g>

        <g className="animate-tire-bounce" style={{ transformOrigin: '100px 75px' }}>
          <g className="animate-tire-spin" style={{ transformOrigin: '100px 75px' }}>
            <circle cx="100" cy="75" r="25" fill="var(--color-navy)" />
            
            <circle cx="100" cy="75" r="24" stroke="var(--color-background)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="100" cy="75" r="22" stroke="var(--color-background)" strokeWidth="1.5" strokeDasharray="6 4" />
            
            <circle cx="100" cy="75" r="15" fill="var(--color-teal-600)" stroke="var(--color-teal-400)" strokeWidth="1" />
            <circle cx="100" cy="75" r="12" fill="var(--color-teal-500)" />
            
            <circle cx="100" cy="75" r="4.5" fill="var(--color-navy)" />
            
            <line x1="100" y1="75" x2="100" y2="63" stroke="var(--color-teal-100)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="100" y1="75" x2="111.4" y2="71.3" stroke="var(--color-teal-100)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="100" y1="75" x2="107.0" y2="84.7" stroke="var(--color-teal-100)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="100" y1="75" x2="93.0" y2="84.7" stroke="var(--color-teal-100)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="100" y1="75" x2="88.6" y2="71.3" stroke="var(--color-teal-100)" strokeWidth="2.5" strokeLinecap="round" />

            <circle cx="100" cy="75" r="2" fill="var(--color-teal-100)" />
          </g>
        </g>
      </svg>
    </div>
  );
}
