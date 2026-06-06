'use client';

import TireLoader from './TireLoader';
import { useAppStore } from '@/store/useAppStore';

interface LoadingStateProps {
  text?: string;
  count?: number;
}

export default function LoadingState({ text, count }: LoadingStateProps) {
  const language = useAppStore((state) => state.language);

  const defaultText = {
    az: 'Yüklənir...',
    ru: 'Загрузка...',
    en: 'Loading...',
  }[language] || 'Loading...';

  const displayText = text !== undefined ? text : defaultText;

  return (
    <div className="flex flex-col items-center justify-center p-12 w-full animate-fade-in bg-white dark:bg-card rounded-2xl border border-border">
      <TireLoader size="md" />
      {displayText && (
        <p className="text-sm font-semibold text-teal-600 dark:text-teal-400 mt-4 animate-pulse-glow text-center">
          {displayText}
        </p>
      )}
    </div>
  );
}
