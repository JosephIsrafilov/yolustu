import { PRESET_LOCATIONS } from '@/lib/utils';

export default function DemoLocationPicker({ mode, departureCity, arrivalCity, onSelectOrigin, onSelectDestination }: { mode: 'origin' | 'destination'; departureCity?: string; arrivalCity?: string; onSelectOrigin: (point: { lat: number; lng: number }) => void; onSelectDestination: (point: { lat: number; lng: number }) => void }) {
  const city = mode === 'origin' ? departureCity : arrivalCity;
  return <div className="rounded-lg bg-white/95 p-2 text-xs text-[#054752] shadow-sm"><p className="mb-1 font-semibold">{mode === 'origin' ? 'Meeting point' : 'Drop-off point'}</p>{(PRESET_LOCATIONS[city ?? ''] ?? []).slice(0, 3).map((point) => <button className="block w-full rounded px-2 py-1 text-left hover:bg-[#edfcff]" type="button" key={point.name} onClick={() => (mode === 'origin' ? onSelectOrigin : onSelectDestination)({ lat: point.lat, lng: point.lng })}>{point.name}</button>)}</div>;
}
