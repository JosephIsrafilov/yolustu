'use client';
import { MapContainer } from '@/components/ui/Map';

export default function TestMapPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Map Test Page</h1>
      <div className="w-full max-w-4xl h-[500px]">
        <MapContainer />
      </div>
    </div>
  );
}
