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
      payment_id: 'payment-1',
      booking_id: 'booking-1',
      amount: '25.00',
      service_fee: '2.50',
      driver_amount: '22.50',
      currency: 'AZN',
      provider: 'mock',
      status: 'pending',
      checkout_url: 'http://localhost/mock',
      transaction_id: 'tx-1',
    });

    const response = await apiPaymentsService.createPaymentSession('booking-1');

    expect(mockedApiClient.post).toHaveBeenCalledWith('/payments/create', {
      booking_id: 'booking-1',
    });
    expect(response).toEqual({
      paymentId: 'payment-1',
      bookingId: 'booking-1',
      amount: 25,
      serviceFee: 2.5,
      driverAmount: 22.5,
      currency: 'AZN',
      provider: 'mock',
      status: 'pending',
      checkoutUrl: 'http://localhost/mock',
      transactionId: 'tx-1',
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

  it('simulates mock success by payment id', async () => {
    mockedApiClient.post.mockResolvedValue({ detail: 'Payment succeeded' });

    await apiPaymentsService.mockSucceed('payment-1');

    expect(mockedApiClient.post).toHaveBeenCalledWith('/payments/mock/payment-1/succeed');
  });
});
