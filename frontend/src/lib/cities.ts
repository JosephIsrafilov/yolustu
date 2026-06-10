import { AZ_CITIES } from './utils';

const CITY_TRANSLATIONS: Record<string, Record<'az' | 'ru' | 'en', string>> = {
  'Bakı': { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  'Gəncə': { az: 'Gəncə', ru: 'Гянджа', en: 'Ganja' },
  'Sumqayıt': { az: 'Sumqayıt', ru: 'Сумгайыт', en: 'Sumqayit' },
  'Şəki': { az: 'Şəki', ru: 'Шеки', en: 'Sheki' },
  'Quba': { az: 'Quba', ru: 'Губа', en: 'Quba' },
  'Lənkəran': { az: 'Lənkəran', ru: 'Ленкорань', en: 'Lankaran' },
  'Şamaxı': { az: 'Şamaxı', ru: 'Шемаха', en: 'Shamakhi' },
  'Mingəçevir': { az: 'Mingəçevir', ru: 'Мингечевир', en: 'Mingachevir' },
  'Naftalan': { az: 'Naftalan', ru: 'Нафталан', en: 'Naftalan' },
  'Göyçay': { az: 'Göyçay', ru: 'Гёйчай', en: 'Goychay' },
};

export function getLocalizedCityName(city: string | null | undefined, lang: 'az' | 'ru' | 'en' | string): string {
  if (!city) return '';
  const translations = CITY_TRANSLATIONS[city];
  if (!translations) return city;
  return translations[lang as 'az' | 'ru' | 'en'] || city;
}

export function getLocalizedCityOptions(lang: 'az' | 'ru' | 'en' | string) {
  return AZ_CITIES.map(city => ({
    value: city,
    label: getLocalizedCityName(city, lang),
  }));
}
