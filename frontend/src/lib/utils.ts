import { type ClassValue, clsx } from 'clsx';

// Lightweight classname merge — avoids tailwind-merge dependency
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Generate a simple pseudo-random ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/** Format price in Azerbaijani manat */
export function formatPrice(price: number): string {
  return `${price} ₼`;
}

/** Format date to human-readable (DD.MM.YYYY) */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Format time HH:MM */
export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

/** Render star rating as "4.5 ★" */
export function formatRating(rating: number): string {
  return `${rating.toFixed(1)} ★`;
}

/** Cities list for Azerbaijan */
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
