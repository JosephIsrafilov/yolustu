import type { Payment, PaymentStatus, Payout, Wallet, WalletTransaction } from '@/types';
import type { Paginated } from './admin-service';

export type WalletTransactionFilter =
  | 'all'
  | 'payments'
  | 'refunds'
  | 'income'
  | 'topups'
  | 'reservations';

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
  getWalletTransactions(
    page?: number,
    limit?: number,
    filter?: WalletTransactionFilter,
  ): Promise<Paginated<WalletTransaction>>;
  topupWallet(amount: number, idempotencyKey: string): Promise<{ detail: string; new_balance: number }>;
  createStripeTopUp(amount: number): Promise<{ checkout_url: string; session_id: string; payment_id: string | null }>;
  getStripeTopUpStatus(sessionId: string): Promise<{ session_id: string; status: string; amount: number; currency: string; wallet_balance: number }>;
  payFromWallet(bookingId: string): Promise<{ detail: string }>;
  requestPayout(amount: number, idempotencyKey: string): Promise<Payout>;
  getPayouts(page?: number, limit?: number): Promise<Paginated<Payout>>;
  listAdminPayments(params?: {
    page?: number;
    limit?: number;
    status?: PaymentStatus | 'all';
    provider?: string;
    userId?: string;
  }): Promise<Paginated<Payment>>;
}
