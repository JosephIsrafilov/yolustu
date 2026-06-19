'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

export default function StripeCancelPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-lg p-4 pt-12">
      <Card>
        <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
          <Icon name="x" className="text-red-500" size={48} />
          <h2 className="text-xl font-bold text-[#002f37]">Payment Cancelled</h2>
          <p className="text-[#5d6e73]">Your payment was cancelled. No charges were made.</p>
          <Button onClick={() => router.push('/wallet')} className="mt-4">
            Return to Wallet
          </Button>
        </div>
      </Card>
    </div>
  );
}
