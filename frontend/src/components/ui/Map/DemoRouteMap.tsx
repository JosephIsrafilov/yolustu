'use client';

import type { SmartMapProps } from './types';

export default function DemoRouteMap({ origin, destination, markers = [], className, children }: SmartMapProps) {
  const points = [origin, destination, ...markers.map((marker) => ({ lat: marker.position[0], lng: marker.position[1] }))].filter((point): point is { lat: number; lng: number } => Boolean(point));
  const [from, to] = points;
  const x = (lng: number) => 7 + (lng - 44.5) / 7 * 86;
  const y = (lat: number) => 88 - (lat - 38) / 4.5 * 76;
  return <div className={`relative min-h-[280px] overflow-hidden rounded-xl border border-[#cbe8ee] bg-[#dff4f5] ${className ?? 'h-[400px] w-full'}`} role="img" aria-label="Schematic route map of Azerbaijan">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <path d="M5 47 Q13 12 29 15 L40 29 L54 11 L70 19 L87 13 L96 40 L89 67 L68 79 L44 73 L28 90 L10 76 Z" fill="#c9e8dc" stroke="#83b5aa" strokeWidth=".7" />
      <path d="M12 66 Q40 51 89 45 M28 20 Q40 55 57 77 M48 26 Q66 43 86 63" fill="none" stroke="#a3cfc5" strokeWidth=".6" strokeDasharray="1 1" />
      {from && to && <path d={`M${x(from.lng)} ${y(from.lat)} L${x(to.lng)} ${y(to.lat)}`} fill="none" stroke="#054752" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2 1" />}
      {points.map((point, index) => <g key={`${point.lat}-${point.lng}-${index}`}><circle cx={x(point.lng)} cy={y(point.lat)} r="2" fill={index === 0 ? '#0b7564' : '#d45532'} stroke="white" strokeWidth=".7" /></g>)}
    </svg>
    <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-3 py-2 text-xs font-semibold text-[#054752] shadow-sm">Azerbaijan · schematic demo route</div>
    {from && to && <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs text-[#274d54] shadow-sm"><span>Departure {from.lat.toFixed(2)}°, {from.lng.toFixed(2)}°</span><span aria-hidden="true">→</span><span>Arrival {to.lat.toFixed(2)}°, {to.lng.toFixed(2)}°</span></div>}
    {children && <div className="absolute right-3 top-3 max-w-[55%]">{children}</div>}
  </div>;
}
