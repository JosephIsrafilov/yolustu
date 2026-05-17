import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function formatPrice(price: number): string {
  return `${price} ₼`;
}

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
