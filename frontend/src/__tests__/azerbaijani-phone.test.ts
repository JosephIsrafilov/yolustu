import {
  extractAzerbaijaniNationalDigits,
  formatAzerbaijaniPhone,
  isValidAzerbaijaniPhone,
  normalizeAzerbaijaniPhone,
} from '@/lib/azerbaijani-phone';

describe('azerbaijani phone utils', () => {
  it.each([
    ['+994501234567', '501234567'],
    ['994501234567', '501234567'],
    ['0501234567', '501234567'],
    ['501234567', '501234567'],
    ['+994 50 123 45 67', '501234567'],
    ['50 123 45 67', '501234567'],
  ])('extracts national digits from %s', (input, expected) => {
    expect(extractAzerbaijaniNationalDigits(input)).toBe(expected);
  });

  it('formats national digits with locked prefix', () => {
    expect(formatAzerbaijaniPhone('')).toBe('+994');
    expect(formatAzerbaijaniPhone('50')).toBe('+994 50');
    expect(formatAzerbaijaniPhone('50123')).toBe('+994 50 123');
    expect(formatAzerbaijaniPhone('501234567')).toBe('+994 50 123 45 67');
  });

  it.each([
    ['+994501234567', '+994501234567'],
    ['0501234567', '+994501234567'],
    ['50 123 45 67', '+994501234567'],
  ])('normalizes %s for backend', (input, expected) => {
    expect(normalizeAzerbaijaniPhone(input)).toBe(expected);
  });

  it('enforces exact 9-digit national numbers', () => {
    expect(isValidAzerbaijaniPhone('+994501234567')).toBe(true);
    expect(isValidAzerbaijaniPhone('+99450123')).toBe(false);
    expect(isValidAzerbaijaniPhone('+994')).toBe(false);
  });
});
