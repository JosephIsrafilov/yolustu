'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';

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
import Icon from '@/components/ui/Icon';
import type { Vehicle } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MapContainer, LocationPicker } from '@/components/ui/Map';
import { apiClient } from '@/services/api-client';
import { mapApiVehicleToVehicle, type ApiVehicle } from '@/services/api/mappers';
import { apiAiService } from '@/services/api/api-ai-service';
import { isMockDataMode } from '@/lib/env';
import { I18N } from '@/lib/i18n';

// Dynamic Zod Validation Schema
const getValidationSchema = (requiredErrorMsg: string, sameCityErrorMsg: string, seatsErrorMsg: string, priceErrorMsg: string) => {
  return z.object({
    departureCity: z.string().min(1, requiredErrorMsg),
    arrivalCity: z.string().min(1, requiredErrorMsg),
    meetingPoint: z.string().optional(),
    dropoffPoint: z.string().optional(),
    date: z.string().min(1, requiredErrorMsg),
    time: z.string().min(1, requiredErrorMsg),
    seatsTotal: z.number().int().min(1, seatsErrorMsg).max(4, seatsErrorMsg),
    pricePerSeat: z.number().min(0.01, priceErrorMsg),
    comment: z.string().optional(),
    origin: z.object({ lat: z.number(), lng: z.number() }).optional(),
    destination: z.object({ lat: z.number(), lng: z.number() }).optional(),
  }).superRefine((data, ctx) => {
    if (data.departureCity === data.arrivalCity && data.departureCity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: sameCityErrorMsg,
        path: ['arrivalCity'],
      });
    }
  });
};

type FormValues = z.infer<ReturnType<typeof getValidationSchema>>;

