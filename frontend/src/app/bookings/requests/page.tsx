'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingState from '@/components/ui/LoadingState';
import WebLayout from '@/components/layout/WebLayout';
import { ROUTES } from '@/lib/routes';

export default function LegacyBookingRequestsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.driverRequests);
  }, [router]);

  return (
    <WebLayout>
      <LoadingState />
    </WebLayout>
  );
}

