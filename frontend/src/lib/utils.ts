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
