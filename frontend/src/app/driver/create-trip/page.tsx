'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES } from '@/lib/utils';
import { CAR_MODELS } from '@/data/mock-data';
import Icon from '@/components/ui/Icon';
import type { CreateTripData, Vehicle } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MapContainer, LocationPicker } from '@/components/ui/Map';
import { apiClient } from '@/services/api-client';
import { mapApiVehicleToVehicle, type ApiVehicle } from '@/services/api/mappers';
import { apiAiService } from '@/services/api/api-ai-service';
import { isMockDataMode } from '@/lib/env';

const STEPS = ['Marşrut', 'Tarix', 'Yerlər', 'Maşın', 'Baxış'];

export default function CreateTripPage() {
  const router = useRouter();
  const { createTrip, lastError, clearError } = useAppStore();
  const [step, setStep] = useState(0);
  const [pickerMode, setPickerMode] = useState<'origin' | 'destination'>('origin');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(!isMockDataMode);
  const [form, setForm] = useState<CreateTripData>({
    departureCity: '',
    arrivalCity: '',
    meetingPoint: '',
    dropoffPoint: '',
    date: '',
    time: '',
    seatsTotal: 3,
    pricePerSeat: 10,
    carModel: '',
    comment: '',
    origin: undefined,
    destination: undefined,
  });
  const [vehicleForm, setVehicleForm] = useState({
    brand: 'Other',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    plateNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');

  const update = <K extends keyof CreateTripData>(key: K, value: CreateTripData[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const getAiSuggestion = async () => {
    if (!form.departureCity || !form.arrivalCity || !form.time) return;
    setIsAiLoading(true);
    try {
      const response = await apiAiService.getSmartPricingSuggestion({
        origin: form.departureCity,
        destination: form.arrivalCity,
        departure_time: form.time,
      });
      if (response?.suggested_price) {
        update('pricePerSeat', response.suggested_price);
        setAiReasoning(response.reasoning);
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error);
      setAiReasoning('Qiymət təklifi alınarkən xəta baş verdi.');
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (isMockDataMode) return;

    let isMounted = true;
    apiClient.get<ApiVehicle[]>('/vehicles/my')
      .then((response) => {
        if (!isMounted) return;
        const mapped = response.map(mapApiVehicleToVehicle);
        setVehicles(mapped);
        if (mapped[0]) {
          setForm((current) => ({
            ...current,
            vehicleId: mapped[0].id,
            carModel: `${mapped[0].brand} ${mapped[0].model}`.trim(),
          }));
        }
      })
      .catch((error) => {
        console.error('Fetch vehicles error:', error);
      })
      .finally(() => {
        if (isMounted) setIsLoadingVehicles(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
      if (!isMockDataMode && vehicles.length === 0) {
        if (!vehicleForm.model.trim()) e.vehicleModel = 'Tələb olunur';
        if (!vehicleForm.color.trim()) e.vehicleColor = 'Tələb olunur';
        if (!vehicleForm.plateNumber.trim()) e.vehiclePlate = 'Tələb olunur';
        if (vehicleForm.year < 1980 || vehicleForm.year > new Date().getFullYear() + 1) e.vehicleYear = 'Düzgün il seçin';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 4)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const publish = async () => {
    const id = await createTrip({
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
      origin: form.origin,
      destination: form.destination,
      vehicleId: form.vehicleId,
      newVehicle: !isMockDataMode && vehicles.length === 0 ? {
        brand: vehicleForm.brand.trim() || 'Other',
        model: vehicleForm.model.trim(),
        year: vehicleForm.year,
        color: vehicleForm.color.trim(),
        plateNumber: vehicleForm.plateNumber.trim(),
      } : undefined,
    });
    if (id) router.push(ROUTES.myTrips);
  };

  return (
    <WebLayout title="Yeni gediş" showBack narrow hideFooter>
      <ProtectedRoute mode="driver">
        {lastError && (
          <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
            <div className="flex items-center justify-between gap-3">
              <span>{lastError}</span>
              <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">Bağla</button>
            </div>
          </div>
        )}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-2 rounded-full transition-colors duration-300 ${i <= step ? 'bg-brand-500' : 'bg-surface-muted'}`} />
              <p className={`mt-1.5 text-center text-xs ${i === step ? 'font-semibold text-brand-600' : 'text-text-muted'}`}>{s}</p>
            </div>
          ))}
        </div>
        <Card className="p-6">
          <div className="animate-fade-in">
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Haradan</label>
                  <select value={form.departureCity} onChange={(e) => update('departureCity', e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Seçin</option>
                    {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.departureCity && <p className="text-xs text-danger-500">{errors.departureCity}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Haraya</label>
                  <select value={form.arrivalCity} onChange={(e) => update('arrivalCity', e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Seçin</option>
                    {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.arrivalCity && <p className="text-xs text-danger-500">{errors.arrivalCity}</p>}
                </div>

                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Xəritədə seçin (ixtiyari)</label>
                    <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
                      <button 
                        type="button"
                        onClick={() => setPickerMode('origin')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${pickerMode === 'origin' ? 'bg-white shadow-sm text-brand-600' : 'text-text-muted'}`}
                      >
                        Görüş
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPickerMode('destination')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${pickerMode === 'destination' ? 'bg-white shadow-sm text-brand-600' : 'text-text-muted'}`}
                      >
                        Eniş
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-hidden rounded-xl border border-border">
                    <MapContainer>
                      <LocationPicker 
                        mode={pickerMode}
                        origin={form.origin}
                        destination={form.destination}
                        onSelectOrigin={(pos) => update('origin', pos)}
                        onSelectDestination={(pos) => update('destination', pos)}
                      />
                    </MapContainer>
                  </div>
                  <p className="text-center text-xs text-text-muted">
                    {pickerMode === 'origin' ? 'Xəritədə görüş nöqtəsini seçin' : 'Xəritədə eniş nöqtəsini seçin'}
                  </p>
                </div>

                <Input label="Görüş nöqtəsi" placeholder="Məs: 28 May metro" value={form.meetingPoint} onChange={(e) => update('meetingPoint', e.target.value)} icon={<Icon name="map-pin" size={16} />} />
                <Input label="Eniş nöqtəsi" placeholder="Məs: Gəncə avtovağzal" value={form.dropoffPoint} onChange={(e) => update('dropoffPoint', e.target.value)} icon={<Icon name="map-pin" size={16} />} />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <DatePicker value={form.date} onChange={(value) => update('date', value)} label="Tarix" placeholder="Tarix seçin" />
                  {errors.date && <p className="mt-1.5 text-xs text-danger-500">{errors.date}</p>}
                </div>
                <Input label="Saat" type="time" value={form.time} onChange={(e) => update('time', e.target.value)} error={errors.time} />
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Yer sayı (1-4)</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => update('seatsTotal', Math.max(1, form.seatsTotal - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-lg font-bold">−</button>
                    <span className="w-8 text-center text-2xl font-bold">{form.seatsTotal}</span>
                    <button type="button" onClick={() => update('seatsTotal', Math.min(4, form.seatsTotal + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-lg font-bold">+</button>
                  </div>
                  {errors.seatsTotal && <p className="text-xs text-danger-500">{errors.seatsTotal}</p>}
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <Input label="Yer başına qiymət (₼)" type="number" value={form.pricePerSeat} onChange={(e) => update('pricePerSeat', Number(e.target.value))} error={errors.pricePerSeat} />
                  
                  <div className="mt-2 flex flex-col items-start gap-2 rounded-xl bg-gradient-to-r from-[#e8f5e9] to-[#c8e6c9] p-3 dark:from-[#1b5e20] dark:to-[#004d40]">
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-bold text-[#2e7d32] dark:text-[#81c784]">✨ AI Smart Pricing</span>
                      <button 
                        type="button" 
                        onClick={getAiSuggestion}
                        disabled={isAiLoading || !form.departureCity || !form.arrivalCity || !form.time}
                        className="rounded-lg bg-[#2e7d32] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1b5e20] disabled:opacity-50 dark:bg-[#4caf50] dark:text-black dark:hover:bg-[#81c784]"
                      >
                        {isAiLoading ? 'Yüklənir...' : 'Qiymət təklif et'}
                      </button>
                    </div>
                    {aiReasoning ? (
                      <p className="text-xs text-[#1b5e20] dark:text-[#a5d6a7]">{aiReasoning}</p>
                    ) : (
                      <p className="text-xs text-[#2e7d32] dark:text-[#81c784]">Süni intellektə marşrut və saata görə optimal qiymət seçdirmək üçün klikləyin. (Şəhər və saat seçilməlidir)</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                {!isMockDataMode && vehicles.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">Maşın</label>
                    <select
                      value={form.vehicleId || ''}
                      onChange={(e) => {
                        const selected = vehicles.find((vehicle) => vehicle.id === e.target.value);
                        update('vehicleId', e.target.value);
                        if (selected) update('carModel', `${selected.brand} ${selected.model}`.trim());
                      }}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} · {vehicle.plateNumber}
                        </option>
                      ))}
                    </select>
                    {isLoadingVehicles && <p className="text-xs text-text-muted">Maşınlar yüklənir...</p>}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Maşın modeli</label>
                  <select value={form.carModel} onChange={(e) => update('carModel', e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">Seçin</option>
                    {CAR_MODELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.carModel && <p className="text-xs text-danger-500">{errors.carModel}</p>}
                </div>
                {!isMockDataMode && vehicles.length === 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Marka" value={vehicleForm.brand} onChange={(e) => setVehicleForm((p) => ({ ...p, brand: e.target.value }))} />
                    <Input
                      label="Model"
                      value={vehicleForm.model}
                      onChange={(e) => {
                        setVehicleForm((p) => ({ ...p, model: e.target.value }));
                        update('carModel', e.target.value);
                      }}
                      error={errors.vehicleModel}
                    />
                    <Input label="İl" type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm((p) => ({ ...p, year: Number(e.target.value) }))} error={errors.vehicleYear} />
                    <Input label="Rəng" value={vehicleForm.color} onChange={(e) => setVehicleForm((p) => ({ ...p, color: e.target.value }))} error={errors.vehicleColor} />
                    <div className="sm:col-span-2">
                      <Input label="Dövlət nömrəsi" value={vehicleForm.plateNumber} onChange={(e) => setVehicleForm((p) => ({ ...p, plateNumber: e.target.value }))} error={errors.vehiclePlate} />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">Əlavə qeyd (ixtiyari)</label>
                  <textarea value={form.comment} onChange={(e) => update('comment', e.target.value)} rows={3} placeholder="Məs: AC var, yolda 1 dayanacaq" className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 className="mb-4 text-lg font-bold">Gediş xülasəsi</h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">Marşrut</span><span className="font-medium">{form.departureCity} → {form.arrivalCity}</span></div>
                  {form.meetingPoint && <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">Görüş</span><span className="font-medium">{form.meetingPoint}</span></div>}
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">Tarix</span><span className="font-medium">{form.date} • {form.time}</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">Yerlər</span><span className="font-medium">{form.seatsTotal}</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">Qiymət</span><span className="font-bold text-brand-600">{form.pricePerSeat} ₼</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">Maşın</span><span className="font-medium">{form.carModel}</span></div>
                  {form.comment && <div className="flex justify-between py-2"><span className="text-text-muted">Qeyd</span><span className="font-medium">{form.comment}</span></div>}
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 flex gap-3">
            {step > 0 && <Button variant="outline" fullWidth onClick={back}><Icon name="arrow-left" size={16} /> Geri</Button>}
            {step < 4 ? (
              <Button fullWidth onClick={next}>İrəli <Icon name="arrow-right" size={16} /></Button>
            ) : (
              <Button fullWidth size="lg" onClick={publish}><Icon name="check" size={16} /> Gedişi dərc et</Button>
            )}
          </div>
        </Card>
      </ProtectedRoute>
    </WebLayout>
  );
}
