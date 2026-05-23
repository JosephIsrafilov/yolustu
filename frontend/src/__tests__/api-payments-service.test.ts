import { apiPaymentsService } from '@/services/api/api-payments-service';
import { apiClient } from '@/services/api-client';

jest.mock('@/services/api-client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('api payments service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates payment session via API with booking_id payload', async () => {
    mockedApiClient.post.mockResolvedValue({
      transaction_id: 'tx-1',
      checkout_url: 'http://localhost/mock',
    });

    const response = await apiPaymentsService.createPaymentSession('booking-1');

    expect(mockedApiClient.post).toHaveBeenCalledWith('/payments/create', {
      booking_id: 'booking-1',
    });
    expect(response).toEqual({
      transaction_id: 'tx-1',
      checkout_url: 'http://localhost/mock',
    });
  });

  it('sends webhook simulation payload to API', async () => {
    mockedApiClient.post.mockResolvedValue({ detail: 'Webhook processed' });

    await apiPaymentsService.simulateWebhook({
      transaction_id: 'tx-1',
      status: 'success',
    });

    expect(mockedApiClient.post).toHaveBeenCalledWith('/payments/webhook', {
      transaction_id: 'tx-1',
      status: 'success',
    });
  });
});
