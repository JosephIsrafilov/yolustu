import { apiClient } from '@/services/api-client';

interface MockResponse {
  ok: boolean;
  status: number;
  headers: { get: (name: string) => string | null };
  text: () => Promise<string>;
}

function createJsonResponse(status: number, body: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    text: async () => JSON.stringify(body),
  };
}

describe('apiClient refresh flow', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it('sends refresh request with JSON body and retries original request', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse(401, {
          error: { message: 'Unauthorized' },
        }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          user: { id: 'u-1' },
        }) as unknown as Response,
      )
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          id: 'u-1',
        }) as unknown as Response,
      );
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    localStorage.setItem('token', 'old-access-token');
    localStorage.setItem('refresh_token', 'old-refresh-token');

    const result = await apiClient.get<{ id: string }>('/users/me');

    expect(result).toEqual({ id: 'u-1' });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const refreshCall = fetchMock.mock.calls[1];
    expect(refreshCall[0]).toContain('/auth/refresh');
    expect((refreshCall[1] as RequestInit).method).toBe('POST');
    expect((refreshCall[1] as RequestInit).body).toBe(
      JSON.stringify({ refreshToken: 'old-refresh-token' }),
    );

    expect(localStorage.getItem('token')).toBe('new-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh-token');
  });
});
