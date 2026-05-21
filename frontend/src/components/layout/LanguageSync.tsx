'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function LanguageSync() {
  const language = useAppStore((state) => state.language);

  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
