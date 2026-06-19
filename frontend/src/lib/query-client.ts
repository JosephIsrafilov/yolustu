import { QueryClient } from '@tanstack/react-query';

let activeQueryClient: QueryClient | null = null;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function registerQueryClient(client: QueryClient): () => void {
  activeQueryClient = client;
  return () => {
    if (activeQueryClient === client) activeQueryClient = null;
  };
}

export async function invalidateWalletQueries(): Promise<void> {
  await activeQueryClient?.invalidateQueries({ queryKey: ['wallet'] });
}
