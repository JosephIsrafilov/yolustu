import { apiAuthService } from '@/services/api/api-auth-service';
import { apiClient } from '@/services/api-client';

jest.mock('@/services/api-client', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  post: jest.Mock;
  get: jest.Mock;
  put: jest.Mock;
};

const apiUser = {
  id: 'u-1',
  first_name: 'Elvin',
  last_name: 'Mammadov',
  phone: '+994501234567',
  rating: 4.8,
  total_rides: 12,
  created_at: '2026-05-23T10:00:00Z',
  role: 'driver' as const,
  city: 'Baku',
  verification_status: 'approved' as const,
};

describe('apiAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('calls login endpoint and persists tokens', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      user: apiUser,
    });

    const user = await apiAuthService.login({
      phone: apiUser.phone,
      password: 'password123',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
      phone: apiUser.phone,
      password: 'password123',
    });
    expect(localStorage.getItem('token')).toBe('access-1');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1');
    expect(user.id).toBe(apiUser.id);
  });

  it('calls register endpoint and persists tokens', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      user: apiUser,
    });

    const user = await apiAuthService.register({
      fullName: 'Elvin Mammadov',
      phone: apiUser.phone,
      password: 'password123',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', {
      phone: apiUser.phone,
      first_name: 'Elvin',
      last_name: 'Mammadov',
      password: 'password123',
    });
    expect(localStorage.getItem('token')).toBe('access-2');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-2');
    expect(user.fullName).toBe('Elvin Mammadov');
  });
});
