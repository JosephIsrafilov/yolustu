import { apiClient } from '@/services/api-client';
import type { PaymentsService, PaymentSessionResponse, WebhookPayload } from '@/services/contracts/payments-service';

export const apiPaymentsService: PaymentsService = {
  async createPaymentSession(bookingId: string) {
    const res = await apiClient.post<PaymentSessionResponse>('/payments/create', { booking_id: bookingId });
    return res;
  },

  async simulateWebhook(payload: WebhookPayload) {
    await apiClient.post('/payments/webhook', payload);
  },
};
