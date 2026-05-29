export const CAR_BRANDS_MODELS: Record<string, string[]> = {
  "Toyota": ["Prius", "Camry", "Corolla", "Land Cruiser", "RAV4", "Prado", "Yaris", "Avalon", "C-HR"],
  "Hyundai": ["Elantra", "Sonata", "Accent", "Tucson", "Santa Fe", "Creta", "Kona"],
  "Kia": ["Optima", "Rio", "Cerato", "Sportage", "Sorento", "Forte", "Stinger"],
  "Mercedes-Benz": ["C-Class", "E-Class", "S-Class", "G-Class", "Vito", "Sprinter", "GLC", "GLE"],
  "BMW": ["3 Series", "5 Series", "7 Series", "X5", "X6", "X3", "M3", "M5"],
  "Chevrolet": ["Cruze", "Malibu", "Aveo", "Niva", "Tahoe", "Camaro", "Equinox"],
  "Lada": ["Priora", "Vesta", "Granta", "Niva", "2107", "2106", "Largus", "Kalina"],
  "Ford": ["Fusion", "Focus", "Transit", "Fiesta", "Mustang", "Explorer"],
  "Nissan": ["Sunny", "Tiida", "X-Trail", "Qashqai", "Altima", "Patrol", "Juke"],
  "Honda": ["Insight", "Civic", "CR-V", "Accord", "Fit", "HR-V"],
  "Volkswagen": ["Passat", "Golf", "Polo", "Jetta", "Touareg", "Tiguan"],
  "Opel": ["Astra", "Vectra", "Corsa", "Zafira", "Insignia"],
  "Audi": ["A3", "A4", "A6", "A8", "Q5", "Q7"],
  "Lexus": ["RX", "LX", "ES", "GS", "IS", "NX"],
  "Mazda": ["Mazda3", "Mazda6", "CX-5", "CX-9"],
  "Skoda": ["Octavia", "Superb", "Rapid", "Kodiaq"],
  "Renault": ["Logan", "Duster", "Megane", "Clio", "Sandero"],
  "Peugeot": ["206", "308", "508", "3008", "406"],
  "Mitsubishi": ["Pajero", "Lancer", "Outlander", "L200"],
  "Changan": ["CS35", "CS75", "Alsvin", "UNI-T", "UNI-K"],
  "Geely": ["Coolray", "Tugella", "Monjaro", "Atlas", "Emgrand"],
  "BYD": ["F3", "Song", "Han", "Tang", "Yuan", "Dolphin", "Atto 3", "Seal", "Seagull"]
};

export const CAR_COLORS_LOCALIZED = [
  { value: 'white', label: { az: 'Ağ', ru: 'Белый', en: 'White' } },
  { value: 'black', label: { az: 'Qara', ru: 'Черный', en: 'Black' } },
  { value: 'silver', label: { az: 'Gümüşü', ru: 'Серебристый', en: 'Silver' } },
  { value: 'gray', label: { az: 'Boz', ru: 'Серый', en: 'Gray' } },
  { value: 'red', label: { az: 'Qırmızı', ru: 'Красный', en: 'Red' } },
  { value: 'blue', label: { az: 'Göy', ru: 'Синий', en: 'Blue' } },
  { value: 'green', label: { az: 'Yaşıl', ru: 'Зеленый', en: 'Green' } },
  { value: 'yellow', label: { az: 'Sarı', ru: 'Желтый', en: 'Yellow' } },
  { value: 'brown', label: { az: 'Qəhvəyi', ru: 'Коричневый', en: 'Brown' } },
  { value: 'orange', label: { az: 'Narıncı', ru: 'Оранжевый', en: 'Orange' } },
  { value: 'dark_blue', label: { az: 'Tünd Göy', ru: 'Темно-синий', en: 'Dark Blue' } },
  { value: 'purple', label: { az: 'Bənövşəyi', ru: 'Фиолетовый', en: 'Purple' } },
  { value: 'gold', label: { az: 'Qızılı', ru: 'Золотистый', en: 'Gold' } },
  { value: 'beige', label: { az: 'Bej', ru: 'Бежевый', en: 'Beige' } },
];

export function getLocalizedColor(color: string, lang: 'az' | 'ru' | 'en'): string {
  if (!color) return '';
  const c = color.trim().toLowerCase();
  
  const colorMap: Record<string, Record<'az' | 'ru' | 'en', string>> = {
    white: { az: 'Ağ', ru: 'Белый', en: 'White' },
    black: { az: 'Qara', ru: 'Черный', en: 'Black' },
    silver: { az: 'Gümüşü', ru: 'Серебристый', en: 'Silver' },
    gray: { az: 'Boz', ru: 'Серый', en: 'Gray' },
    red: { az: 'Qırmızı', ru: 'Красный', en: 'Red' },
    blue: { az: 'Göy', ru: 'Синий', en: 'Blue' },
    green: { az: 'Yaşıl', ru: 'Зеленый', en: 'Green' },
    yellow: { az: 'Sarı', ru: 'Желтый', en: 'Yellow' },
    brown: { az: 'Qəhvəyi', ru: 'Коричневый', en: 'Brown' },
    orange: { az: 'Narıncı', ru: 'Оранжевый', en: 'Orange' },
    dark_blue: { az: 'Tünd Göy', ru: 'Темно-синий', en: 'Dark Blue' },
    purple: { az: 'Bənövşəyi', ru: 'Фиолетовый', en: 'Purple' },
    gold: { az: 'Qızılı', ru: 'Золотистый', en: 'Gold' },
    beige: { az: 'Bej', ru: 'Бежевый', en: 'Beige' },
  };

  if (colorMap[c]) {
    return colorMap[c][lang];
  }

  const legacyMap: Record<string, string> = {
    "ağ (белый)": "white",
    "qara (черный)": "black",
    "gümüşü (серебристый)": "silver",
    "boz (серый)": "gray",
    "qırmızı (красный)": "red",
    "göy (синий)": "blue",
    "yaşıl (зеленый)": "green",
    "sarı (желтый)": "yellow",
    "qəhvəyi (коричневый)": "brown",
    "narıncı (оранжевый)": "orange",
    "tünd göy (темно-синий)": "dark_blue",
    "bənövşəyi (фиолетовый)": "purple",
    "qızılı (золотистый)": "gold",
    "bej (бежевый)": "beige"
  };

  const normalized = legacyMap[c];
  if (normalized && colorMap[normalized]) {
    return colorMap[normalized][lang];
  }

  return color;
}

const currentYear = new Date().getFullYear();
export const CAR_YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
