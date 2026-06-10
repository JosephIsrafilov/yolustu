'use client';

import React, { useEffect, useState } from 'react';

type HeroRoute = {
  from: string;
  to: string;
  curve: number;
  dur: number;
  del: number;
  main?: boolean;
  dashed?: boolean;
};

const CITIES = [
  { id: 'baku', x: 700, y: 300, name: 'Baku', size: 12 },
  { id: 'sumqayit', x: 670, y: 260, name: 'Sumgayit', size: 8 },
  { id: 'quba', x: 590, y: 150, name: 'Quba', size: 6 },
  { id: 'shamakhi', x: 580, y: 280, name: 'Shamakhi', size: 6 },
  { id: 'goychay', x: 450, y: 280, name: 'Goychay', size: 6 },
  { id: 'shirvan', x: 550, y: 400, name: 'Shirvan', size: 6 },
  { id: 'lankaran', x: 620, y: 540, name: 'Lankaran', size: 8 },
  { id: 'mingachevir', x: 350, y: 250, name: 'Mingachevir', size: 8 },
  { id: 'yevlakh', x: 380, y: 280, name: 'Yevlakh', size: 6 },
  { id: 'shaki', x: 380, y: 150, name: 'Shaki', size: 8 },
  { id: 'barda', x: 300, y: 300, name: 'Barda', size: 6 },
  { id: 'agdam', x: 270, y: 330, name: 'Agdam', size: 6 },
  { id: 'shusha', x: 250, y: 370, name: 'Shusha', size: 8 },
  { id: 'fuzuli', x: 300, y: 420, name: 'Fuzuli', size: 6 },
  { id: 'ganja', x: 250, y: 220, name: 'Ganja', size: 10 },
] as const;

const ROUTES: HeroRoute[] = [
  { from: 'baku', to: 'sumqayit', curve: -10, dur: 2, del: 0.2 },
  { from: 'baku', to: 'quba', curve: -36, dur: 3.4, del: 0.4 },
  { from: 'baku', to: 'shamakhi', curve: 18, dur: 2.5, del: 0.6 },
  { from: 'shamakhi', to: 'goychay', curve: 12, dur: 2.4, del: 0.2 },
  { from: 'goychay', to: 'yevlakh', curve: 10, dur: 2.2, del: 0.3 },
  { from: 'yevlakh', to: 'mingachevir', curve: -12, dur: 1.9, del: 0.1 },
  { from: 'mingachevir', to: 'ganja', curve: 18, dur: 2.8, del: 0.5 },
  { from: 'mingachevir', to: 'shaki', curve: -12, dur: 2.4, del: 0.9 },
  { from: 'baku', to: 'shirvan', curve: -26, dur: 3, del: 1 },
  { from: 'shirvan', to: 'lankaran', curve: 10, dur: 3.1, del: 0.7 },
  { from: 'shirvan', to: 'yevlakh', curve: -18, dur: 3, del: 0.5 },
  { from: 'barda', to: 'yevlakh', curve: 10, dur: 2, del: 0.6 },
  { from: 'agdam', to: 'barda', curve: -10, dur: 2, del: 0.2 },
  { from: 'shusha', to: 'agdam', curve: 10, dur: 2, del: 0.3 },
  { from: 'fuzuli', to: 'shusha', curve: -10, dur: 2.1, del: 0.4 },
  { from: 'shirvan', to: 'fuzuli', curve: -18, dur: 3.2, del: 0.1 },
  { from: 'quba', to: 'shamakhi', curve: 14, dur: 3, del: 0.8 },
  { from: 'shaki', to: 'ganja', curve: 14, dur: 2.5, del: 0.6 },
  { from: 'baku', to: 'ganja', curve: 72, main: true, dur: 5, del: 0 },
  { from: 'baku', to: 'shusha', curve: 58, dashed: true, dur: 4, del: 1 },
] as const;

export default function HeroMap() {
  const [activeRoutes, setActiveRoutes] = useState<number[]>([1, 7, 18]);

  useEffect(() => {
    const interval = setInterval(() => {
      const numRoutes = Math.floor(Math.random() * 3) + 2;
      const next = new Set<number>();

      while (next.size < numRoutes) {
        next.add(Math.floor(Math.random() * ROUTES.length));
      }

      setActiveRoutes([...next]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-3xl border border-white/5 bg-navy/40 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.1)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size[40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

      <svg
        viewBox="0 0 800 600"
        className="h-full w-full max-w-[120%] scale-110 sm:scale-100"
        style={{ filter: 'drop-shadow(0 0 20px rgba(20, 184, 166, 0.1))' }}
      >
        {ROUTES.map((route, i) => {
          const from = CITIES.find((city) => city.id === route.from);
          const to = CITIES.find((city) => city.id === route.to);
          if (!from || !to) return null;

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const normalX = -dy;
          const normalY = dx;
          const len = Math.sqrt(dx * dx + dy * dy);
          const cpX = midX + (normalX / len) * route.curve;
          const cpY = midY + (normalY / len) * route.curve;
          const pathD = `M ${from.x} ${from.y} Q ${cpX} ${cpY} ${to.x} ${to.y}`;
          const isActive = activeRoutes.includes(i) || route.main;

          return (
            <g key={`${route.from}-${route.to}`}>
              <path
                id={`hero-route-${i}`}
                d={pathD}
                fill="none"
                stroke="rgba(20, 184, 166, 0.15)"
                strokeWidth={route.main ? 3 : 1.5}
                strokeDasharray={route.dashed ? '6 6' : 'none'}
              />

              {!route.dashed && (
                <circle r={route.main ? '4' : '2.5'} fill="#5eead4" style={{ filter: 'drop-shadow(0 0 6px #5eead4)' }}>
                  <animateMotion dur={`${route.dur}s`} repeatCount="indefinite" begin={`${route.del}s`}>
                    <mpath href={`#hero-route-${i}`} />
                  </animateMotion>
                </circle>
              )}

              {isActive && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#5eead4"
                  strokeWidth={route.main ? 3 : 2}
                  className="animate-draw-line"
                  strokeDasharray={route.dashed ? '6 6' : 'none'}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(94, 234, 212, 0.6))' }}
                />
              )}
            </g>
          );
        })}

        {CITIES.map((city) => {
          const isActive =
            activeRoutes.some((idx) => ROUTES[idx]?.from === city.id || ROUTES[idx]?.to === city.id) || city.size >= 10;

          return (
            <g key={city.id} className="transition-all duration-700 ease-in-out">
              {isActive && <circle cx={city.x} cy={city.y} r={city.size * 2.5} fill="rgba(20, 184, 166, 0.2)" className="animate-pulse-glow" />}
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
                  fontSize={city.size >= 10 ? '16' : '12'}
                  fontWeight={isActive ? '700' : '500'}
                  textAnchor="middle"
                  className="font-sans transition-all duration-500"
                  style={{ filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' : 'none' }}
                >
                  {city.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-gradient-to-t from-navy via-transparent to-transparent opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_700px_300px,rgba(20,184,166,0.15),transparent_300px)]" />
    </div>
  );
}
