'use client';

import type { ReactNode } from 'react';
import TireLoader from '@/components/ui/TireLoader';
import { useAppStore } from '@/store/useAppStore';

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  const authStatus = useAppStore((state) => state.authStatus);
  const currentUser = useAppStore((state) => state.currentUser);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  if (authStatus === 'unknown' || authStatus === 'loading') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <TireLoader />
      </div>
    );
  }

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return null;
  }

  return children;
}
