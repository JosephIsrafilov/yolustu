export type DataMode = 'mock' | 'api';

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:8000',
  dataMode: process.env.NEXT_PUBLIC_DATA_MODE === 'api' ? 'api' : 'mock',
} satisfies {
  apiUrl: string;
  wsUrl: string;
  dataMode: DataMode;
};

export const isMockDataMode = env.dataMode === 'mock';
