'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAppStore((s) => s.initAuth);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initAuth();
    }
  }, [initAuth]);

  return <>{children}</>;
}
