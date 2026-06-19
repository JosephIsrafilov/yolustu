import { apiClient } from '@/services/api-client';
import type {
  PaymentsService,
  PaymentSessionResponse,
  WalletTransactionFilter,
  WebhookPayload,
} from '@/services/contracts/payments-service';
import type { Payment, PaymentStatus, Payout, PayoutStatus, Wallet, WalletTransaction } from '@/types';

interface ApiPaymentSessionResponse {
  payment_id: string;
  booking_id: string;
  amount: string | number;
  service_fee: string | number;
  driver_amount: string | number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  checkout_url: string;
  transaction_id: string;
}

interface ApiPayment {
  id: string;
  booking_id: string;
  passenger_id?: string | null;
  driver_id?: string | null;
  amount: string | number;
  service_fee: string | number;
  driver_amount: string | number;
  currency: string;
  provider: string;
  provider_payment_id?: string | null;
  provider_checkout_url?: string | null;
  status: PaymentStatus;
  transaction_id?: string | null;
  failure_reason?: string | null;
  created_at: string;
  paid_at?: string | null;
  refunded_at?: string | null;
}

interface ApiWallet {
  user_id: string;
  available_balance: string | number;
  pending_balance: string | number;
  currency: string;
  total_earned: string | number;
  total_spent: string | number;
  total_refunded: string | number;
}

interface ApiWalletTransaction {
  id: string;
  user_id: string;
  payment_id?: string | null;
  booking_id?: string | null;
  ride_id?: string | null;
  type: string; // Backend "topup" → frontend "adjustment"
  direction: WalletTransaction['direction'];
  amount: string | number;
  currency: string;
  status: WalletTransaction['status'];
  description?: string | null;
  created_at: string;
}

interface ApiPayout {
  id: string;
  user_id: string;
  amount: string | number;
  currency: string;
  status: PayoutStatus;
  method?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  processed_at?: string | null;
}

interface ApiPaginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

function amount(value: string | number): number {
  return Number(value);
}

const TRANSACTION_TYPE_ALIASES: Record<string, WalletTransaction['type']> = {
  topup: 'adjustment',
};

function normalizeTransactionType(type: string): WalletTransaction['type'] {
  return TRANSACTION_TYPE_ALIASES[type] ?? (type as WalletTransaction['type']);
}

function mapSession(api: ApiPaymentSessionResponse): PaymentSessionResponse {
  return {
    paymentId: api.payment_id,
    bookingId: api.booking_id,
    amount: amount(api.amount),
    serviceFee: amount(api.service_fee),
    driverAmount: amount(api.driver_amount),
    currency: api.currency,
    provider: api.provider,
    status: api.status,
    checkoutUrl: api.checkout_url,
    transactionId: api.transaction_id,
  };
}

function mapPayment(api: ApiPayment): Payment {
  return {
    id: api.id,
    bookingId: api.booking_id,
    passengerId: api.passenger_id ?? undefined,
    driverId: api.driver_id ?? undefined,
    amount: amount(api.amount),
    serviceFee: amount(api.service_fee),
    driverAmount: amount(api.driver_amount),
    currency: api.currency,
    provider: api.provider,
    providerPaymentId: api.provider_payment_id ?? undefined,
    checkoutUrl: api.provider_checkout_url ?? undefined,
    status: api.status,
    transactionId: api.transaction_id ?? undefined,
    failureReason: api.failure_reason ?? undefined,
    createdAt: api.created_at,
    paidAt: api.paid_at ?? undefined,
    refundedAt: api.refunded_at ?? undefined,
  };
}

function mapWallet(api: ApiWallet): Wallet {
  return {
    userId: api.user_id,
    availableBalance: amount(api.available_balance),
    pendingBalance: amount(api.pending_balance),
    currency: api.currency,
    totalEarned: amount(api.total_earned),
    totalSpent: amount(api.total_spent),
    totalRefunded: amount(api.total_refunded),
  };
}

function mapWalletTransaction(api: ApiWalletTransaction): WalletTransaction {
  return {
    id: api.id,
    userId: api.user_id,
    paymentId: api.payment_id ?? undefined,
    bookingId: api.booking_id ?? undefined,
    rideId: api.ride_id ?? undefined,
    type: normalizeTransactionType(api.type),
    direction: api.direction,
    amount: amount(api.amount),
    currency: api.currency,
    status: api.status,
    description: api.description ?? undefined,
    createdAt: api.created_at,
  };
}

function mapPayout(api: ApiPayout): Payout {
  return {
    id: api.id,
    userId: api.user_id,
    amount: amount(api.amount),
    currency: api.currency,
    status: api.status,
    method: api.method ?? undefined,
    metadata: api.metadata ?? undefined,
    createdAt: api.created_at,
    processedAt: api.processed_at ?? undefined,
  };
}

export const apiPaymentsService: PaymentsService = {
  async createPaymentSession(bookingId: string) {
    const res = await apiClient.post<ApiPaymentSessionResponse>('/payments/create', { booking_id: bookingId });
    return mapSession(res);
  },

  async getPayment(paymentId: string) {
    const res = await apiClient.get<ApiPayment>(`/payments/${paymentId}`);
    return mapPayment(res);
  },

  async mockSucceed(paymentId: string) {
    await apiClient.post(`/payments/mock/${paymentId}/succeed`);
  },

  async mockFail(paymentId: string) {
    await apiClient.post(`/payments/mock/${paymentId}/fail`);
  },

  async refund(paymentId: string) {
    await apiClient.post(`/payments/${paymentId}/refund`);
  },

  async simulateWebhook(payload: WebhookPayload) {
    await apiClient.post('/payments/webhook', payload);
  },

  async getWallet() {
    const res = await apiClient.get<ApiWallet>('/wallet/me');
    return mapWallet(res);
  },

  async getWalletTransactions(page = 1, limit = 50, filter: WalletTransactionFilter = 'all') {
    const query = new URLSearchParams({ page: String(page), limit: String(limit), filter });
    const res = await apiClient.get<ApiPaginated<ApiWalletTransaction>>(`/wallet/me/transactions?${query.toString()}`);
    return {
      ...res,
      items: res.items.map(mapWalletTransaction),
    };
  },

  async topupWallet(amount: number, idempotencyKey: string) {
    const res = await apiClient.post<{ detail: string; new_balance: number | string }>('/wallet/me/topup', {
      amount,
      idempotency_key: idempotencyKey,
    });
    return { detail: res.detail, new_balance: Number(res.new_balance) };
  },

  async payFromWallet(bookingId: string) {
    return await apiClient.post<{ detail: string }>('/payments/wallet-pay', { booking_id: bookingId });
  },

  async requestPayout(amount: number, idempotencyKey: string) {
    const res = await apiClient.post<ApiPayout>('/wallet/me/payouts', {
      amount,
      idempotency_key: idempotencyKey,
    });
    return mapPayout(res);
  },

  async getPayouts(page = 1, limit = 50) {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    const res = await apiClient.get<ApiPaginated<ApiPayout>>(`/wallet/me/payouts?${query.toString()}`);
    return {
      ...res,
      items: res.items.map(mapPayout),
    };
  },

  async listAdminPayments(params = {}) {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('limit', String(params.limit ?? 50));
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.provider) query.set('provider', params.provider);
    if (params.userId) query.set('user_id', params.userId);
    const res = await apiClient.get<ApiPaginated<ApiPayment>>(`/payments/admin?${query.toString()}`);
    return {
      ...res,
      items: res.items.map(mapPayment),
    };
  },
};
