import { apiClient, setSessionExpiredHandler } from '@/services/api-client';

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
    apiClient.markSessionActive();
    setSessionExpiredHandler(null);
  });

  afterEach(() => {
    setSessionExpiredHandler(null);
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  });

  it('uses cookie refresh and retries original request with credentials', async () => {
    document.cookie = 'csrf_token=csrf-123; path=/';
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

  it('shares one refresh request across concurrent unauthorized requests', async () => {
    document.cookie = 'csrf_token=csrf-123; path=/';
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createJsonResponse(401, { detail: 'Unauthorized' }) as unknown as Response)
      .mockResolvedValueOnce(createJsonResponse(401, { detail: 'Unauthorized' }) as unknown as Response)
      .mockResolvedValueOnce(
        createJsonResponse(200, {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          user: { id: 'u-1' },
        }) as unknown as Response,
      )
      .mockResolvedValueOnce(createJsonResponse(200, { id: 'booking-1' }) as unknown as Response)
      .mockResolvedValueOnce(createJsonResponse(200, { id: 'user-1' }) as unknown as Response);
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const [booking, user] = await Promise.all([
      apiClient.get<{ id: string }>('/admin/bookings?page=1&limit=100'),
      apiClient.get<{ id: string }>('/users/me'),
    ]);

    expect(booking).toEqual({ id: 'booking-1' });
    expect(user).toEqual({ id: 'user-1' });
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/refresh'))).toHaveLength(1);
  });

  it('invalidates the session once when refresh fails and does not retry refresh', async () => {
    document.cookie = 'csrf_token=csrf-123; path=/';
    const onSessionExpired = jest.fn();
    setSessionExpiredHandler(onSessionExpired);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createJsonResponse(401, { detail: 'Unauthorized' }) as unknown as Response)
      .mockResolvedValueOnce(createJsonResponse(401, { detail: 'Refresh token missing' }) as unknown as Response)
      .mockResolvedValueOnce(createJsonResponse(401, { detail: 'Unauthorized' }) as unknown as Response);
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/admin/bookings?page=1&limit=100')).rejects.toMatchObject({ status: 401 });
    await expect(apiClient.get('/users/me')).rejects.toMatchObject({ status: 401 });

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/refresh'))).toHaveLength(1);
  });

  it('does not attempt refresh without a session hint cookie', async () => {
    const onSessionExpired = jest.fn();
    setSessionExpiredHandler(onSessionExpired);
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createJsonResponse(401, { detail: 'Unauthorized' }) as unknown as Response);
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/users/me')).rejects.toMatchObject({ status: 401 });

    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/refresh'))).toHaveLength(0);
  });

  it('does not attempt refresh for public rides endpoints', async () => {
    document.cookie = 'csrf_token=csrf-123; path=/';
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(createJsonResponse(401, { detail: 'Unauthorized' }) as unknown as Response);
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    await expect(apiClient.get('/rides/search?limit=20&offset=0')).rejects.toMatchObject({ status: 401 });

    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('/auth/refresh'))).toHaveLength(0);
  });
});
