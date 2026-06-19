import type { BookingStatus } from '@/types';

export function effectiveBookingStatus(
  status: BookingStatus,
  paymentDeadline?: string,
  now = Date.now(),
): BookingStatus {
  if (
    (status === 'pending' || status === 'accepted') &&
    paymentDeadline &&
    new Date(paymentDeadline).getTime() <= now
  ) {
    return 'expired';
  }
  return status;
}
