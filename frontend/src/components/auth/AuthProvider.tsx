'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { setSessionExpiredHandler } from '@/services/api-client';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const initAuth = useAppStore((s) => s.initAuth);
  const authStatus = useAppStore((s) => s.authStatus);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      useAppStore.getState().clearSession();
    });

    if (authStatus === 'unknown') {
      void initAuth();
    }

    return () => {
      setSessionExpiredHandler(null);
    };
  }, [initAuth, authStatus]);

  return <>{children}</>;
}
