import { detectCardNetwork, isValidLuhn } from '@/app/wallet/TopUpModal';

describe('wallet card helpers', () => {
  it('detects common card networks from the card number prefix', () => {
    expect(detectCardNetwork('4242 4242 4242 4242')).toBe('visa');
    expect(detectCardNetwork('5555 5555 5555 4444')).toBe('mastercard');
    expect(detectCardNetwork('3782 822463 10005')).toBe('amex');
    expect(detectCardNetwork('6011 1111 1111 1117')).toBe('discover');
  });

  it('validates card numbers with the Luhn checksum', () => {
    expect(isValidLuhn('4242 4242 4242 4242')).toBe(true);
    expect(isValidLuhn('4242 4242 4242 4241')).toBe(false);
  });
});
