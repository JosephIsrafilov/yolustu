'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { paymentsService } from '@/services';
import { useQueryClient } from '@tanstack/react-query';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await paymentsService.getStripeTopUpStatus(sessionId);
        if (res.status === 'completed' || res.status === 'pending') {
          // Invalidate wallet queries so they refetch immediately
          queryClient.invalidateQueries({ queryKey: ['wallet'] });
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };

    checkStatus();
  }, [sessionId, queryClient]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <Icon name="loader-2" className="animate-spin text-[#054752]" size={32} />
        <p className="text-[#5d6e73]">Verifying payment...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mx-auto mt-20 max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
        <p className="mt-2 text-slate-600">We couldn&apos;t verify your payment. Please contact support if you think this is a mistake.</p>
        <button onClick={() => router.push('/wallet')} className="mt-6 rounded-lg bg-red-600 px-6 py-2 text-white font-semibold"> Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        <Icon name="check" size={32} />
      </div>
      <h2 className="text-2xl font-bold text-[#002f37]">Payment Successful!</h2>
      <p className="text-[#5d6e73]">Your wallet balance has been updated.</p>
      <Button onClick={() => router.push('/wallet')} className="mt-4">
        Return to Wallet
      </Button>
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <div className="container mx-auto max-w-lg p-4 pt-12">
      <Card>
        <Suspense fallback={<div className="py-12 text-center">Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </Card>
    </div>
  );
}
