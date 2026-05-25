'use client';

import React from 'react';
import Link from 'next/link';
import DriverLayout from '@/components/driver/DriverLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';

const VEHICLE_I18N = {
  az: {
    title: 'Vehicle settings',
    desc: 'Manage vehicle data from your profile page. Backend vehicle management can be connected here later.',
    action: 'Open profile',
  },
  ru: {
    title: 'Vehicle settings',
    desc: 'Manage vehicle data from your profile page. Backend vehicle management can be connected here later.',
    action: 'Open profile',
  },
  en: {
    title: 'Vehicle settings',
    desc: 'Manage vehicle data from your profile page. Backend vehicle management can be connected here later.',
    action: 'Open profile',
  },
} as const;

export default function DriverVehiclePage() {
  const { language } = useAppStore();
  const t = VEHICLE_I18N[language];

  return (
    <DriverLayout>
      <ProtectedRoute mode="driver">
        <Card>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Icon name="car" size={18} />
            </span>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-text">{t.title}</h2>
              <p className="text-sm text-text-secondary">{t.desc}</p>
              <Link href={ROUTES.profile}>
                <Button>{t.action}</Button>
              </Link>
            </div>
          </div>
        </Card>
      </ProtectedRoute>
    </DriverLayout>
  );
}

