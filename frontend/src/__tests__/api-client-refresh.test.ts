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
    document.cookie = 'csrf_token=; Max-Age=0; path=/';
  });

  afterEach(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it('uses cookie refresh and retries original request with credentials', async () => {
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

    const result = await apiClient.get<{ id: string }>('/users/me');

    expect(result).toEqual({ id: 'u-1' });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const refreshCall = fetchMock.mock.calls[1];
    expect(refreshCall[0]).toContain('/auth/refresh');
    expect((refreshCall[1] as RequestInit).method).toBe('POST');
    expect((refreshCall[1] as RequestInit).body).toBeUndefined();
    expect((refreshCall[1] as RequestInit).credentials).toBe('include');

    const retryCall = fetchMock.mock.calls[2];
    expect((retryCall[1] as RequestInit).credentials).toBe('include');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('sends CSRF header for unsafe requests when csrf cookie exists', async () => {
    document.cookie = 'csrf_token=csrf-123; path=/';
    const fetchMock = jest.fn().mockResolvedValueOnce(
      createJsonResponse(200, {
        ok: true,
      }) as unknown as Response,
    );
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    await apiClient.post<{ ok: boolean }>('/auth/logout');

    const requestInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect((requestInit.headers as Record<string, string>)['X-CSRF-Token']).toBe('csrf-123');
    expect(requestInit.credentials).toBe('include');
  });
});
