'use client';

import React, { useEffect, useState } from 'react';

const CITIES = [
  { id: 'baku', x: 700, y: 300, name: 'Baku', size: 12 },
  { id: 'sumqayit', x: 670, y: 260, name: 'Sumqayit', size: 8 },
  { id: 'quba', x: 590, y: 150, name: 'Quba', size: 6 },
  { id: 'shamakhi', x: 580, y: 280, name: 'Shamakhi', size: 6 },
  { id: 'shirvan', x: 550, y: 400, name: 'Shirvan', size: 6 },
  { id: 'lankaran', x: 620, y: 550, name: 'Lankaran', size: 8 },
  { id: 'mingachevir', x: 350, y: 250, name: 'Mingachevir', size: 8 },
  { id: 'yevlakh', x: 380, y: 280, name: 'Yevlakh', size: 6 },
  { id: 'shaki', x: 380, y: 150, name: 'Shaki', size: 8 },
  { id: 'ganja', x: 250, y: 220, name: 'Ganja', size: 10 },
  { id: 'qazakh', x: 120, y: 180, name: 'Qazakh', size: 6 },
  { id: 'nakhchivan', x: 150, y: 500, name: 'Nakhchivan', size: 8 },
];

const ROUTES = [
  { from: 'baku', to: 'quba', curve: -40 },
  { from: 'baku', to: 'sumqayit', curve: -10 },
  { from: 'baku', to: 'shamakhi', curve: 20 },
  { from: 'baku', to: 'shirvan', curve: -30 },
  { from: 'baku', to: 'lankaran', curve: 60 },
  { from: 'shamakhi', to: 'yevlakh', curve: 10 },
  { from: 'shirvan', to: 'yevlakh', curve: -20 },
  { from: 'yevlakh', to: 'mingachevir', curve: -10 },
  { from: 'mingachevir', to: 'shaki', curve: -20 },
  { from: 'mingachevir', to: 'ganja', curve: 20 },
  { from: 'ganja', to: 'qazakh', curve: -30 },
  { from: 'baku', to: 'ganja', curve: 100, main: true },
  { from: 'baku', to: 'nakhchivan', curve: -120, dashed: true },
];

export default function HeroMap() {
  const [activeRoute, setActiveRoute] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRoute(prev => (prev + 1) % ROUTES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full rounded-3xl bg-navy/40 border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.1)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Grid background for technical feel */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

      <svg viewBox="0 0 800 600" className="w-full h-full max-w-[120%] scale-110 sm:scale-100" style={{ filter: 'drop-shadow(0 0 20px rgba(20, 184, 166, 0.1))' }}>
        {ROUTES.map((route, i) => {
          const from = CITIES.find(c => c.id === route.from);
          const to = CITIES.find(c => c.id === route.to);
          if (!from || !to) return null;
          
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const normalX = -dy;
          const normalY = dx;
          const len = Math.sqrt(dx*dx + dy*dy);
          const cpX = midX + (normalX / len) * route.curve;
          const cpY = midY + (normalY / len) * route.curve;

          const pathD = `M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`;
          const isActive = i === activeRoute || route.main;

          return (
            <g key={i}>
              <path
                d={pathD}
                fill="none"
                stroke="rgba(20, 184, 166, 0.15)"
                strokeWidth={route.main ? 3 : 1.5}
                strokeDasharray={route.dashed ? "6 6" : "none"}
              />
              {isActive && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#5eead4"
                  strokeWidth={route.main ? 3 : 2}
                  className="animate-draw-line"
                  strokeDasharray={route.dashed ? "6 6" : "none"}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(94, 234, 212, 0.6))' }}
                />
              )}
            </g>
          );
        })}
        {CITIES.map((city) => {
          const isActive = ROUTES[activeRoute]?.from === city.id || ROUTES[activeRoute]?.to === city.id || city.id === 'baku';
          return (
            <g key={city.id} className="transition-all duration-700 ease-in-out">
               {isActive && (
                  <circle cx={city.x} cy={city.y} r={city.size * 2.5} fill="rgba(20, 184, 166, 0.2)" className="animate-pulse-glow" />
               )}
               <circle 
                  cx={city.x} 
                  cy={city.y} 
                  r={city.size} 
                  fill={isActive ? '#5eead4' : '#0f172a'} 
                  stroke={isActive ? '#14b8a6' : 'rgba(20, 184, 166, 0.3)'} 
                  strokeWidth="2" 
                  className="transition-colors duration-500"
               />
               {(city.size >= 8 || isActive) && (
                 <text
                    x={city.x}
                    y={city.y - city.size - 8}
                    fill={isActive ? '#ffffff' : 'rgba(20, 184, 166, 0.6)'}
                    fontSize={city.size >= 10 ? "16" : "12"}
                    fontWeight={isActive ? "700" : "500"}
                    textAnchor="middle"
                    className="font-sans transition-all duration-500"
                    style={{ filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' : 'none' }}
                 >
                   {city.name}
                 </text>
               )}
            </g>
          )
        })}
      </svg>
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-navy via-transparent to-transparent pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_700px_300px,rgba(20,184,166,0.15),transparent_300px)] pointer-events-none" />
    </div>
  );
}
