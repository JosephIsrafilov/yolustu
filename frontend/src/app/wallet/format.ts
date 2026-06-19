import type { WalletTransaction } from '@/types';

type Lang = 'az' | 'ru' | 'en';

const RELATIVE_COPY = {
  az: {
    now: 'indicə',
    minute: (n: number) => `${n} dəqiqə əvvəl`,
    hour: (n: number) => `${n} saat əvvəl`,
    day: (n: number) => `${n} gün əvvəl`,
  },
  ru: {
    now: 'только что',
    minute: (n: number) => `${n} мин назад`,
    hour: (n: number) => `${n} ч назад`,
    day: (n: number) => `${n} дн назад`,
  },
  en: {
    now: 'just now',
    minute: (n: number) => `${n} minute${n === 1 ? '' : 's'} ago`,
    hour: (n: number) => `${n} hour${n === 1 ? '' : 's'} ago`,
    day: (n: number) => `${n} day${n === 1 ? '' : 's'} ago`,
  },
} as const;

const LOCALE_BY_LANG: Record<Lang, string> = {
  az: 'az-AZ',
  ru: 'ru-RU',
  en: 'en-US',
};

export function formatRelativeTime(dateStr: string, language: Lang): string {
  const date = new Date(dateStr);
  const copy = RELATIVE_COPY[language];
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMs < 60_000) return copy.now;
  if (diffMinutes < 60) return copy.minute(diffMinutes);

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return copy.hour(diffHours);

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return copy.day(diffDays);

  return date.toLocaleDateString(LOCALE_BY_LANG[language], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Full, absolute timestamp for hover/title tooltips. */
export function formatAbsoluteTime(dateStr: string, language: Lang): string {
  return new Date(dateStr).toLocaleString(LOCALE_BY_LANG[language]);
}

export function formatDayLabel(dateStr: string, language: Lang): string {
  const date = new Date(dateStr);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return { az: 'Bu gün', ru: 'Сегодня', en: 'Today' }[language];
  }
  if (diffDays === 1) {
    return { az: 'Dünən', ru: 'Вчера', en: 'Yesterday' }[language];
  }

  return date.toLocaleDateString(LOCALE_BY_LANG[language], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export interface TransactionGroup {
  key: string;
  label: string;
  transactions: WalletTransaction[];
}

export function groupTransactionsByDay(
  transactions: WalletTransaction[],
  language: Lang,
): TransactionGroup[] {
  const groups: TransactionGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const transaction of transactions) {
    const date = new Date(transaction.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    let groupIndex = indexByKey.get(key);
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      indexByKey.set(key, groupIndex);
      groups.push({ key, label: formatDayLabel(transaction.createdAt, language), transactions: [] });
    }

    groups[groupIndex].transactions.push(transaction);
  }

  return groups;
}
