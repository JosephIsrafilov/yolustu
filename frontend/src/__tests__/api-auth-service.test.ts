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

  it('calls login endpoint and clears legacy local tokens', async () => {
    localStorage.setItem('token', 'old-access');
    localStorage.setItem('refresh_token', 'old-refresh');
    mockedApiClient.post.mockResolvedValueOnce({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      user: apiUser,
    });

    const user = await apiAuthService.login({
      phone: '+994 50 123 45 67',
      password: 'password123',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
      phone: apiUser.phone,
      password: 'password123',
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(user.id).toBe(apiUser.id);
  });

  it('calls register endpoint and clears legacy local tokens', async () => {
    localStorage.setItem('token', 'old-access');
    localStorage.setItem('refresh_token', 'old-refresh');
    mockedApiClient.post.mockResolvedValueOnce({
      accessToken: 'access-2',
      refreshToken: 'refresh-2',
      user: apiUser,
    });

    const user = await apiAuthService.register({
      fullName: 'Elvin Mammadov',
      phone: '0501234567',
      email: 'elvin@example.com',
      password: 'password123',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', {
      phone: apiUser.phone,
      email: 'elvin@example.com',
      first_name: 'Elvin',
      last_name: 'Mammadov',
      password: 'password123',
    });
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(user.fullName).toBe('Elvin Mammadov');
  });

  it('calls logout endpoint and clears legacy local tokens', async () => {
    localStorage.setItem('token', 'old-access');
    localStorage.setItem('refresh_token', 'old-refresh');
    mockedApiClient.post.mockResolvedValueOnce({});

    await apiAuthService.logout();

    expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/logout');
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('gets current user from /users/me and maps fields', async () => {
    mockedApiClient.get.mockResolvedValueOnce(apiUser);

    const user = await apiAuthService.getCurrentUser();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/users/me');
    expect(user).not.toBeNull();
    expect(user?.id).toBe(apiUser.id);
    expect(user?.fullName).toBe('Elvin Mammadov');
    expect(user?.verificationStatus).toBe('approved');
  });

  it('updates profile via /users/me with mapped payload', async () => {
    mockedApiClient.put.mockResolvedValueOnce({
      ...apiUser,
      first_name: 'Updated',
      last_name: 'Name',
      city: 'Ganja',
      bio: 'Driver bio',
    });

    const user = await apiAuthService.updateProfile({
      fullName: 'Updated Name',
      phone: '+994501111111',
      city: 'Ganja',
      bio: 'Driver bio',
      avatarUrl: 'https://cdn.example/avatar.jpg',
    });

    expect(mockedApiClient.put).toHaveBeenCalledWith('/users/me', {
      phone: '+994501111111',
      first_name: 'Updated',
      last_name: 'Name',
      avatar_url: 'https://cdn.example/avatar.jpg',
      city: 'Ganja',
      bio: 'Driver bio',
    });
    expect(user.fullName).toBe('Updated Name');
    expect(user.city).toBe('Ganja');
    expect(user.bio).toBe('Driver bio');
  });

  it('submits verification document as FormData', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      ...apiUser,
      verification_status: 'pending',
      document_url: '/uploads/doc.pdf',
    });
    const file = new File(['demo'], 'doc.pdf', { type: 'application/pdf' });

    const user = await apiAuthService.submitVerification(file);

    expect(mockedApiClient.post).toHaveBeenCalledWith('/users/me/verify', expect.any(FormData));
    const submitted = mockedApiClient.post.mock.calls[0][1] as FormData;
    expect(submitted.get('file')).toBe(file);
    expect(user.verificationStatus).toBe('pending');
    expect(user.documentUrl).toBe('http://localhost:8000/uploads/doc.pdf');
  });

  it('normalizes phone for otp endpoints', async () => {
    mockedApiClient.post.mockResolvedValue({});

    await apiAuthService.requestOtp('50 123 45 67');
    await apiAuthService.verifyOtp({ phone: '0501234567', otp: '123456' });

    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      1,
      '/auth/request-otp?phone=%2B994501234567',
    );
    expect(mockedApiClient.post).toHaveBeenNthCalledWith(
      2,
      '/auth/verify-otp?phone=%2B994501234567&otp=123456',
    );
  });
});
