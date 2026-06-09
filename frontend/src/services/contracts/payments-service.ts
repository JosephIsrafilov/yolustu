import type { Payment, PaymentStatus, Wallet, WalletTransaction } from '@/types';
import type { Paginated } from './admin-service';

export interface PaymentSessionResponse {
  paymentId: string;
  bookingId: string;
  amount: number;
  serviceFee: number;
  driverAmount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  checkoutUrl: string;
  transactionId: string;
}

export interface WebhookPayload {
  transaction_id: string;
  status: 'success' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
}

export interface PaymentsService {
  createPaymentSession(bookingId: string): Promise<PaymentSessionResponse>;
  getPayment(paymentId: string): Promise<Payment>;
  mockSucceed(paymentId: string): Promise<void>;
  mockFail(paymentId: string): Promise<void>;
  refund(paymentId: string): Promise<void>;
  simulateWebhook(payload: WebhookPayload): Promise<void>;
  getWallet(): Promise<Wallet>;
  getWalletTransactions(page?: number, limit?: number): Promise<Paginated<WalletTransaction>>;
  listAdminPayments(params?: {
    page?: number;
    limit?: number;
    status?: PaymentStatus | 'all';
    provider?: string;
    userId?: string;
  }): Promise<Paginated<Payment>>;
}
