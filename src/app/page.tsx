'use client';

import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import Button from '@/components/ui/Button';
import { MapPin, Shield, Star, Clock, Car } from 'lucide-react';

const BENEFITS = [
  { icon: MapPin, title: 'Yerli marşrutlar', desc: 'Azərbaycanın bütün əsas şəhərləri' },
  { icon: Shield, title: 'Təhlükəsiz gediş', desc: 'Profil yoxlanışı və reytinqlər' },
  { icon: Star, title: 'Rəylər və reytinq', desc: 'Sürücü və sərnişin dəyərləndirmələri' },
  { icon: Clock, title: 'Sürətli rezerv', desc: 'Bir neçə toxunuşla yer ayırın' },
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-md bg-white">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
          <Car size={36} className="text-white" />
        </div>

        <h1 className="text-3xl font-extrabold text-text tracking-tight">
          Yol<span className="text-brand-600">üstü</span>
        </h1>

        <p className="text-lg font-medium text-text-secondary mt-3 max-w-xs leading-relaxed">
          Azərbaycan üzrə təhlükəsiz gedişlər tapın
        </p>
        <p className="text-sm text-text-muted mt-2 max-w-xs">
          Ucuz səyahət edin. Yolu paylaşın. Yoxlanmış insanlarla gedin.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 w-full mt-8">
          <Link href={ROUTES.register}>
            <Button fullWidth size="lg">Qeydiyyat</Button>
          </Link>
          <Link href={ROUTES.login}>
            <Button fullWidth size="lg" variant="outline">Daxil ol</Button>
          </Link>
        </div>
      </div>

      {/* Benefits */}
      <div className="px-6 pb-10">
        <div className="grid grid-cols-2 gap-3">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="flex flex-col items-center gap-2 bg-surface-dim rounded-2xl p-4 text-center animate-fade-in">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                  <Icon size={20} />
                </div>
                <p className="text-sm font-semibold text-text">{b.title}</p>
                <p className="text-[11px] text-text-muted leading-snug">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
