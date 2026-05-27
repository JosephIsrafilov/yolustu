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
    expect(localStorage.getItem('token')).toBe('access-2');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-2');
    expect(user.fullName).toBe('Elvin Mammadov');
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
    expect(user.verificationStatus).toBe('pending');
    expect(user.documentUrl).toBe('/uploads/doc.pdf');
  });
});
