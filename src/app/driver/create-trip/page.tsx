'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/layout/MobileShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES } from '@/lib/utils';
import { CAR_MODELS } from '@/data/mock-data';
import { ArrowRight, ArrowLeft, Check, MapPin, Calendar, Users, Car, MessageSquare } from 'lucide-react';
import type { CreateTripData } from '@/types';

const STEPS = ['Marşrut', 'Tarix', 'Yerlər', 'Maşın', 'Baxış'];

export default function CreateTripPage() {
  const router = useRouter();
  const createTrip = useAppStore((s) => s.createTrip);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateTripData>({
    departureCity: '', arrivalCity: '', meetingPoint: '', dropoffPoint: '',
    date: '', time: '', seatsTotal: 3, pricePerSeat: 10, carModel: '', comment: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof CreateTripData, value: string | number) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const validateStep = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!form.departureCity) e.departureCity = 'Tələb olunur';
      if (!form.arrivalCity) e.arrivalCity = 'Tələb olunur';
      if (form.departureCity === form.arrivalCity && form.departureCity) e.arrivalCity = 'Fərqli şəhər seçin';
    }
    if (step === 1) {
      if (!form.date) e.date = 'Tələb olunur';
      if (!form.time) e.time = 'Tələb olunur';
    }
    if (step === 2) {
      if (form.seatsTotal < 1 || form.seatsTotal > 4) e.seatsTotal = '1-4 arası olmalıdır';
      if (form.pricePerSeat <= 0) e.pricePerSeat = 'Müsbət olmalıdır';
    }
    if (step === 3) {
      if (!form.carModel) e.carModel = 'Tələb olunur';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 4)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const publish = () => {
    createTrip({
      departureCity: form.departureCity,
      arrivalCity: form.arrivalCity,
      meetingPoint: form.meetingPoint,
      dropoffPoint: form.dropoffPoint,
      date: form.date,
      time: form.time,
      seatsTotal: form.seatsTotal,
      pricePerSeat: form.pricePerSeat,
      carModel: form.carModel,
      comment: form.comment,
    });
    router.push(ROUTES.myTrips);
  };

  return (
    <MobileShell title="Yeni gediş" showBack showNav={false}>
      <div className="px-4 pt-2 pb-6">
        {/* Progress */}
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? 'bg-brand-500' : 'bg-surface-muted'}`} />
              <p className={`text-[10px] mt-1 text-center ${i === step ? 'text-brand-600 font-semibold' : 'text-text-muted'}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="animate-fade-in">
          {/* Step 0: Route */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Haradan</label>
                <select value={form.departureCity} onChange={(e) => update('departureCity', e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seçin</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.departureCity && <p className="text-xs text-danger-500">{errors.departureCity}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Haraya</label>
                <select value={form.arrivalCity} onChange={(e) => update('arrivalCity', e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seçin</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.arrivalCity && <p className="text-xs text-danger-500">{errors.arrivalCity}</p>}
              </div>
              <Input label="Görüş nöqtəsi" placeholder="Məs: 28 May metro" value={form.meetingPoint} onChange={(e) => update('meetingPoint', e.target.value)} icon={<MapPin size={16} />} />
              <Input label="Eniş nöqtəsi" placeholder="Məs: Gəncə avtovağzal" value={form.dropoffPoint} onChange={(e) => update('dropoffPoint', e.target.value)} icon={<MapPin size={16} />} />
            </div>
          )}

          {/* Step 1: Date/Time */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Input label="Tarix" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} error={errors.date} icon={<Calendar size={16} />} />
              <Input label="Saat" type="time" value={form.time} onChange={(e) => update('time', e.target.value)} error={errors.time} />
            </div>
          )}

          {/* Step 2: Seats/Price */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Yer sayı (1-4)</label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => update('seatsTotal', Math.max(1, form.seatsTotal - 1))} className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center font-bold text-lg">−</button>
                  <span className="text-2xl font-bold w-8 text-center">{form.seatsTotal}</span>
                  <button type="button" onClick={() => update('seatsTotal', Math.min(4, form.seatsTotal + 1))} className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center font-bold text-lg">+</button>
                </div>
                {errors.seatsTotal && <p className="text-xs text-danger-500">{errors.seatsTotal}</p>}
              </div>
              <Input label="Yer başına qiymət (₼)" type="number" value={form.pricePerSeat} onChange={(e) => update('pricePerSeat', Number(e.target.value))} error={errors.pricePerSeat} />
            </div>
          )}

          {/* Step 3: Car/Comment */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Maşın modeli</label>
                <select value={form.carModel} onChange={(e) => update('carModel', e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Seçin</option>
                  {CAR_MODELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.carModel && <p className="text-xs text-danger-500">{errors.carModel}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Əlavə qeyd (ixtiyari)</label>
                <textarea value={form.comment} onChange={(e) => update('comment', e.target.value)} rows={3} placeholder="Məs: AC var, yolda 1 dayanacaq" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <Card>
              <h3 className="text-base font-bold mb-3">Gediş xülasəsi</h3>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between"><span className="text-text-muted">Marşrut</span><span className="font-medium">{form.departureCity} → {form.arrivalCity}</span></div>
                {form.meetingPoint && <div className="flex justify-between"><span className="text-text-muted">Görüş</span><span className="font-medium">{form.meetingPoint}</span></div>}
                <div className="flex justify-between"><span className="text-text-muted">Tarix</span><span className="font-medium">{form.date} • {form.time}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Yerlər</span><span className="font-medium">{form.seatsTotal}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Qiymət</span><span className="font-bold text-brand-600">{form.pricePerSeat} ₼</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Maşın</span><span className="font-medium">{form.carModel}</span></div>
                {form.comment && <div className="flex justify-between"><span className="text-text-muted">Qeyd</span><span className="font-medium">{form.comment}</span></div>}
              </div>
            </Card>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && <Button variant="outline" fullWidth onClick={back}><ArrowLeft size={16} /> Geri</Button>}
          {step < 4 ? (
            <Button fullWidth onClick={next}>İrəli <ArrowRight size={16} /></Button>
          ) : (
            <Button fullWidth size="lg" onClick={publish}><Check size={16} /> Gedişi dərc et</Button>
          )}
        </div>
      </div>
    </MobileShell>
  );
}
