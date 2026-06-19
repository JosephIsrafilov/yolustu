import type { Language } from '@/lib/i18n';
import type { SeatSpot } from '@/types';

export const SEAT_SPOTS: SeatSpot[] = [
  'front_right',
  'back_left',
  'back_middle',
  'back_right',
];

const SEAT_LABELS: Record<Language, Record<SeatSpot, string>> = {
  az: {
    front_right: 'Ön sağ',
    back_left: 'Arxa sol',
    back_middle: 'Arxa orta',
    back_right: 'Arxa sağ',
  },
  ru: {
    front_right: 'Переднее правое',
    back_left: 'Заднее левое',
    back_middle: 'Заднее среднее',
    back_right: 'Заднее правое',
  },
  en: {
    front_right: 'Front right',
    back_left: 'Back left',
    back_middle: 'Back middle',
    back_right: 'Back right',
  },
};

export function getSeatLabel(spot: SeatSpot, language: Language): string {
  return SEAT_LABELS[language][spot];
}

export function formatSeatLabels(spots: SeatSpot[], language: Language): string {
  return spots.map((spot) => getSeatLabel(spot, language)).join(', ');
}
