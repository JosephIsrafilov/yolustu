'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { setSessionExpiredHandler } from '@/services/api-client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAppStore((s) => s.initAuth);
  const initialized = useRef(false);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      useAppStore.getState().clearSession();
    });

    if (!initialized.current) {
      initialized.current = true;
      void initAuth();
    }

    return () => {
      setSessionExpiredHandler(null);
    };
  }, [initAuth]);

  return <>{children}</>;
}
