import type { Language } from '@/lib/i18n';

export type CityKey =
  | 'baku'
  | 'sheki'
  | 'ganja'
  | 'quba'
  | 'shamakhi'
  | 'lankaran'
  | 'sumgayit'
  | 'mingachevir'
  | 'naftalan'
  | 'goychay'
  | 'khachmaz'
  | 'shirvan'
  | 'lerik'
  | 'yevlakh'
  | 'zaqatala'
  | 'barda'
  | 'agdam'
  | 'shusha'
  | 'fuzuli'
  | 'qazakh'
  | 'nakhchivan'
  | 'ordubad'
  | 'qubadli';

export const CITY_LABELS: Record<CityKey, Record<Language, string>> = {
  baku: { az: 'Bakı', ru: 'Баку', en: 'Baku' },
  sheki: { az: 'Şəki', ru: 'Шеки', en: 'Sheki' },
  ganja: { az: 'Gəncə', ru: 'Гянджа', en: 'Ganja' },
  quba: { az: 'Quba', ru: 'Губа', en: 'Quba' },
  shamakhi: { az: 'Şamaxı', ru: 'Шемаха', en: 'Shamakhi' },
  lankaran: { az: 'Lənkəran', ru: 'Ленкорань', en: 'Lankaran' },
  sumgayit: { az: 'Sumqayıt', ru: 'Сумгаит', en: 'Sumgayit' },
  mingachevir: { az: 'Mingəçevir', ru: 'Мингечевир', en: 'Mingachevir' },
  naftalan: { az: 'Naftalan', ru: 'Нафталан', en: 'Naftalan' },
  goychay: { az: 'Göyçay', ru: 'Гёйчай', en: 'Goychay' },
  khachmaz: { az: 'Xaçmaz', ru: 'Хачмаз', en: 'Khachmaz' },
  shirvan: { az: 'Şirvan', ru: 'Ширван', en: 'Shirvan' },
  lerik: { az: 'Lerik', ru: 'Лерик', en: 'Lerik' },
  yevlakh: { az: 'Yevlax', ru: 'Евлах', en: 'Yevlakh' },
  zaqatala: { az: 'Zaqatala', ru: 'Закаталы', en: 'Zaqatala' },
  barda: { az: 'Bərdə', ru: 'Барда', en: 'Barda' },
  agdam: { az: 'Ağdam', ru: 'Агдам', en: 'Agdam' },
  shusha: { az: 'Şuşa', ru: 'Шуша', en: 'Shusha' },
  fuzuli: { az: 'Füzuli', ru: 'Физули', en: 'Fuzuli' },
  qazakh: { az: 'Qazax', ru: 'Газах', en: 'Qazakh' },
  nakhchivan: { az: 'Naxçıvan', ru: 'Нахчыван', en: 'Nakhchivan' },
  ordubad: { az: 'Ordubad', ru: 'Ордубад', en: 'Ordubad' },
  qubadli: { az: 'Qubadlı', ru: 'Кубатлы', en: 'Qubadli' },
};

const CITY_ALIASES: Record<string, CityKey> = {
  baku: 'baku',
  'bakı': 'baku',
  баку: 'baku',
  sheki: 'sheki',
  shaki: 'sheki',
  'şəki': 'sheki',
  шеки: 'sheki',
  ganja: 'ganja',
  ganca: 'ganja',
  'gəncə': 'ganja',
  гянджа: 'ganja',
  quba: 'quba',
  губа: 'quba',
  shamakhi: 'shamakhi',
  'şamaxı': 'shamakhi',
  шемаха: 'shamakhi',
  lankaran: 'lankaran',
  'lənkəran': 'lankaran',
  ленкорань: 'lankaran',
  sumgayit: 'sumgayit',
  sumqayit: 'sumgayit',
  'sumqayıt': 'sumgayit',
  сумгаит: 'sumgayit',
  mingachevir: 'mingachevir',
  'mingəçevir': 'mingachevir',
  мингечевир: 'mingachevir',
  naftalan: 'naftalan',
  нафталан: 'naftalan',
  goychay: 'goychay',
  'göyçay': 'goychay',
  гёйчай: 'goychay',
  khachmaz: 'khachmaz',
  'xaçmaz': 'khachmaz',
  хачмаз: 'khachmaz',
  shirvan: 'shirvan',
  'şirvan': 'shirvan',
  ширван: 'shirvan',
  lerik: 'lerik',
  лерик: 'lerik',
  yevlakh: 'yevlakh',
  yevlah: 'yevlakh',
  евлах: 'yevlakh',
  zaqatala: 'zaqatala',
  закаталы: 'zaqatala',
  barda: 'barda',
  'bərdə': 'barda',
  барда: 'barda',
  agdam: 'agdam',
  'ağdam': 'agdam',
  агдам: 'agdam',
  shusha: 'shusha',
  'şuşa': 'shusha',
  шуша: 'shusha',
  fuzuli: 'fuzuli',
  'füzuli': 'fuzuli',
  физули: 'fuzuli',
  qazakh: 'qazakh',
  qazax: 'qazakh',
  газах: 'qazakh',
  nakhchivan: 'nakhchivan',
  'naxçıvan': 'nakhchivan',
  нахчыван: 'nakhchivan',
  ordubad: 'ordubad',
  ордубад: 'ordubad',
  qubadli: 'qubadli',
  'qubadlı': 'qubadli',
  кубатлы: 'qubadli',
};

export const CITY_COORDINATES: Partial<Record<CityKey, { lat: number; lng: number }>> = {
  baku: { lat: 40.4093, lng: 49.8671 },
  ganja: { lat: 40.6828, lng: 46.3606 },
  sumgayit: { lat: 40.5897, lng: 49.6686 },
  sheki: { lat: 41.1919, lng: 47.1706 },
  quba: { lat: 41.3643, lng: 48.5134 },
  lankaran: { lat: 38.7536, lng: 48.8511 },
  shamakhi: { lat: 40.6314, lng: 48.6414 },
  mingachevir: { lat: 40.7703, lng: 47.0486 },
  naftalan: { lat: 40.5067, lng: 46.825 },
  goychay: { lat: 40.6533, lng: 47.7408 },
};

export const PUBLIC_CITY_KEYS: CityKey[] = [
  'baku',
  'ganja',
  'sumgayit',
  'sheki',
  'quba',
  'lankaran',
  'shamakhi',
  'mingachevir',
  'naftalan',
  'goychay',
];

export function normalizeCityKey(input?: string | null): CityKey | null {
  if (!input) return null;
  return CITY_ALIASES[input.trim().toLocaleLowerCase('az')] ?? null;
}

export function getLocalizedCityName(input: string, language: Language): string {
  const key = normalizeCityKey(input);
  return key ? CITY_LABELS[key][language] : input;
}

export function getCanonicalCityName(input: string): string {
  const key = normalizeCityKey(input);
  return key ? CITY_LABELS[key].az : input;
}

export function getCityCoordinatesByName(input?: string | null): { lat: number; lng: number } | undefined {
  const key = normalizeCityKey(input);
  return key ? CITY_COORDINATES[key] : undefined;
}

export function getLocalizedCityOptions(language: Language) {
  return PUBLIC_CITY_KEYS.map((key) => ({
    value: CITY_LABELS[key].az,
    label: CITY_LABELS[key][language],
  }));
}
