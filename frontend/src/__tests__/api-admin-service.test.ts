import { apiAdminService } from '@/services/api/api-admin-service';
import { apiClient } from '@/services/api-client';

jest.mock('@/services/api-client', () => ({
  apiClient: {
    get: jest.fn(),
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
});
