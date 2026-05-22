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
  "Geely": ["Coolray", "Tugella", "Monjaro", "Atlas", "Emgrand"]
};

export const CAR_COLORS = [
  "Ağ (Белый)", 
  "Qara (Черный)", 
  "Gümüşü (Серебристый)", 
  "Boz (Серый)", 
  "Qırmızı (Красный)", 
  "Göy (Синий)", 
  "Yaşıl (Зеленый)", 
  "Sarı (Желтый)", 
  "Qəhvəyi (Коричневый)",
  "Narıncı (Оранжевый)",
  "Tünd Göy (Темно-синий)",
  "Bənövşəyi (Фиолетовый)",
  "Qızılı (Золотистый)",
  "Bej (Бежевый)"
];

const currentYear = new Date().getFullYear();
export const CAR_YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
