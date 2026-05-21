export interface PaymentSessionResponse {
  checkout_url: string;
  transaction_id: string;
}

export interface WebhookPayload {
  transaction_id: string;
  status: 'success' | 'failed';
}

export interface PaymentsService {
  createPaymentSession(bookingId: string): Promise<PaymentSessionResponse>;
  simulateWebhook(payload: WebhookPayload): Promise<void>;
}
