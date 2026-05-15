export type DataMode = 'mock' | 'api';

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api',
  dataMode: process.env.NEXT_PUBLIC_DATA_MODE === 'api' ? 'api' : 'mock',
} satisfies {
  apiUrl: string;
  dataMode: DataMode;
};
