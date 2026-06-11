import { TRANSACTION_META } from '@/app/wallet/meta';
import type { WalletTransactionType } from '@/types';

/**
 * Runtime-exhaustive map of every WalletTransactionType. Declaring it as a
 * `Record<WalletTransactionType, true>` makes the compiler fail here if the
 * union grows or shrinks, so this list can never silently drift from the union
 * it mirrors. Its keys drive the runtime assertions below.
 */
const ALL_TRANSACTION_TYPES: Record<WalletTransactionType, true> = {
  passenger_payment: true,
  platform_fee: true,
  driver_pending_earning: true,
  driver_available_earning: true,
  refund: true,
  payout: true,
  adjustment: true,
};

const TRANSACTION_TYPES = Object.keys(ALL_TRANSACTION_TYPES) as WalletTransactionType[];
const LANGUAGES = ['az', 'ru', 'en'] as const;

describe('TRANSACTION_META registry', () => {
  it('has an entry for every WalletTransactionType', () => {
    for (const type of TRANSACTION_TYPES) {
      expect(TRANSACTION_META[type]).toBeDefined();
    }
  });

  it('every entry has an icon and all three language labels', () => {
    for (const type of TRANSACTION_TYPES) {
      const meta = TRANSACTION_META[type];
      expect(typeof meta.icon).toBe('string');
      expect(meta.icon.length).toBeGreaterThan(0);
      for (const lang of LANGUAGES) {
        expect(typeof meta.labels[lang]).toBe('string');
        expect(meta.labels[lang].length).toBeGreaterThan(0);
      }
    }
  });
});
