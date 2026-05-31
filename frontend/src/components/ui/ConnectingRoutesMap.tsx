'use client';

import React from 'react';

export type RouteKey = 'ganca' | 'quba' | 'lankaran' | null;

interface ConnectingRoutesMapProps {
  activeRoute: RouteKey;
  className?: string;
}

export default function ConnectingRoutesMap({ activeRoute, className = '' }: ConnectingRoutesMapProps) {
  const nodes = {
    baku: { x: 320, y: 150, label: 'Bakı' },
    ganca: { x: 100, y: 120, label: 'Gəncə' },
    quba: { x: 260, y: 60, label: 'Quba' },
    lankaran: { x: 280, y: 240, label: 'Lənkəran' },
  };

  const routes = {
    ganca: `M ${nodes.baku.x} ${nodes.baku.y} Q 210 90 ${nodes.ganca.x} ${nodes.ganca.y}`,
    quba: `M ${nodes.baku.x} ${nodes.baku.y} Q 300 90 ${nodes.quba.x} ${nodes.quba.y}`,
    lankaran: `M ${nodes.baku.x} ${nodes.baku.y} Q 330 200 ${nodes.lankaran.x} ${nodes.lankaran.y}`,
  };

  return (
    <div className={`relative w-full h-full min-h-[300px] flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 400 300" className="w-full h-full max-w-full drop-shadow-2xl overflow-visible">
        {Object.entries(routes).map(([key, d]) => (
          <path
            key={`bg-${key}`}
            d={d}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 8"
          />
        ))}

        {activeRoute && (
          <path
            key={`active-${activeRoute}`}
            d={routes[activeRoute]}
            fill="none"
            stroke="#14b8a6"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-draw-line"
            style={{ filter: 'drop-shadow(0 0 8px rgba(20, 184, 166, 0.8))' }}
          />
        )}

        {Object.entries(nodes).map(([key, node]) => {
          const isActive = activeRoute === key || key === 'baku';
          return (
            <g key={`node-${key}`} className="transition-all duration-500">
              {isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="14"
                  fill="rgba(20, 184, 166, 0.2)"
                  className="animate-pulse"
                />
              )}
              <circle
                cx={node.x}
                cy={node.y}
                r="6"
                fill={isActive ? '#5eead4' : '#1e293b'} 
                stroke={isActive ? '#14b8a6' : 'rgba(255,255,255,0.2)'}
                strokeWidth="2"
                className="transition-colors duration-500"
              />
              <text
                x={node.x}
                y={node.y - 14}
                fill={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
                fontSize="14"
                fontWeight={isActive ? "700" : "500"}
                textAnchor="middle"
                className="font-sans transition-colors duration-500"
                style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(0,0,0,0.8))' : 'none' }}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
