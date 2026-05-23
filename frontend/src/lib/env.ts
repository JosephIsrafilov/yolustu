export type DataMode = 'mock' | 'api';

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://127.0.0.1:8000/api/v1',
  dataMode: process.env.NEXT_PUBLIC_DATA_MODE === 'mock' ? 'mock' : 'api',
} satisfies {
  apiUrl: string;
  wsUrl: string;
  dataMode: DataMode;
};

export const isMockDataMode = env.dataMode === 'mock';
