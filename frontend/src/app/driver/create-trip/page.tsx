'use client';

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';

import DriverLayout from '@/components/driver/DriverLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import TimePicker from '@/components/ui/TimePicker';
import CitySelect from '@/components/ui/CitySelect';
import Select from '@/components/ui/Select';
import Icon from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES, getCityCoordinates, isWithinAzerbaijan } from '@/lib/utils';
import type { Vehicle } from '@/types';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { MapContainer, LocationPicker } from '@/components/ui/Map';
import { apiClient } from '@/services/api-client';
import { mapApiVehicleToVehicle, type ApiVehicle } from '@/services/api/mappers';
import { apiAiService } from '@/services/api/api-ai-service';
import { I18N } from '@/lib/i18n';
import SuccessModal from '@/components/ui/SuccessModal';

const getValidationSchema = (requiredErrorMsg: string, sameCityErrorMsg: string, seatsErrorMsg: string, priceErrorMsg: string) => {
  return z.object({
    departureCity: z.string().min(1, requiredErrorMsg),
    arrivalCity: z.string().min(1, requiredErrorMsg),
    meetingPoint: z.string().optional(),
    dropoffPoint: z.string().optional(),
    date: z.string().min(1, requiredErrorMsg),
    time: z.string().min(1, requiredErrorMsg),
    seatsTotal: z.number().int().min(1, seatsErrorMsg).max(8, seatsErrorMsg),
    availableSpots: z.array(z.string()).optional(),
    pricePerSeat: z.number().min(0.01, priceErrorMsg),
    comment: z.string().optional(),
    origin: z.object({ lat: z.number(), lng: z.number() }).optional(),
    destination: z.object({ lat: z.number(), lng: z.number() }).optional(),
    smokingAllowed: z.boolean().optional(),
    petsAllowed: z.boolean().optional(),
    musicAllowed: z.boolean().optional(),
    femaleOnly: z.boolean().optional(),
    vehicleId: z.string().optional(),
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

const CREATE_TRIP_PAGE_I18N = {
  az: {
    addVehicleToProfile: 'Avtomobili profilə əlavə et',
    editRoute: 'Dəyiş',
    dropoffTab: 'Eniş',
    mapPickMeeting: 'Xəritədə görüş nöqtəsini seçin',
    mapPickDropoff: 'Xəritədə eniş nöqtəsini seçin',
    recurringTrip: 'Təkrarlanan gediş',
    aiPriceSuggestion: 'Süni İntellekt Tövsiyəsi',
    applySuggestion: 'Tətbiq et',
    summaryDoubleCheck: 'Gediş məlumatlarını son dəfə yoxlayın',
    departureLabel: 'Gediş',
    destinationLabel: 'Təyinat',
    standardVehicle: 'Standart avtomobil',
    seatsUnit: 'yer',
    saving: 'Yadda saxlanılır...',
    calcRecommendedPrice: 'Tövsiyə olunan qiyməti hesabla',
  },
  ru: {
    addVehicleToProfile: 'Добавить автомобиль в профиль',
    editRoute: 'Изменить',
    dropoffTab: 'Высадка',
    mapPickMeeting: 'Выберите место встречи на карте',
    mapPickDropoff: 'Выберите место высадки на карте',
    recurringTrip: 'Повторяющаяся поездка',
    aiPriceSuggestion: 'Рекомендация ИИ',
    applySuggestion: 'Применить',
    summaryDoubleCheck: 'Проверьте данные поездки в последний раз',
    departureLabel: 'Отправление',
    destinationLabel: 'Назначение',
    standardVehicle: 'Стандартный автомобиль',
    seatsUnit: 'мест',
    saving: 'Сохранение...',
    calcRecommendedPrice: 'Рассчитать рекомендуемую цену',
  },
  en: {
    addVehicleToProfile: 'Add vehicle to profile',
    editRoute: 'Edit',
    dropoffTab: 'Drop-off',
    mapPickMeeting: 'Select meeting point on the map',
    mapPickDropoff: 'Select dropoff point on the map',
    recurringTrip: 'Recurring trip',
    aiPriceSuggestion: 'AI price suggestion',
    applySuggestion: 'Apply',
    summaryDoubleCheck: 'Double check your trip details',
    departureLabel: 'Departure',
    destinationLabel: 'Destination',
    standardVehicle: 'Standard vehicle',
    seatsUnit: 'seats',
    saving: 'Saving...',
    calcRecommendedPrice: 'Calculate recommended price',
  },
} as const;

export default function CreateTripPage() {
  const router = useRouter();
  const { createTrip, lastError, clearError, language } = useAppStore();
  
  const copy = I18N[language].createTrip;
  const common = I18N[language].common;
  const pageCopy = CREATE_TRIP_PAGE_I18N[language];
  
  const steps = [copy.stepRoute, copy.stepDate, copy.stepSeats, copy.stepOverview];
  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [pickerMode, setPickerMode] = useState<'origin' | 'destination'>('origin');
  const [isRecurring, setIsRecurring] = useState(false);
  const [carLayout, setCarLayout] = useState<'5-seater' | '7-seater'>('5-seater');
  const [isDrafting, setIsDrafting] = useState(false);
  const [showPriceRecommendation, setShowPriceRecommendation] = useState(false);
  const [prevCities, setPrevCities] = useState({ dep: '', arr: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);


  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['my-vehicles'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiVehicle[]>('/vehicles/my');
        return response.map(mapApiVehicleToVehicle);
      } catch (err) {
        return [];
      }
    },
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
      seatsTotal: 0,
      availableSpots: [],
      pricePerSeat: 10,
      comment: '',
      origin: undefined,
      destination: undefined,
      smokingAllowed: false,
      petsAllowed: false,
      musicAllowed: true,
      femaleOnly: false,
      vehicleId: '',
    }
  });

  const formValues = useWatch({ control }) as FormValues;

  if (formValues.departureCity !== prevCities.dep || formValues.arrivalCity !== prevCities.arr) {
    setPrevCities({ dep: formValues.departureCity || '', arr: formValues.arrivalCity || '' });
    setShowPriceRecommendation(false);
  }

  useEffect(() => {
    if (vehicles.length > 0 && !formValues.vehicleId) {
      setValue('vehicleId', vehicles[0].id);
    }
  }, [vehicles, setValue, formValues.vehicleId]);

  const mapCenter = useMemo((): [number, number] => {
    if (pickerMode === 'origin') {
      if (formValues.origin) return [formValues.origin.lat, formValues.origin.lng];
      if (formValues.departureCity) {
        const coords = getCityCoordinates(formValues.departureCity);
        if (coords) return [coords.lat, coords.lng];
      }
    } else {
      if (formValues.destination) return [formValues.destination.lat, formValues.destination.lng];
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

  const getRecommendedPrice = (origin: string, dest: string): number | null => {
    if (!origin || !dest) return null;
    const o = origin.toLowerCase();
    const d = dest.toLowerCase();
    
    if ((o === 'bakı' && d === 'şəki') || (o === 'şəki' && d === 'bakı')) return 24;
    if ((o === 'bakı' && d === 'gəncə') || (o === 'gəncə' && d === 'bakı')) return 22;
    if ((o === 'bakı' && d === 'quba') || (o === 'quba' && d === 'bakı')) return 15;
    if ((o === 'bakı' && d === 'lənkəran') || (o === 'lənkəran' && d === 'bakı')) return 20;
    if ((o === 'bakı' && d === 'şamaxı') || (o === 'şamaxı' && d === 'bakı')) return 10;
    
    return 15;
  };

  const recommendedPrice = getRecommendedPrice(formValues.departureCity, formValues.arrivalCity);

  const handleGenerateDescription = async () => {
    const values = getValues();
    if (!values.departureCity || !values.arrivalCity || !values.time) return;
    setIsDrafting(true);
    const selectedVehicle = vehicles.find(v => v.id === values.vehicleId) || vehicles[0];
    const carModel = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : 'Standard Vehicle';

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
        car_model: carModel,
        seats_total: values.seatsTotal || 4,
        language: language,
        preferences: prefs,
      });
      if (response?.description) {
        setValue('comment', response.description);
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setIsDrafting(false);
    }
  };

  const validateStep = async () => {
    if (step === 0) return await trigger(['departureCity', 'arrivalCity']);
    if (step === 1) return await trigger(['date', 'time']);
    if (step === 2) return await trigger(['seatsTotal', 'pricePerSeat']);
    return true;
  };

  const next = async () => {
    const isValid = await validateStep();
    if (isValid) {
      const nextStep = Math.min(step + 1, 3);
      setStep(nextStep);
      setMaxStepReached((prev) => Math.max(prev, nextStep));
    }
  };
  
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const createTripMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const selectedVehicle = vehicles.find(v => v.id === values.vehicleId) || vehicles[0];
      const baseTripData = {
        departureCity: values.departureCity,
        arrivalCity: values.arrivalCity,
        meetingPoint: values.meetingPoint || '',
        dropoffPoint: values.dropoffPoint || '',
        date: values.date,
        time: values.time,
        seatsTotal: values.seatsTotal,
        availableSpots: values.availableSpots || [],
        pricePerSeat: values.pricePerSeat,
        carModel: selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : '',
        comment: values.comment || '',
        origin: values.origin,
        destination: values.destination,
        vehicleId: selectedVehicle?.id || '',
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
      if (id) setShowSuccessModal(true);
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
          setError(coordField, { type: 'manual', message: copy.onlyAzerbaijanError });
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
      // Error handled silently
    }
  };

  // Spot toggle helper
  const toggleSpot = (spotId: string) => {
    const current = getValues('availableSpots') || [];
    let next = [];
    if (current.includes(spotId)) {
      next = current.filter(id => id !== spotId);
    } else {
      next = [...current, spotId];
    }
    setValue('availableSpots', next);
    setValue('seatsTotal', next.length, { shouldValidate: true });
  };

  const renderSpot = (id: string, label: string) => {
    const isSelected = formValues.availableSpots?.includes(id);
    return (
      <button 
        type="button" 
        onClick={() => toggleSpot(id)}
        className={`w-full py-2.5 rounded-xl border-2 font-bold text-xs transition-all active:scale-95 ${
          isSelected 
            ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm' 
            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <DriverLayout narrow>
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 pt-8">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <ProtectedRoute mode="driver">
            {lastError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                <div className="flex items-center justify-between gap-3">
                  <span>{lastError}</span>
                  <button type="button" onClick={clearError} className="text-xs font-bold hover:underline">{common.close}</button>
                </div>
              </div>
            )}
            
            {/* Step Indicators */}
            <div className="mb-8">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200" />
                <div 
                  className="absolute left-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-teal-500 transition-all duration-500 ease-out" 
                  style={{ width: `calc(${(step / (steps.length - 1)) * 100}% - 2rem)` }} 
                />
                {steps.map((s, i) => {
                  const isCurrent = i === step;
                  const isSelectable = i <= maxStepReached;
                  const isPast = i < step;
                  return (
                    <div 
                      key={s} 
                      className="relative z-10 flex flex-col items-center gap-2 cursor-pointer group"
                      onClick={async () => {
                        if (isSelectable) {
                          if (i < step) setStep(i);
                          else if (i > step && await validateStep()) setStep(i);
                        }
                      }}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isCurrent ? 'border-teal-500 bg-white text-teal-600 shadow-sm scale-110' : 
                        isPast ? 'border-teal-500 bg-teal-500 text-white' : 
                        'border-slate-200 bg-white text-slate-400 group-hover:border-slate-300'
                      }`}>
                        {isPast ? <Icon name="check" size={14} /> : <span className="text-xs font-bold">{i + 1}</span>}
                      </div>
                      <span className={`absolute -bottom-6 w-max text-[10px] font-bold transition-colors duration-300 uppercase tracking-wide ${
                        isCurrent ? 'text-teal-600' : isPast ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Route Summary Card */}
            {step > 0 && formValues.departureCity && formValues.arrivalCity && (
              <div className="mb-6 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <Icon name="map" size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{copy.summaryRoute}</p>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{formValues.departureCity}</span>
                      <Icon name="arrow-right" size={12} className="text-slate-400" />
                      <span>{formValues.arrivalCity}</span>
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setStep(0)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors border border-slate-200"
                >
                  {pageCopy.editRoute}
                </button>
              </div>
            )}

            <Card className="p-6 sm:p-8 rounded-3xl shadow-md border-slate-200 bg-white">
              {/* STEP 1: ROUTE */}
              {step === 0 && (
                <div className="flex flex-col gap-5">
                  <Controller name="departureCity" control={control} render={({ field }) => (
                    <CitySelect label={copy.fromCity} value={field.value} onChange={field.onChange} options={AZ_CITIES} error={errors.departureCity?.message} />
                  )} />
                  <Controller name="arrivalCity" control={control} render={({ field }) => (
                    <CitySelect label={copy.toCity} value={field.value} onChange={field.onChange} options={AZ_CITIES} error={errors.arrivalCity?.message} />
                  )} />

                  <div className="mt-2 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-700">{copy.mapHint}</label>
                      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 border border-slate-200">
                        <button type="button" onClick={() => setPickerMode('origin')} className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${pickerMode === 'origin' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>
                          {copy.summaryMeeting}
                        </button>
                        <button type="button" onClick={() => setPickerMode('destination')} className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${pickerMode === 'destination' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>
                          {pageCopy.dropoffTab}
                        </button>
                      </div>
                    </div>
                    
                    <div className="overflow-hidden rounded-xl border border-slate-200 h-64">
                      <MapContainer 
                        center={mapCenter} 
                        zoom={mapZoom} 
                        markers={[{ position: mapCenter, type: 'origin' }]}
                      >
                        <LocationPicker 
                          mode={pickerMode}
                          origin={formValues.origin}
                          destination={formValues.destination}
                          onSelectOrigin={(pos) => { 
                            if (!isWithinAzerbaijan(pos.lat, pos.lng)) {
                              setError('origin', { type: 'manual', message: copy.onlyAzerbaijanError });
                              return;
                            }
                            clearErrors('origin'); setValue('origin', pos); reverseGeocode(pos.lat, pos.lng, 'meetingPoint'); 
                          }}
                          onSelectDestination={(pos) => { 
                            if (!isWithinAzerbaijan(pos.lat, pos.lng)) {
                              setError('destination', { type: 'manual', message: copy.onlyAzerbaijanError });
                              return;
                            }
                            clearErrors('destination'); setValue('destination', pos); reverseGeocode(pos.lat, pos.lng, 'dropoffPoint'); 
                          }}
                        />
                      </MapContainer>
                    </div>

                    <Input label={copy.meetingPoint} placeholder={copy.meetingPlaceholder} value={formValues.meetingPoint || ''} onChange={(e) => setValue('meetingPoint', e.target.value)} icon={<Icon name="map-pin" size={16} />} />
                    <Input label={copy.dropoffPoint} placeholder={copy.dropoffPlaceholder} value={formValues.dropoffPoint || ''} onChange={(e) => setValue('dropoffPoint', e.target.value)} icon={<Icon name="map-pin" size={16} />} />
                  </div>
                </div>
              )}

              {/* STEP 2: DATE & TIME */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <Controller name="date" control={control} render={({ field }) => (
                      <DatePicker value={field.value} onChange={field.onChange} label={copy.dateLabel} placeholder={common.selectDate} />
                    )} />
                    {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
                  </div>
                  <Controller name="time" control={control} render={({ field }) => (
                    <TimePicker label={copy.timeLabel} value={field.value} onChange={field.onChange} error={errors.time?.message} placeholder={copy.timeLabel} />
                  )} />
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <input type="checkbox" id="isRecurring" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                    <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                      <span className="block font-bold">{pageCopy.recurringTrip}</span>
                      <span className="block text-slate-500 mt-0.5 text-xs">{copy.recurringLabel}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 3: SEATS & PRICE */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  {vehicles.length > 0 && (
                    <Controller name="vehicleId" control={control} render={({ field }) => (
                      <Select value={field.value || ''} onChange={(val) => { field.onChange(val); }} options={vehicles.map(v => ({ value: v.id, label: `${v.brand} ${v.model} (${v.plateNumber})` }))} placeholder="Select vehicle" />
                    )} />
                  )}

                  {/* Dynamic Seat Selector */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-bold text-slate-900">Select Available Spots</label>
                      <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                        <button type="button" onClick={() => {setCarLayout('5-seater'); setValue('availableSpots', []); setValue('seatsTotal', 0);}} className={`px-2 py-1 text-xs font-bold rounded-md ${carLayout === '5-seater' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}>5-Seater</button>
                        <button type="button" onClick={() => {setCarLayout('7-seater'); setValue('availableSpots', []); setValue('seatsTotal', 0);}} className={`px-2 py-1 text-xs font-bold rounded-md ${carLayout === '7-seater' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}>7-Seater</button>
                      </div>
                    </div>

                    <div className="mx-auto w-56 flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex gap-2">
                        <div className="w-1/2 py-2.5 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border-2 border-transparent">
                          <Icon name="car" size={16} />
                        </div>
                        <div className="w-1/2">{renderSpot('front_passenger', 'Front')}</div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1/3">{renderSpot('rear_left', 'Rear L')}</div>
                        <div className="w-1/3">{renderSpot('rear_middle', 'Rear M')}</div>
                        <div className="w-1/3">{renderSpot('rear_right', 'Rear R')}</div>
                      </div>
                      {carLayout === '7-seater' && (
                        <div className="flex gap-2 justify-center">
                          <div className="w-1/2">{renderSpot('third_row_left', '3rd Row L')}</div>
                          <div className="w-1/2">{renderSpot('third_row_right', '3rd Row R')}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Total spots offered:</span>
                      <span className="text-sm font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-lg">{formValues.seatsTotal}</span>
                    </div>
                    {errors.seatsTotal && <p className="text-xs font-semibold text-red-500 mt-2">{errors.seatsTotal.message}</p>}
                  </div>

                    {/* Tactical Price Input */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{copy.pricePerSeat}</label>
                    </div>
                    <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between focus-within:border-teal-500 transition-colors">
                      <span className="text-2xl font-black text-slate-400">₼</span>
                      <input type="number" value={formValues.pricePerSeat || ''} onChange={(e) => setValue('pricePerSeat', Number(e.target.value))} className="w-full bg-transparent text-right text-3xl font-black text-slate-900 outline-none border-none focus:ring-0 p-0" placeholder="0" />
                    </div>
                    {errors.pricePerSeat && <p className="text-xs font-semibold text-red-500">{errors.pricePerSeat.message}</p>}

                    {!showPriceRecommendation && recommendedPrice ? (
                      <button type="button" onClick={() => setShowPriceRecommendation(true)} className="mt-2 text-xs font-bold text-teal-600 self-start flex items-center gap-1 hover:underline">
                        <Icon name="sparkles" size={12} />
                        {pageCopy.calcRecommendedPrice}
                      </button>
                    ) : showPriceRecommendation && recommendedPrice && formValues.pricePerSeat !== recommendedPrice ? (
                      <div className="mt-2 p-3 rounded-xl bg-teal-50 border border-teal-100 shadow-sm transition-all flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-700 flex items-center gap-1">
                            <Icon name="sparkles" size={12} className="text-teal-500" /> 
                            {pageCopy.aiPriceSuggestion || "Tövsiyə olunan qiymət"}: {recommendedPrice} ₼
                          </span>
                        </div>
                        <button type="button" onClick={() => setValue('pricePerSeat', recommendedPrice)} className="w-full rounded-lg bg-white border border-teal-200 text-teal-700 font-bold text-xs py-2 hover:bg-teal-50 transition-all active:scale-95">
                          {pageCopy.applySuggestion || "Tövsiyə olunan qiyməti istifadə et"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Preferences Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {([
                      { key: 'femaleOnly', label: copy.femaleOnlyLabel, icon: 'venus' },
                      { key: 'smokingAllowed', label: copy.smokingAllowedLabel, icon: 'cigarette' },
                      { key: 'petsAllowed', label: copy.petsAllowedLabel, icon: 'paw-print' },
                      { key: 'musicAllowed', label: copy.musicAllowedLabel, icon: 'music' },
                    ] as const).map(pref => {
                      const isActive = pref.key === 'musicAllowed' ? formValues.musicAllowed !== false : Boolean(formValues[pref.key]);
                      return (
                        <button key={pref.key} type="button" onClick={() => setValue(pref.key, !isActive)} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${isActive ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                          <Icon name={pref.icon} size={16} />
                          <span className="text-xs font-bold">{pref.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">{copy.commentLabel}</label>
                    <textarea rows={3} value={formValues.comment || ''} onChange={(e) => setValue('comment', e.target.value)} placeholder={copy.commentPlaceholder} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none" />
                    <button type="button" onClick={handleGenerateDescription} disabled={isDrafting} className="text-xs font-bold text-teal-600 self-start flex items-center gap-1 hover:underline">
                      {isDrafting ? <Icon name="loader-2" size={12} className="animate-spin" /> : <Icon name="sparkles" size={12} />}
                      {copy.aiDraftBtn}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: TICKET */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600 mb-3">
                      <Icon name="check-circle" size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">{copy.summaryTitle}</h3>
                    <p className="text-sm text-slate-500 mt-1">{pageCopy.summaryDoubleCheck}</p>
                  </div>

                  {/* Clean Light Ticket */}
                  <div className="relative mx-auto w-full max-w-sm rounded-2xl bg-white shadow-lg border border-slate-200 overflow-hidden">
                    <div className="p-6 pb-8 border-b border-dashed border-slate-300 relative">
                      <div className="absolute -left-3 bottom-[-12px] h-6 w-6 rounded-full bg-slate-50 border border-slate-200" />
                      <div className="absolute -right-3 bottom-[-12px] h-6 w-6 rounded-full bg-slate-50 border border-slate-200" />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{copy.summaryDate}</span>
                          <span className="block text-sm font-black text-slate-900">{formValues.date}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{copy.timeLabel}</span>
                          <span className="block text-sm font-black text-slate-900">{formValues.time}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-2xl font-black text-slate-900">{formValues.departureCity}</p>
                          {formValues.meetingPoint && <p className="text-xs text-slate-500 mt-1"><Icon name="map-pin" size={12} className="inline mr-1 text-teal-500"/>{formValues.meetingPoint}</p>}
                        </div>
                        <div className="h-4 w-0.5 bg-slate-200 ml-2" />
                        <div>
                          <p className="text-2xl font-black text-slate-900">{formValues.arrivalCity}</p>
                          {formValues.dropoffPoint && <p className="text-xs text-slate-500 mt-1"><Icon name="map-pin" size={12} className="inline mr-1 text-teal-500"/>{formValues.dropoffPoint}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{copy.summaryPrice}</span>
                          <span className="text-2xl font-black text-slate-900">{formValues.pricePerSeat} ₼</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{copy.seatsCount}</span>
                          <span className="text-sm font-black text-teal-600 bg-teal-100 px-2 py-0.5 rounded">{formValues.seatsTotal} spots</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex gap-3">
                <Button variant="outline" className="flex-1 py-3" onClick={step > 0 ? back : () => router.push(ROUTES.driverDashboard)}>
                  {copy.backBtn}
                </Button>
                {step < 3 ? (
                  <Button className="flex-1 py-3" onClick={next}>
                    {copy.nextBtn}
                  </Button>
                ) : (
                  <Button className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white" onClick={publish} disabled={createTripMutation.isPending}>
                    {createTripMutation.isPending ? pageCopy.saving : copy.publishBtn}
                  </Button>
                )}
              </div>
            </Card>

            <SuccessModal
              isOpen={showSuccessModal}
              onClose={() => {
                setShowSuccessModal(false);
                router.push(ROUTES.myTrips);
              }}
              title={
                language === 'az'
                  ? 'Səfər yaradıldı!'
                  : language === 'ru'
                  ? 'Поездка создана!'
                  : 'Trip Created!'
              }
              description={
                language === 'az'
                  ? 'Yeni səfəriniz uğurla dərc olundu. Sərnişinlər tezliklə sorğu göndərə biləcəklər.'
                  : language === 'ru'
                  ? 'Ваша новая поездка успешно опубликована. Пассажиры скоро смогут отправлять запросы.'
                  : 'Your new trip has been successfully published. Passengers will soon be able to send requests.'
              }
              buttonLabel={language === 'az' ? 'Tamam' : language === 'ru' ? 'ОК' : 'OK'}
            />
          </ProtectedRoute>
        </div>
      </div>
    </DriverLayout>
  );
}
