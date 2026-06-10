export const AZERBAIJAN_PHONE_PREFIX = '+994';
export const AZERBAIJAN_COUNTRY_DIGITS = '994';
export const AZERBAIJAN_NATIONAL_LENGTH = 9;

function getDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function extractAzerbaijaniNationalDigits(value: string): string {
  let digits = getDigits(value);

  if (digits.startsWith(AZERBAIJAN_COUNTRY_DIGITS)) {
    digits = digits.slice(AZERBAIJAN_COUNTRY_DIGITS.length);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, AZERBAIJAN_NATIONAL_LENGTH);
}

export function normalizeAzerbaijaniPhone(value: string): string {
  return `${AZERBAIJAN_PHONE_PREFIX}${extractAzerbaijaniNationalDigits(value)}`;
}

export function formatAzerbaijaniPhone(value: string): string {
  const digits = extractAzerbaijaniNationalDigits(value);

  if (!digits) {
    return AZERBAIJAN_PHONE_PREFIX;
  }

  const groups = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);

  return `${AZERBAIJAN_PHONE_PREFIX} ${groups.join(' ')}`;
}

export function isValidAzerbaijaniPhone(value: string): boolean {
  return extractAzerbaijaniNationalDigits(value).length === AZERBAIJAN_NATIONAL_LENGTH;
}

export function getAzerbaijaniPhoneCursorBoundary(value: string): number {
  return value.length > AZERBAIJAN_PHONE_PREFIX.length
    ? AZERBAIJAN_PHONE_PREFIX.length + 1
    : AZERBAIJAN_PHONE_PREFIX.length;
}

export function getAzerbaijaniPhoneCursorFromDigits(
  formattedValue: string,
  nationalDigitCount: number,
): number {
  const boundary = getAzerbaijaniPhoneCursorBoundary(formattedValue);

  if (nationalDigitCount <= 0) {
    return boundary;
  }

  let seenDigits = 0;
  for (let index = boundary; index < formattedValue.length; index += 1) {
    if (/\d/.test(formattedValue[index])) {
      seenDigits += 1;
      if (seenDigits === nationalDigitCount) {
        return index + 1;
      }
    }
  }

  return formattedValue.length;
}
