import { apiAdminService } from '@/services/api/api-admin-service';
import { apiClient } from '@/services/api-client';

jest.mock('@/services/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const apiUser = {
  id: 'u-1',
  first_name: 'Admin',
  last_name: 'User',
  phone: '+994501234567',
  rating: 4.8,
  total_rides: 12,
  created_at: '2026-05-23T10:00:00Z',
  role: 'driver' as const,
  city: 'Baku',
  verification_status: 'pending' as const,
  document_url: '/uploads/doc.pdf',
};

describe('apiAdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads pending verifications and maps users', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      items: [apiUser],
      total: 1,
      page: 1,
      size: 10,
      pages: 1,
    });

    const users = await apiAdminService.getPendingVerifications();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/admin/verifications?page=1&limit=10');
    expect(users.items).toHaveLength(1);
    expect(users.items[0].id).toBe('u-1');
    expect(users.items[0].verificationStatus).toBe('pending');
    expect(users.items[0].documentUrl).toBe('/uploads/doc.pdf');
  });

  it('approves verification via admin endpoint', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({
      ...apiUser,
      verification_status: 'approved',
    });

    const user = await apiAdminService.approveVerification('u-1');

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/admin/verifications/u-1/approve');
    expect(user.verificationStatus).toBe('approved');
  });

  it('rejects verification via admin endpoint', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({
      ...apiUser,
      verification_status: 'rejected',
    });

    const user = await apiAdminService.rejectVerification('u-1');

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/admin/verifications/u-1/reject');
    expect(user.verificationStatus).toBe('rejected');
  });

  it('getUsers defaults to page 1 / limit 10 with no filters', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      items: [apiUser],
      total: 1,
      page: 1,
      size: 10,
      pages: 1,
    });

    const users = await apiAdminService.getUsers();

    expect(mockedApiClient.get).toHaveBeenCalledWith('/admin/users?page=1&limit=10');
    expect(users.items).toHaveLength(1);
    expect(users.items[0].id).toBe('u-1');
  });

  it('getUsers forwards role/status/verification/search as query params', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 2,
      size: 25,
      pages: 0,
    });

    await apiAdminService.getUsers({
      page: 2,
      limit: 25,
      role: 'driver',
      status: 'blocked',
      verification: 'pending',
      q: 'elvin',
    });

    expect(mockedApiClient.get).toHaveBeenCalledWith(
      '/admin/users?page=2&limit=25&role=driver&status=blocked&verification=pending&q=elvin'
    );
  });

  it('getUsers omits empty/whitespace search and unset filters', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      size: 10,
      pages: 0,
    });

    await apiAdminService.getUsers({ q: '   ' });

    expect(mockedApiClient.get).toHaveBeenCalledWith('/admin/users?page=1&limit=10');
  });

  it('createUser posts user data and maps response', async () => {
    mockedApiClient.post.mockResolvedValueOnce({
      ...apiUser,
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'admin',
    });

    const user = await apiAdminService.createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+994501234567',
      email: 'jane@example.com',
      password: 'password123',
      role: 'admin',
      city: 'Baku',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/admin/users', {
      first_name: 'Jane',
      last_name: 'Doe',
      phone: '+994501234567',
      email: 'jane@example.com',
      password: 'password123',
      role: 'admin',
      city: 'Baku',
    });
    expect(user.fullName).toBe('Jane Doe');
    expect(user.role).toBe('admin');
  });

  it('updateUserRole patches role and maps response', async () => {
    mockedApiClient.patch.mockResolvedValueOnce({
      ...apiUser,
      role: 'driver',
    });

    const user = await apiAdminService.updateUserRole('u-1', 'driver');

    expect(mockedApiClient.patch).toHaveBeenCalledWith('/admin/users/u-1/role', { role: 'driver' });
    expect(user.role).toBe('driver');
  });
});