export default function CreateTripPage() {
  const router = useRouter();
  const { createTrip, lastError, clearError, language } = useAppStore();
  
  const copy = I18N[language].createTrip;
  const common = I18N[language].common;
  
  const steps = [copy.stepRoute, copy.stepDate, copy.stepSeats, copy.stepOverview];
  const [step, setStep] = useState(0);
  const [pickerMode, setPickerMode] = useState<'origin' | 'destination'>('origin');

  // Fetch vehicles with React Query
  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ['my-vehicles'],
    queryFn: async () => {
      if (isMockDataMode) return [];
      try {
        const response = await apiClient.get<ApiVehicle[]>('/vehicles/my');
        return response.map(mapApiVehicleToVehicle);
      } catch (err) {
        console.error('Fetch vehicles error:', err);
        return [];
      }
    },
    enabled: !isMockDataMode,
  });

  const validationSchema = useMemo(() => {
    return getValidationSchema(
      copy.requiredError,
      copy.sameCityError,
      copy.seatsError,
      copy.priceError
    );
  }, [copy]);

  // React Hook Form Configuration
  const { control, handleSubmit, trigger, setValue, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      departureCity: '',
      arrivalCity: '',
      meetingPoint: '',
      dropoffPoint: '',
      date: '',
      time: '',
      seatsTotal: 3,
      pricePerSeat: 10,
      comment: '',
      origin: undefined,
      destination: undefined,
    }
  });

  // Watch values reactively for the UI
  const formValues = useWatch({ control }) as FormValues;

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiSuggestedPrice, setAiSuggestedPrice] = useState<number | null>(null);

  const getAiSuggestion = async () => {
    const values = getValues();
    if (!values.departureCity || !values.arrivalCity || !values.time) return;
    setIsAiLoading(true);
    setAiSuggestedPrice(null);
    setAiReasoning('');
    try {
      const response = await apiAiService.getSmartPricingSuggestion({
        origin: values.departureCity,
        destination: values.arrivalCity,
        departure_time: values.time,
        car_model: vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : 'Standard Vehicle',
        seats_total: values.seatsTotal,
        origin_coords: values.origin ? { lat: values.origin.lat, lng: values.origin.lng } : undefined,
        destination_coords: values.destination ? { lat: values.destination.lat, lng: values.destination.lng } : undefined,
      });
      if (response?.suggested_price) {
        setAiSuggestedPrice(response.suggested_price);
        setAiReasoning(response.reasoning);
      }
    } catch (error) {
      console.error('AI Suggestion Error:', error);
      setAiReasoning(copy.aiError);
    } finally {
      setIsAiLoading(false);
    }
  };

  const validateStep = async () => {
    if (step === 0) {
      return await trigger(['departureCity', 'arrivalCity']);
    }
    if (step === 1) {
      return await trigger(['date', 'time']);
    }
    if (step === 2) {
      return await trigger(['seatsTotal', 'pricePerSeat']);
    }
    return true;
  };

  const next = async () => {
    const isValid = await validateStep();
    if (isValid) setStep((s) => Math.min(s + 1, 3));
  };
  
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Mutation for creating trip
  const createTripMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await createTrip({
        departureCity: values.departureCity,
        arrivalCity: values.arrivalCity,
        meetingPoint: values.meetingPoint || '',
        dropoffPoint: values.dropoffPoint || '',
        date: values.date,
        time: values.time,
        seatsTotal: values.seatsTotal,
        pricePerSeat: values.pricePerSeat,
        carModel: vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : '',
        comment: values.comment || '',
        origin: values.origin,
        destination: values.destination,
        vehicleId: vehicles[0]?.id || '',
      });
    },
    onSuccess: (id) => {
      if (id) router.push(ROUTES.myTrips);
    }
  });

  const publish = () => {
    handleSubmit((values) => {
      createTripMutation.mutate(values);
    })();
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
        setValue(field, shortName.replace(/,\s*$/, '').trim());
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
        
        {!isLoadingVehicles && !isMockDataMode && vehicles.length === 0 ? (
          <div className="mb-6 rounded-2xl border border-warn-500/20 bg-warn-500/10 p-6 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warn-500/20 text-warn-500 mb-4">
              <Icon name="alert-triangle" size={28} />
            </div>
            <h3 className="mb-2 text-xl font-bold text-text">Avtomobil tapılmadı</h3>
            <p className="mb-6 text-sm text-text-muted max-w-md mx-auto">
              Səfər yaratmaq üçün əvvəlcə profilinizdə avtomobil əlavə etməlisiniz. Avtomobil əlavə etdikdən sonra İS avtomatik olaraq həmin avtomobili nəzərə alaraq qiymət təyin edəcək.
            </p>
            <Button onClick={() => router.push(ROUTES.profile)} size="lg" className="w-full sm:w-auto">
              Profilə keç <Icon name="arrow-right" size={16} />
            </Button>
          </div>
        ) : (
          <>
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

        {/* Persistent Route Summary */}
        {step > 0 && formValues.departureCity && formValues.arrivalCity && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand-50 to-white p-3.5 shadow-sm border border-brand-100 dark:from-[#00282d] dark:to-[#001f24] dark:border-[#00383f] animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                <Icon name="map" size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-0.5">{copy.summaryRoute}</p>
                <p className="text-[15px] font-bold text-text truncate">
                  {formValues.departureCity} <Icon name="arrow-right" size={14} className="inline mx-1 text-text-muted" /> {formValues.arrivalCity}
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
                <Controller
                  name="departureCity"
                  control={control}
                  render={({ field }) => (
                    <CitySelect 
                      label={copy.fromCity} 
                      value={field.value} 
                      onChange={field.onChange} 
                      options={AZ_CITIES} 
                      error={errors.departureCity?.message} 
                    />
                  )}
                />

                <Controller
                  name="arrivalCity"
                  control={control}
                  render={({ field }) => (
                    <CitySelect 
                      label={copy.toCity} 
                      value={field.value} 
                      onChange={field.onChange} 
                      options={AZ_CITIES} 
                      error={errors.arrivalCity?.message} 
                    />
                  )}
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
                        origin={formValues.origin}
                        destination={formValues.destination}
                        onSelectOrigin={(pos) => { 
                          setValue('origin', pos); 
                          reverseGeocode(pos.lat, pos.lng, 'meetingPoint'); 
                        }}
                        onSelectDestination={(pos) => { 
                          setValue('destination', pos); 
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

                <Input 
                  label={copy.meetingPoint} 
                  placeholder={copy.meetingPlaceholder} 
                  value={formValues.meetingPoint || ''} 
                  onChange={(e) => setValue('meetingPoint', e.target.value)} 
                  icon={<Icon name="map-pin" size={16} />} 
                />
                <Input 
                  label={copy.dropoffPoint} 
                  placeholder={copy.dropoffPlaceholder} 
                  value={formValues.dropoffPoint || ''} 
                  onChange={(e) => setValue('dropoffPoint', e.target.value)} 
                  icon={<Icon name="map-pin" size={16} />} 
                />
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker 
                        value={field.value} 
                        onChange={field.onChange} 
                        label={copy.dateLabel} 
                        placeholder={common.selectDate} 
                      />
                    )}
                  />
                  {errors.date && <p className="mt-1.5 text-xs text-danger-500">{errors.date.message}</p>}
                </div>
                <Controller
                  name="time"
                  control={control}
                  render={({ field }) => (
                    <TimePicker 
                      label={copy.timeLabel} 
                      value={field.value} 
                      onChange={field.onChange} 
                      error={errors.time?.message} 
                      placeholder={copy.timeLabel} 
                    />
                  )}
                />
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium">{copy.seatsCount}</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setValue('seatsTotal', Math.max(1, formValues.seatsTotal - 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-lg font-bold transition-transform active:scale-95">−</button>
                    <span className="w-8 text-center text-2xl font-bold">{formValues.seatsTotal}</span>
                    <button type="button" onClick={() => setValue('seatsTotal', Math.min(4, formValues.seatsTotal + 1))} className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-lg font-bold transition-transform active:scale-95">+</button>
                  </div>
                  {errors.seatsTotal && <p className="text-xs text-danger-500">{errors.seatsTotal.message}</p>}
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <Input 
                    label={copy.pricePerSeat} 
                    type="number" 
                    value={formValues.pricePerSeat} 
                    onChange={(e) => setValue('pricePerSeat', Number(e.target.value))} 
                    error={errors.pricePerSeat?.message} 
                  />
                  
                  <div className="mt-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50/60 to-white p-4.5 shadow-[0_2px_12px_rgba(5,71,82,0.03)] border border-brand-100 transition-all duration-300">
                    {isAiLoading && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite] -skew-x-12" />
                    )}
                    <div className="relative z-10 flex w-full flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-accent-500 to-accent-600 shadow-sm">
                            <Icon name="sparkles" size={14} className="text-white" />
                          </div>
                          <span className="text-sm font-extrabold text-brand-700 tracking-wide">
                            {copy.aiTitle}
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={getAiSuggestion}
                          disabled={isAiLoading || !formValues.departureCity || !formValues.arrivalCity || !formValues.time}
                          className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-brand-600 shadow-sm border border-brand-200 transition-all hover:bg-brand-50 hover:border-brand-300 active:scale-95 disabled:opacity-50"
                        >
                          {isAiLoading ? copy.aiLoading : copy.aiSuggestBtn}
                        </button>
                      </div>
                      
                      {aiSuggestedPrice ? (
                        <div className="flex flex-col gap-3 mt-1 animate-fade-in">
                          <div className="flex items-end justify-between bg-brand-50/30 p-3.5 rounded-xl border border-brand-100">
                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600/80 mb-0.5">Suggested Price</p>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-brand-800">{aiSuggestedPrice}</span>
                                <span className="text-sm font-bold text-brand-500">₼</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setValue('pricePerSeat', aiSuggestedPrice)}
                              className="flex items-center gap-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-md transition-all active:scale-95"
                            >
                              <Icon name="check" size={16} /> Apply
                            </button>
                          </div>
                          <p className="text-xs font-medium text-text-secondary leading-relaxed">{aiReasoning}</p>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-text-muted leading-relaxed mt-1">
                          {aiReasoning || copy.aiPlaceholder}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="mb-4 text-lg font-bold">{copy.summaryTitle}</h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryRoute}</span><span className="font-medium">{formValues.departureCity} → {formValues.arrivalCity}</span></div>
                  {formValues.meetingPoint && <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryMeeting}</span><span className="font-medium">{formValues.meetingPoint}</span></div>}
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryDate}</span><span className="font-medium">{formValues.date} • {formValues.time}</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summarySeats}</span><span className="font-medium">{formValues.seatsTotal}</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryPrice}</span><span className="font-bold text-brand-600">{formValues.pricePerSeat} ₼</span></div>
                  <div className="flex justify-between border-b border-border py-2"><span className="text-text-muted">{copy.summaryVehicle}</span><span className="font-medium">{vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : ''}</span></div>
                  {formValues.comment && <div className="flex justify-between py-2"><span className="text-text-muted">{copy.summaryComment}</span><span className="font-medium">{formValues.comment}</span></div>}
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 flex gap-3">
            {step > 0 && <Button variant="outline" fullWidth onClick={back}><Icon name="arrow-left" size={16} /> {copy.backBtn}</Button>}
            {step < 3 ? (
              <Button fullWidth onClick={next} disabled={createTripMutation.isPending}>{copy.nextBtn} <Icon name="arrow-right" size={16} /></Button>
            ) : (
              <Button fullWidth size="lg" onClick={publish} disabled={createTripMutation.isPending}>
                {createTripMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <Icon name="check" size={16} /> {copy.publishBtn}
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
          </>
        )}
      </ProtectedRoute>
    </WebLayout>
  );
}
