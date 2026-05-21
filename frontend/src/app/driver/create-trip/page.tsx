'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import TimePicker from '@/components/ui/TimePicker';
import CitySelect from '@/components/ui/CitySelect';
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
import { I18N } from '@/lib/i18n';

export default function CreateTripPage() {
  const router = useRouter();
  const { createTrip, lastError, clearError, language } = useAppStore();
  
  const copy = I18N[language].createTrip;
  const common = I18N[language].common;
  
  const steps = [copy.stepRoute, copy.stepDate, copy.stepSeats, copy.stepVehicle, copy.stepOverview];
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
        car_model: form.carModel,
        seats_total: form.seatsTotal,
        origin_coords: form.origin ? { lat: form.origin.lat, lng: form.origin.lng } : undefined,
        destination_coords: form.destination ? { lat: form.destination.lat, lng: form.destination.lng } : undefined,
      });
      if (response?.suggested_price) {
        update('pricePerSeat', response.suggested_price);
        setAiReasoning(response.reasoning);
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error);
      setAiReasoning(copy.aiError);
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
      if (!form.departureCity) e.departureCity = copy.requiredError;
      if (!form.arrivalCity) e.arrivalCity = copy.requiredError;
      if (form.departureCity === form.arrivalCity && form.departureCity) e.arrivalCity = copy.sameCityError;
    }
    if (step === 1) {
      if (!form.date) e.date = copy.requiredError;
      if (!form.time) e.time = copy.requiredError;
    }
    if (step === 2) {
      if (form.seatsTotal < 1 || form.seatsTotal > 4) e.seatsTotal = copy.seatsError;
      if (form.pricePerSeat <= 0) e.pricePerSeat = copy.priceError;
    }
    if (step === 3) {
      if (!form.carModel) e.carModel = copy.requiredError;
      if (!isMockDataMode && vehicles.length === 0) {
        if (!vehicleForm.model.trim()) e.vehicleModel = copy.requiredError;
        if (!vehicleForm.color.trim()) e.vehicleColor = copy.requiredError;
        if (!vehicleForm.plateNumber.trim()) e.vehiclePlate = copy.requiredError;
        if (vehicleForm.year < 1980 || vehicleForm.year > new Date().getFullYear() + 1) e.vehicleYear = copy.yearError;
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

  const reverseGeocode = async (lat: number, lng: number, field: 'meetingPoint' | 'dropoffPoint') => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const shortName = addr.road 
          ? `${addr.road}${addr.house_number ? ' ' + addr.house_number : ''}, ${addr.city || addr.town || addr.suburb || ''}` 
          : data.display_name.split(',').slice(0, 2).join(',');
        update(field, shortName.replace(/,\s*$/, '').trim());
      }
    } catch (err) {
      console.error('Failed to reverse geocode', err);
    }
  };

  return (
    <WebLayout title={copy.title} showBack narrow hideFooter>
      <ProtectedRoute mode="driver">
        {lastError && (
          <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
            <div className="flex items-center justify-between gap-3">
              <span>{lastError}</span>
              <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">{common.close}</button>
            </div>
          </div>
        )}
        
        {/* Clickable Stepper */}
        <div className="mb-6 flex items-center gap-2">
          {steps.map((s, i) => {
            const isCompleted = i < step;
            const isCurrent = i === step;
            return (
              <div 
                key={s} 
                className="flex-1"
                onClick={() => {
                  // Allow navigating backwards
                  if (isCompleted) setStep(i);
                }}
              >
                <div className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-brand-500 cursor-pointer hover:opacity-80' : 
                  isCurrent ? 'bg-brand-500 scale-y-110' : 'bg-surface-muted'
                }`} />
                <p className={`mt-1.5 text-center text-[10px] sm:text-xs transition-colors duration-300 ${
                  isCurrent ? 'font-bold text-brand-600' : 
                  isCompleted ? 'text-text-muted cursor-pointer hover:text-brand-500' : 'text-text-muted/50'
                }`}>
                  {s}
                </p>
              </div>
            );
          })}
        </div>

        {/* Persistent Route Summary (shown on steps > 0) */}
        {step > 0 && form.departureCity && form.arrivalCity && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-50 to-white p-3.5 shadow-sm border border-brand-100 dark:from-[#00282d] dark:to-[#001f24] dark:border-[#00383f] animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                <Icon name="map" size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-0.5">{copy.summaryRoute}</p>
                <p className="text-[15px] font-bold text-text truncate">
                  {form.departureCity} <Icon name="arrow-right" size={14} className="inline mx-1 text-text-muted" /> {form.arrivalCity}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setStep(0)}
              className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-600 shadow-sm border border-border hover:bg-surface-muted transition-colors"
            >
              Edit
            </button>
          </div>
        )}

        <Card className="p-6">
          <div className="animate-fade-in">
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <CitySelect 
                  label={copy.fromCity} 
                  value={form.departureCity} 
                  onChange={(val) => update('departureCity', val)} 
                  options={AZ_CITIES} 
                  error={errors.departureCity} 
                />
                <CitySelect 
                  label={copy.toCity} 
                  value={form.arrivalCity} 
                  onChange={(val) => update('arrivalCity', val)} 
                  options={AZ_CITIES} 
                  error={errors.arrivalCity} 
                />

                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">{copy.mapHint}</label>
                    <div className="flex gap-1 rounded-lg bg-surface-muted p-1">
                      <button 
                        type="button"
                        onClick={() => setPickerMode('origin')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${pickerMode === 'origin' ? 'bg-white shadow-sm text-brand-600' : 'text-text-muted'}`}
                      >
                        {copy.summaryMeeting}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPickerMode('destination')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${pickerMode === 'destination' ? 'bg-white shadow-sm text-brand-600' : 'text-text-muted'}`}
                      >
                        {language === 'az' ? 'Eniş' : language === 'ru' ? 'Высадка' : 'Drop-off'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-hidden rounded-xl border border-border">
                    <MapContainer>
                      <LocationPicker 
                        mode={pickerMode}
                        origin={form.origin}
                        destination={form.destination}
                        onSelectOrigin={(pos) => { 
                          update('origin', pos); 
                          reverseGeocode(pos.lat, pos.lng, 'meetingPoint'); 
                        }}
                        onSelectDestination={(pos) => { 
                          update('destination', pos); 
                          reverseGeocode(pos.lat, pos.lng, 'dropoffPoint'); 
                        }}
                      />
                    </MapContainer>
                  </div>
                  <p className="text-center text-xs text-text-muted">
                    {pickerMode === 'origin' 
                      ? (language === 'az' ? 'Xəritədə görüş nöqtəsini seçin' : language === 'ru' ? 'Выберите место встречи на карте' : 'Select meeting point on the map') 
                      : (language === 'az' ? 'Xəritədə eniş nöqtəsini seçin' : language === 'ru' ? 'Выберите место высадки на карте' : 'Select dropoff point on the map')}
                  </p>
                </div>

                <Input label={copy.meetingPoint} placeholder={copy.meetingPlaceholder} value={form.meetingPoint} onChange={(e) => update('meetingPoint', e.target.value)} icon={<Icon name="map-pin" size={16} />} />
                <Input label={copy.dropoffPoint} placeholder={copy.dropoffPlaceholder} value={form.dropoffPoint} onChange={(e) => update('dropoffPoint', e.target.value)} icon={<Icon name="map-pin" size={16} />} />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <DatePicker value={form.date} onChange={(value) => update('date', value)} label={copy.dateLabel} placeholder={common.selectDate} />
                  {errors.date && <p className="mt-1.5 text-xs text-danger-500">{errors.date}</p>}
                </div>
                <TimePicker label={copy.timeLabel} value={form.time} onChange={(val) => update('time', val)} error={errors.time} placeholder={copy.timeLabel} />
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">{copy.seatsCount}</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => update('seatsTotal', Math.max(1, form.seatsTotal - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-lg font-bold transition-transform active:scale-95">−</button>
                    <span className="w-8 text-center text-2xl font-bold">{form.seatsTotal}</span>
                    <button type="button" onClick={() => update('seatsTotal', Math.min(4, form.seatsTotal + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-lg font-bold transition-transform active:scale-95">+</button>
                  </div>
                  {errors.seatsTotal && <p className="text-xs text-danger-500">{errors.seatsTotal}</p>}
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <Input label={copy.pricePerSeat} type="number" value={form.pricePerSeat} onChange={(e) => update('pricePerSeat', Number(e.target.value))} error={errors.pricePerSeat} />
                  
                  <div className="mt-2 flex flex-col items-start gap-3 rounded-xl bg-gradient-to-br from-[#e8f5e9] to-[#c8e6c9] p-4 shadow-sm border border-[#a5d6a7] dark:from-[#1b5e20] dark:to-[#004d40] dark:border-[#2e7d32]">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="sparkles" size={16} className="text-[#2e7d32] dark:text-[#81c784]" />
                        <span className="text-sm font-bold text-[#2e7d32] dark:text-[#81c784]">{copy.aiTitle}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={getAiSuggestion}
                        disabled={isAiLoading || !form.departureCity || !form.arrivalCity || !form.time}
                        className="rounded-lg bg-[#2e7d32] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1b5e20] active:scale-95 disabled:opacity-50 dark:bg-[#4caf50] dark:text-black dark:hover:bg-[#81c784]"
                      >
                        {isAiLoading ? copy.aiLoading : copy.aiSuggestBtn}
                      </button>
                    </div>
                    {aiReasoning ? (
                      <p className="text-xs font-medium text-[#1b5e20] dark:text-[#a5d6a7] leading-relaxed">{aiReasoning}</p>
                    ) : (
                      <p className="text-xs text-[#2e7d32] dark:text-[#81c784]">{copy.aiPlaceholder}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-4">
                {!isMockDataMode && vehicles.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">{copy.summaryVehicle}</label>
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
                    {isLoadingVehicles && <p className="text-xs text-text-muted">{copy.vehiclesLoading}</p>}
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">{copy.carModel}</label>
                  <select value={form.carModel} onChange={(e) => update('carModel', e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">{copy.select}</option>
                    {CAR_MODELS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.carModel && <p className="text-xs text-danger-500">{errors.carModel}</p>}
                </div>
                {!isMockDataMode && vehicles.length === 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label={copy.brandLabel} value={vehicleForm.brand} onChange={(e) => setVehicleForm((p) => ({ ...p, brand: e.target.value }))} />
                    <Input
                      label={copy.modelLabel}
                      value={vehicleForm.model}
                      onChange={(e) => {
                        setVehicleForm((p) => ({ ...p, model: e.target.value }));
                        update('carModel', e.target.value);
                      }}
                      error={errors.vehicleModel}
                    />
                    <Input label={copy.yearLabel} type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm((p) => ({ ...p, year: Number(e.target.value) }))} error={errors.vehicleYear} />
                    <Input label={copy.colorLabel} value={vehicleForm.color} onChange={(e) => setVehicleForm((p) => ({ ...p, color: e.target.value }))} error={errors.vehicleColor} />
                    <div className="sm:col-span-2">
                      <Input label={copy.plateLabel} value={vehicleForm.plateNumber} onChange={(e) => setVehicleForm((p) => ({ ...p, plateNumber: e.target.value }))} error={errors.vehiclePlate} />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">{copy.commentLabel}</label>
                  <textarea value={form.comment} onChange={(e) => update('comment', e.target.value)} rows={3} placeholder={copy.commentPlaceholder} className="w-full resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 className="mb-4 text-lg font-bold">{copy.summaryTitle}</h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryRoute}</span><span className="font-medium">{form.departureCity} → {form.arrivalCity}</span></div>
                  {form.meetingPoint && <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryMeeting}</span><span className="font-medium">{form.meetingPoint}</span></div>}
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryDate}</span><span className="font-medium">{form.date} • {form.time}</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summarySeats}</span><span className="font-medium">{form.seatsTotal}</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryPrice}</span><span className="font-bold text-brand-600">{form.pricePerSeat} ₼</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryVehicle}</span><span className="font-medium">{form.carModel}</span></div>
                  {form.comment && <div className="flex justify-between py-2"><span className="text-text-muted">{copy.summaryComment}</span><span className="font-medium">{form.comment}</span></div>}
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 flex gap-3">
            {step > 0 && <Button variant="outline" fullWidth onClick={back}><Icon name="arrow-left" size={16} /> {copy.backBtn}</Button>}
            {step < 4 ? (
              <Button fullWidth onClick={next}>{copy.nextBtn} <Icon name="arrow-right" size={16} /></Button>
            ) : (
              <Button fullWidth size="lg" onClick={publish}><Icon name="check" size={16} /> {copy.publishBtn}</Button>
            )}
          </div>
        </Card>
      </ProtectedRoute>
    </WebLayout>
  );
}
