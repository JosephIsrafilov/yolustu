import { type ClassValue, clsx } from 'clsx';

export const CURRENCY_CODE = 'AZN';
export const CURRENCY_SYMBOL = '₼';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function formatCurrency(amount: number | string): string {
  const numeric = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numeric) || !Number.isFinite(numeric)) return `0 ${CURRENCY_SYMBOL}`;
  return `${formatPriceValue(numeric)} ${CURRENCY_SYMBOL}`;
}

export function formatPrice(price: number): string {
  return formatCurrency(price);
}

export function formatPriceParts(price: number): { amount: string; symbol: string; code: string } {
  return {
    amount: formatPriceValue(price),
    symbol: CURRENCY_SYMBOL,
    code: CURRENCY_CODE,
  };
}

const formatPriceValue = (price: number): string => {
  if (!Number.isFinite(price)) return '0';
  const rounded = Math.round(price * 100) / 100;
  return rounded
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1');
};

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export function formatRating(rating: number): string {
  return `${rating.toFixed(1)} ★`;
}

export const AZ_CITIES = [
  'Bakı',
  'Gəncə',
  'Sumqayıt',
  'Şəki',
  'Quba',
  'Lənkəran',
  'Şamaxı',
  'Mingəçevir',
  'Naftalan',
] as const;

export type AZCity = (typeof AZ_CITIES)[number];

export interface Coordinates {
  lat: number;
  lng: number;
}

export const AZ_CITY_COORDINATES: Record<AZCity, Coordinates> = {
  'Bakı': { lat: 40.4093, lng: 49.8671 },
  'Gəncə': { lat: 40.6828, lng: 46.3606 },
  'Sumqayıt': { lat: 40.5897, lng: 49.6686 },
  'Şəki': { lat: 41.1919, lng: 47.1706 },
  'Quba': { lat: 41.3643, lng: 48.5134 },
  'Lənkəran': { lat: 38.7536, lng: 48.8511 },
  'Şamaxı': { lat: 40.6314, lng: 48.6414 },
  'Mingəçevir': { lat: 40.7703, lng: 47.0486 },
  'Naftalan': { lat: 40.5067, lng: 46.8250 },
};

export function getCityCoordinates(city: string): Coordinates | undefined {
  return AZ_CITY_COORDINATES[city as AZCity];
}

export function isWithinAzerbaijan(lat: number, lng: number): boolean {
  // Mainland Azerbaijan bounding box
  const inMainland = lat >= 38.38 && lat <= 41.95 && lng >= 45.0 && lng <= 50.9;
  // Nakhchivan exclave bounding box
  const inNakhchivan = lat >= 38.83 && lat <= 39.77 && lng >= 44.78 && lng <= 46.0;
  return inMainland || inNakhchivan;
}

export interface PresetLocation {
  name: string;
  lat: number;
  lng: number;
}

export const PRESET_LOCATIONS: Record<string, PresetLocation[]> = {
  'Bakı': [
    { name: '20 Yanvar metro', lat: 40.4032, lng: 49.8105 },
    { name: 'Koroğlu metro', lat: 40.4203, lng: 49.9179 },
    { name: 'Avtovağzal metro', lat: 40.4196, lng: 49.7946 },
    { name: '28 May metro', lat: 40.3798, lng: 49.8486 },
  ],
  'Sumqayıt': [
    { name: 'Sumqayıt Avtovağzalı', lat: 40.5836, lng: 49.6644 },
    { name: 'Sülh küçəsi (Karvan)', lat: 40.5897, lng: 49.6686 },
  ],
  'Gəncə': [
    { name: 'Gəncə Avtovağzalı', lat: 40.6972, lng: 46.3475 },
    { name: 'Göygöl dairəsi', lat: 40.6558, lng: 46.3683 },
  ],
};

export function getNextWeekdays(startDateStr: string, count: number): string[] {
  const dates: string[] = [];
  const current = new Date(startDateStr);
  
  // Find subsequent weekdays starting from the day after startDate
  let added = 0;
  while (added < count) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      dates.push(current.toISOString().split('T')[0]);
      added++;
    }
  }
  return dates;
}


