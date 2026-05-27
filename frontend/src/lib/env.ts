export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? 'ws://127.0.0.1:8000/api/v1',
} satisfies {
  apiUrl: string;
  wsUrl: string;
};
