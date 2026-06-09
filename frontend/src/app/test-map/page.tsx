'use client';
import { MapContainer } from '@/components/ui/Map';
import { I18N } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';

export default function TestMapPage() {
  const { language } = useAppStore();
  const t = I18N[language].testMap;
  return (
    <section className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
      <div className="w-full max-w-4xl h-[400px] md:h-[600px] rounded-2xl border border-[#c0c8ca] overflow-hidden shadow-card">
        <MapContainer center={[40.4093, 49.8671]} zoom={12} className="h-full w-full" />
      </div>
    </section>
  );
}
