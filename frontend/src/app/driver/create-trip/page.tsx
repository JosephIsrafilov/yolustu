'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { AZ_CITIES, getCityCoordinates, isWithinAzerbaijan, PRESET_LOCATIONS } from '@/lib/utils';
import Icon from '@/components/ui/Icon';
import type { Vehicle } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MapContainer, LocationPicker } from '@/components/ui/Map';
import { apiClient } from '@/services/api-client';
import { mapApiVehicleToVehicle, type ApiVehicle } from '@/services/api/mappers';
import { apiAiService } from '@/services/api/api-ai-service';
import { isMockDataMode } from '@/lib/env';
import { I18N } from '@/lib/i18n';

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
    smokingAllowed: z.boolean().optional(),
    petsAllowed: z.boolean().optional(),
    musicAllowed: z.boolean().optional(),
    femaleOnly: z.boolean().optional(),
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
  const [isRecurring, setIsRecurring] = useState(false);

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

  const { control, handleSubmit, trigger, setValue, getValues, setError, clearErrors, formState: { errors } } = useForm<FormValues>({
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
      smokingAllowed: false,
      petsAllowed: false,
      musicAllowed: true,
      femaleOnly: false,
    }
  });

  const formValues = useWatch({ control }) as FormValues;

  const mapCenter = useMemo((): [number, number] => {
    if (pickerMode === 'origin') {
      if (formValues.origin) {
        return [formValues.origin.lat, formValues.origin.lng];
      }
      if (formValues.departureCity) {
        const coords = getCityCoordinates(formValues.departureCity);
        if (coords) return [coords.lat, coords.lng];
      }
    } else {
      if (formValues.destination) {
        return [formValues.destination.lat, formValues.destination.lng];
      }
      if (formValues.arrivalCity) {
        const coords = getCityCoordinates(formValues.arrivalCity);
        if (coords) return [coords.lat, coords.lng];
      }
    }
    return [40.4093, 49.8671];
  }, [pickerMode, formValues.origin, formValues.destination, formValues.departureCity, formValues.arrivalCity]);

  const mapZoom = useMemo(() => {
    if (pickerMode === 'origin') {
      if (formValues.origin || formValues.departureCity) return 14;
    } else {
      if (formValues.destination || formValues.arrivalCity) return 14;
    }
    return 12;
  }, [pickerMode, formValues.origin, formValues.destination, formValues.departureCity, formValues.arrivalCity]);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiSuggestedPrice, setAiSuggestedPrice] = useState<number | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

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
        departure_date: values.date,
        language: language,
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

  const handleGenerateDescription = async () => {
    const values = getValues();
    if (!values.departureCity || !values.arrivalCity || !values.time) return;
    setIsDrafting(true);
    try {
      const prefs: string[] = [];
      if (values.femaleOnly) prefs.push(language === 'az' ? 'Yalnız xanımlar' : language === 'ru' ? 'Только для женщин' : 'Ladies only');
      if (values.smokingAllowed) prefs.push(language === 'az' ? 'Siqaret çəkmək olar' : language === 'ru' ? 'Можно курить' : 'Smoking allowed');
      if (values.petsAllowed) prefs.push(language === 'az' ? 'Heyvanlara icazə var' : language === 'ru' ? 'Можно с питомцами' : 'Pets allowed');
      if (values.musicAllowed !== false) prefs.push(language === 'az' ? 'Musiqi dinləmək olar' : language === 'ru' ? 'Можно музыку' : 'Music allowed');

      const response = await apiAiService.generateTripDescription({
        origin: values.departureCity,
        destination: values.arrivalCity,
        departure_time: values.time,
        departure_date: values.date,
        car_model: vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : 'Standard Vehicle',
        seats_total: values.seatsTotal,
        language: language,
        preferences: prefs,
      });
      if (response?.description) {
        setValue('comment', response.description);
      }
    } catch (error) {
      console.error('AI Draft Description Error:', error);
    } finally {
      setIsDrafting(false);
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

  const createTripMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const baseTripData = {
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
        smokingAllowed: values.smokingAllowed ?? false,
        petsAllowed: values.petsAllowed ?? false,
        musicAllowed: values.musicAllowed ?? true,
        femaleOnly: values.femaleOnly ?? false,
      };

      if (isRecurring) {
        const { getNextWeekdays } = await import('@/lib/utils');
        const extraDates = getNextWeekdays(values.date, 4);
        const datesToCreate = [values.date, ...extraDates];
        
        let lastCreatedId = '';
        for (const targetDate of datesToCreate) {
          lastCreatedId = await createTrip({
            ...baseTripData,
            date: targetDate,
          });
        }
        return lastCreatedId;
      } else {
        return await createTrip(baseTripData);
      }
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
        const countryCode = data.address.country_code;
        const isMeeting = field === 'meetingPoint';
        const coordField = isMeeting ? 'origin' : 'destination';

        if (countryCode && countryCode.toLowerCase() !== 'az') {
          setError(coordField, {
            type: 'manual',
            message: copy.onlyAzerbaijanError
          });
          setValue(coordField, undefined);
          setValue(field, '');
          return;
        }

        clearErrors(coordField);

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
        
        {!isLoadingVehicles && !isMockDataMode && vehicles.length === 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <Icon name="car" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-amber-900 leading-tight">
                  {language === 'az' 
                    ? 'Nəqliyyat vasitəsi əlavə edilməyib' 
                    : language === 'ru' 
                    ? 'Транспорт не добавлен' 
                    : 'No Vehicle Registered'}
                </h4>
                <p className="text-xs text-amber-800/90 leading-relaxed mt-1">
                  {language === 'az' 
                    ? 'Gediş yaratmaq üçün profilinizə avtomobil əlavə etməyiniz tövsiyə olunur. Əks halda sistem standart avtomobildən istifadə edəcək.' 
                    : language === 'ru' 
                    ? 'Для создания поездки рекомендуется добавить автомобиль в ваш профиль. Иначе система использует транспорт по умолчанию.' 
                    : 'To publish a trip, we recommend registering your vehicle in your profile. Otherwise, a standard default fallback vehicle will be used.'}
                </p>
                <div className="mt-3">
                  <Link 
                    href={ROUTES.profile}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-bold transition-all active:scale-95 shadow-sm"
                  >
                    <span>
                      {language === 'az' 
                        ? 'Profilə nəqliyyat əlavə et' 
                        : language === 'ru' 
                        ? 'Добавить транспорт в профиль' 
                        : 'Add Vehicle to Profile'}
                    </span>
                    <Icon name="arrow-right" size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        <>
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
                    <MapContainer center={mapCenter} zoom={mapZoom}>
                      <LocationPicker 
                        mode={pickerMode}
                        origin={formValues.origin}
                        destination={formValues.destination}
                        onSelectOrigin={(pos) => { 
                          if (!isWithinAzerbaijan(pos.lat, pos.lng)) {
                            setError('origin', {
                              type: 'manual',
                              message: copy.onlyAzerbaijanError
                            });
                            setValue('origin', undefined);
                            setValue('meetingPoint', '');
                            return;
                          }
                          clearErrors('origin');
                          setValue('origin', pos); 
                          reverseGeocode(pos.lat, pos.lng, 'meetingPoint'); 
                        }}
                        onSelectDestination={(pos) => { 
                          if (!isWithinAzerbaijan(pos.lat, pos.lng)) {
                            setError('destination', {
                              type: 'manual',
                              message: copy.onlyAzerbaijanError
                            });
                            setValue('destination', undefined);
                            setValue('dropoffPoint', '');
                            return;
                          }
                          clearErrors('destination');
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
                  
                  {(() => {
                    const activeCity = pickerMode === 'origin' ? formValues.departureCity : formValues.arrivalCity;
                    const presets = activeCity ? PRESET_LOCATIONS[activeCity] : null;
                    if (!presets || presets.length === 0) return null;
                    return (
                      <div className="flex flex-col gap-1.5 mt-1 border-t border-dashed border-border pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          {copy.presetTitle}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {presets.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => {
                                const pos = { lat: preset.lat, lng: preset.lng };
                                if (pickerMode === 'origin') {
                                  setValue('origin', pos);
                                  setValue('meetingPoint', preset.name);
                                  clearErrors('origin');
                                } else {
                                  setValue('destination', pos);
                                  setValue('dropoffPoint', preset.name);
                                  clearErrors('destination');
                                }
                              }}
                              className="rounded-lg bg-brand-50 border border-brand-100 hover:bg-brand-100 hover:border-brand-200 text-brand-700 px-2.5 py-1 text-xs font-semibold transition-colors duration-200"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {errors.origin?.message && pickerMode === 'origin' && (
                    <p className="text-center text-xs font-semibold text-[#ba1a1a] mt-1">
                      {errors.origin.message}
                    </p>
                  )}
                  {errors.destination?.message && pickerMode === 'destination' && (
                    <p className="text-center text-xs font-semibold text-[#ba1a1a] mt-1">
                      {errors.destination.message}
                    </p>
                  )}
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
                
                <div className="flex items-start gap-3 rounded-xl border border-border p-4 bg-surface-muted/30">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="isRecurring" className="text-xs sm:text-sm font-medium text-text cursor-pointer select-none">
                    <span className="block font-bold">{language === 'az' ? 'Təkrarlanan gediş' : language === 'ru' ? 'Повторяющаяся поездка' : 'Recurring Trip'}</span>
                    <span className="block text-text-muted mt-0.5 text-[11px] leading-relaxed">{copy.recurringLabel}</span>
                  </label>
                </div>
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text">{copy.pricePerSeat}</label>
                    <button
                      type="button"
                      onClick={getAiSuggestion}
                      disabled={isAiLoading || !formValues.departureCity || !formValues.arrivalCity || !formValues.time}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95"
                    >
                      {isAiLoading ? (
                        <>
                          <Icon name="loader-2" size={12} className="animate-spin" />
                          <span>{copy.aiLoading}</span>
                        </>
                      ) : (
                        <>
                          <Icon name="sparkles" size={12} className="text-brand-500 animate-pulse" />
                          <span>{copy.aiSuggestBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <Input 
                    type="number" 
                    value={formValues.pricePerSeat} 
                    onChange={(e) => setValue('pricePerSeat', Number(e.target.value))} 
                    error={errors.pricePerSeat?.message} 
                  />

                  {/* AI Suggestion Result Area */}
                  {isAiLoading && (
                    <div className="mt-2 rounded-xl border border-border bg-white p-4 animate-fade-in shadow-sm">
                      <div className="flex items-center gap-3">
                        <Icon name="loader-2" size={16} className="animate-spin text-brand-500" />
                        <span className="text-xs font-medium text-text-muted">{copy.aiLoading}</span>
                      </div>
                    </div>
                  )}

                  {!isAiLoading && aiSuggestedPrice && (
                    <div className="mt-2 rounded-xl border border-brand-100 bg-brand-50/20 p-4 animate-fade-in shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
                            <Icon name="sparkles" size={14} className="text-brand-500" />
                            <span>{language === 'az' ? 'Süni İntellekt Tövsiyəsi' : language === 'ru' ? 'Рекомендация ИИ' : 'AI Price Suggestion'}</span>
                          </div>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-lg font-black text-brand-800">{aiSuggestedPrice}</span>
                            <span className="text-sm font-semibold text-brand-700">₼</span>
                          </div>
                          {aiReasoning && (
                            <p className="text-xs text-text-muted leading-relaxed mt-1 max-w-[320px] sm:max-w-[420px]">
                              {aiReasoning}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setValue('pricePerSeat', aiSuggestedPrice)}
                          className="shrink-0 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white px-3.5 py-2 text-xs font-bold transition-colors shadow-sm active:scale-95"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <h4 className="text-sm font-bold text-text mb-3">{copy.preferencesTitle}</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition-all ${formValues.femaleOnly ? 'border-brand-500 bg-brand-50/20' : 'border-border bg-white hover:bg-surface-muted/30'}`}
                         onClick={() => setValue('femaleOnly', !formValues.femaleOnly)}>
                      <input
                        type="checkbox"
                        checked={formValues.femaleOnly || false}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex items-center gap-2">
                        <Icon name="venus" size={16} className={formValues.femaleOnly ? 'text-brand-600' : 'text-text-muted'} />
                        <span className="text-xs font-semibold text-text">{copy.femaleOnlyLabel}</span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition-all ${formValues.smokingAllowed ? 'border-brand-500 bg-brand-50/20' : 'border-border bg-white hover:bg-surface-muted/30'}`}
                         onClick={() => setValue('smokingAllowed', !formValues.smokingAllowed)}>
                      <input
                        type="checkbox"
                        checked={formValues.smokingAllowed || false}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex items-center gap-2">
                        <Icon name={formValues.smokingAllowed ? 'cigarette' : 'cigarette-off'} size={16} className={formValues.smokingAllowed ? 'text-brand-600' : 'text-text-muted'} />
                        <span className="text-xs font-semibold text-text">{copy.smokingAllowedLabel}</span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition-all ${formValues.petsAllowed ? 'border-brand-500 bg-brand-50/20' : 'border-border bg-white hover:bg-surface-muted/30'}`}
                         onClick={() => setValue('petsAllowed', !formValues.petsAllowed)}>
                      <input
                        type="checkbox"
                        checked={formValues.petsAllowed || false}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex items-center gap-2">
                        <Icon name="paw-print" size={16} className={formValues.petsAllowed ? 'text-brand-600' : 'text-text-muted'} />
                        <span className="text-xs font-semibold text-text">{copy.petsAllowedLabel}</span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer select-none transition-all ${formValues.musicAllowed ? 'border-brand-500 bg-brand-50/20' : 'border-border bg-white hover:bg-surface-muted/30'}`}
                         onClick={() => setValue('musicAllowed', !formValues.musicAllowed)}>
                      <input
                        type="checkbox"
                        checked={formValues.musicAllowed !== false}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-[#c0c8ca] text-brand-600 focus:ring-brand-500"
                      />
                      <div className="flex items-center gap-2">
                        <Icon name="music" size={16} className={formValues.musicAllowed !== false ? 'text-brand-600' : 'text-text-muted'} />
                        <span className="text-xs font-semibold text-text">{copy.musicAllowedLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-text">{copy.commentLabel}</label>
                    <button
                      type="button"
                      onClick={handleGenerateDescription}
                      disabled={isDrafting || !formValues.departureCity || !formValues.arrivalCity || !formValues.time}
                      className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95"
                    >
                      {isDrafting ? (
                        <>
                          <Icon name="loader-2" size={14} className="animate-spin" />
                          <span>{copy.aiDraftLoading}</span>
                        </>
                      ) : (
                        <>
                          <Icon name="sparkles" size={14} className="text-brand-500 animate-pulse" />
                          <span>{copy.aiDraftBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={formValues.comment || ''}
                    onChange={(e) => setValue('comment', e.target.value)}
                    placeholder={copy.commentPlaceholder}
                    className="w-full rounded-xl border border-[#c0c8ca] p-3 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none resize-none transition-all"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-5 animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                    <Icon name="check-circle" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-text tracking-tight">{copy.summaryTitle}</h3>
                    <p className="text-sm text-text-muted">{language === 'az' ? 'Gediş məlumatlarını son dəfə yoxlayın' : language === 'ru' ? 'Проверьте данные поездки в последний раз' : 'Double check your trip details'}</p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-surface-muted border border-border shadow-sm p-5">
                  <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] pointer-events-none transform rotate-12">
                    <Icon name="map" size={140} />
                  </div>
                  
                  <div className="relative flex gap-4">
                    <div className="flex flex-col items-center mt-1.5">
                      <div className="h-3.5 w-3.5 rounded-full border-[3px] border-brand-500 bg-white shadow-sm"></div>
                      <div className="w-0.5 bg-gradient-to-b from-brand-300 to-border flex-1 my-1.5"></div>
                      <div className="h-3.5 w-3.5 rounded-full bg-brand-600 shadow-sm"></div>
                    </div>
                    <div className="flex flex-col gap-5 flex-1">
                      <div>
                        <p className="text-[11px] font-bold text-brand-600/70 uppercase tracking-widest mb-0.5">{language === 'az' ? 'Gediş' : language === 'ru' ? 'Отправление' : 'Departure'}</p>
                        <p className="text-lg font-bold text-text leading-tight">{formValues.departureCity}</p>
                        {formValues.meetingPoint && <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5"><Icon name="map-pin" size={14} className="text-text-muted/60"/> {formValues.meetingPoint}</p>}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-0.5">{language === 'az' ? 'Təyinat' : language === 'ru' ? 'Назначение' : 'Destination'}</p>
                        <p className="text-lg font-bold text-text leading-tight">{formValues.arrivalCity}</p>
                        {formValues.dropoffPoint && <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5"><Icon name="map-pin" size={14} className="text-text-muted/60"/> {formValues.dropoffPoint}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5 rounded-xl bg-white p-4 border border-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="calendar" size={16} className="text-brand-500" />
                      <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">{copy.summaryDate}</span>
                    </div>
                    <span className="text-[15px] font-bold text-text truncate">{formValues.date}</span>
                    <span className="text-sm font-medium text-text-muted">{formValues.time}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 rounded-xl bg-white p-4 border border-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="car" size={16} className="text-brand-500" />
                      <span className="text-xs text-text-muted font-semibold uppercase tracking-wider">{copy.summaryVehicle}</span>
                    </div>
                    <span className="text-[15px] font-bold text-text truncate">
                      {vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : (language === 'az' ? 'Standart avtomobil' : 'Standard')}
                    </span>
                    <span className="text-sm font-medium text-text-muted">{formValues.seatsTotal} {language === 'az' ? 'yer' : 'seats'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-brand-50/50 p-4 border border-brand-100">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100/50 text-brand-600">
                      <Icon name="banknote" size={20} />
                    </div>
                    <span className="text-sm font-bold text-text-secondary">{copy.summaryPrice}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-brand-700">{formValues.pricePerSeat}</span>
                    <span className="text-sm font-bold text-brand-600">₼</span>
                  </div>
                </div>

                {formValues.comment && (
                  <div className="flex flex-col gap-2 mt-1">
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1 flex items-center gap-1.5">
                      <Icon name="message-square" size={14} /> {copy.summaryComment}
                    </span>
                    <div className="relative rounded-2xl rounded-tl-sm bg-surface-muted/60 p-4 text-sm text-text leading-relaxed border border-border">
                      {formValues.comment}
                    </div>
                  </div>
                )}
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
      </ProtectedRoute>
    </WebLayout>
  );
}

