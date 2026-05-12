export type DataMode = 'mock' | 'api';

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  dataMode: process.env.NEXT_PUBLIC_DATA_MODE === 'api' ? 'api' : 'mock',
} satisfies {
  apiUrl: string;
  dataMode: DataMode;
};
