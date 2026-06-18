import React from 'react';
import { SmartMapProps } from './types';
import { cn } from '@/lib/utils';

const TILE_SIZE = 256;
const MAX_MERCATOR_LAT = 85.05112878;

type WorldPoint = { x: number; y: number };
type Viewport = { minX: number; minY: number; width: number; height: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toWorldPoint(point: [number, number], zoom: number): WorldPoint {
  const [lat, lng] = point;
  const clampedLat = clamp(lat, -MAX_MERCATOR_LAT, MAX_MERCATOR_LAT);
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;

  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function projectWorldPoint(point: WorldPoint, viewport: Viewport) {
  const x = ((point.x - viewport.minX) / viewport.width) * 100;
  const y = ((point.y - viewport.minY) / viewport.height) * 100;
  return [clamp(x, 2, 98), clamp(y, 2, 98)] as const;
}

function buildViewport(points: WorldPoint[]): Viewport {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const width = Math.max(maxX - minX, 180) + 180;
  const height = Math.max(maxY - minY, 140) + 140;

  return {
    minX: centerX - width / 2,
    minY: centerY - height / 2,
    width,
    height,
  };
}

function buildTiles(viewport: Viewport, zoom: number) {
  const maxTile = 2 ** zoom - 1;
  const minTileX = clamp(Math.floor(viewport.minX / TILE_SIZE), 0, maxTile);
  const maxTileX = clamp(Math.floor((viewport.minX + viewport.width) / TILE_SIZE), 0, maxTile);
  const minTileY = clamp(Math.floor(viewport.minY / TILE_SIZE), 0, maxTile);
  const maxTileY = clamp(Math.floor((viewport.minY + viewport.height) / TILE_SIZE), 0, maxTile);
  const tiles: { x: number; y: number }[] = [];

  for (let x = minTileX; x <= maxTileX; x += 1) {
    for (let y = minTileY; y <= maxTileY; y += 1) {
      tiles.push({ x, y });
    }
  }

  return tiles;
}

function tileStyle(tile: { x: number; y: number }, viewport: Viewport): React.CSSProperties {
  return {
    left: `${((tile.x * TILE_SIZE - viewport.minX) / viewport.width) * 100}%`,
    top: `${((tile.y * TILE_SIZE - viewport.minY) / viewport.height) * 100}%`,
    width: `${(TILE_SIZE / viewport.width) * 100}%`,
    height: `${(TILE_SIZE / viewport.height) * 100}%`,
  };
}

export default function SimpleMapRenderer({
  center = [40.4093, 49.8671],
  className,
  markers = [],
  route,
  polylines = [],
  fitBounds,
  zoom,
}: SmartMapProps) {
  const tileZoom = clamp(Math.round(zoom ?? 8), 6, 12);
  const points = [
    center,
    ...(route ?? []),
    ...polylines.flat(),
    ...(fitBounds ?? []),
    ...markers.map((marker) => marker.position),
  ];
  const worldPoints = points.map((point) => toWorldPoint(point, tileZoom));
  const viewport = buildViewport(worldPoints);
  const tiles = buildTiles(viewport, tileZoom);
  const routePoints = (route ?? []).map((point) => projectWorldPoint(toWorldPoint(point, tileZoom), viewport));
  const polylinePoints = polylines.map((path) =>
    path.map((point) => projectWorldPoint(toWorldPoint(point, tileZoom), viewport)),
  );
  const hasHeight = className && (className.includes('h-') || className.includes('min-h-'));

  return (
    <div className={cn(!hasHeight && 'h-[400px]', 'relative w-full overflow-hidden rounded-2xl border border-border bg-[#dce9e9]', className)}>
      <div className="absolute inset-0 bg-[#dce9e9]">
        {tiles.map((tile) => (
          <div
            key={`${tileZoom}-${tile.x}-${tile.y}`}
            className="absolute bg-cover bg-center"
            style={{
              ...tileStyle(tile, viewport),
              backgroundImage: `url(https://tile.openstreetmap.org/${tileZoom}/${tile.x}/${tile.y}.png)`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-white/10" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {polylinePoints.map((path, index) => (
          <polyline
            key={`poly-${index}`}
            points={path.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="#0f766e"
            strokeOpacity="0.58"
            strokeWidth="1.7"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {routePoints.length > 1 && (
          <polyline
            points={routePoints.map(([x, y]) => `${x},${y}`).join(' ')}
            fill="none"
            stroke="#054752"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {markers.map((marker, index) => {
        const [x, y] = projectWorldPoint(toWorldPoint(marker.position, tileZoom), viewport);
        const color = marker.type === 'origin' ? 'bg-emerald-600' : marker.type === 'destination' ? 'bg-red-600' : 'bg-[#054752]';
        return (
          <button
            key={index}
            type="button"
            onClick={marker.onClick}
            className={cn('absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md', color)}
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={marker.popup ? 'Map marker' : undefined}
          />
        );
      })}

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-1 right-1 rounded bg-white/85 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
      >
        OpenStreetMap
      </a>
    </div>
  );
}
