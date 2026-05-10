'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES, formatPrice } from '@/lib/utils';
import { POPULAR_ROUTES } from '@/data/mock-data';
import Icon from '@/components/ui/Icon';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppStore();
  const [dep, setDep] = useState('');
  const [arr, setArr] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (dep) params.set('from', dep);
    if (arr) params.set('to', arr);
    if (date) params.set('date', date);
    if (passengers > 1) params.set('passengers', String(passengers));
    router.push(`${ROUTES.trips}?${params.toString()}`);
  };

  const openPopularRoute = (from: string, to: string) => {
    router.push(`${ROUTES.trips}?${new URLSearchParams({ from, to }).toString()}`);
  };

  const swapRoute = () => {
    setDep(arr);
    setArr(dep);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <WebLayout title="Gediş axtar">
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-text">Marşrut</h2>
              <p className="text-xs text-text-muted">Haradan, haraya və tarixi seçin</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Haradan</label>
                <select
                  value={dep}
                  onChange={(e) => setDep(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Bütün şəhərlər</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-end sm:items-center lg:justify-center">
                <button
                  type="button"
                  onClick={swapRoute}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-brand-600 transition-all hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label="Marşrutu dəyiş"
                  title="Marşrutu dəyiş"
                >
                  <Icon name="arrow-right" size={16} />
                  <Icon name="arrow-left" size={16} className="-ml-1" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Haraya</label>
                <select
                  value={arr}
                  onChange={(e) => setArr(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Bütün şəhərlər</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <DatePicker value={date} onChange={setDate} label="Tarix" placeholder="Tarix seçin" />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Sərnişin</label>
                <div className="flex items-center justify-between rounded-xl border border-border bg-white px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => setPassengers((value) => Math.max(1, value - 1))}
                    className="h-8 w-8 rounded-lg bg-surface-muted text-sm font-bold text-text transition-colors hover:bg-surface-dim"
                    aria-label="Sərnişin sayını azalt"
                  >
                    −
                  </button>
                  <span className="min-w-10 text-center text-sm font-bold text-text">{passengers}</span>
                  <button
                    type="button"
                    onClick={() => setPassengers((value) => Math.min(4, value + 1))}
                    className="h-8 w-8 rounded-lg bg-surface-muted text-sm font-bold text-text transition-colors hover:bg-surface-dim"
                    aria-label="Sərnişin sayını artır"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="sm:flex sm:items-end lg:block">
                <Button fullWidth onClick={handleSearch}><Icon name="search" size={16} /> Axtar</Button>
              </div>
            </div>
          </Card>
        </div>
        <div className="stagger-children lg:col-span-2">
          <Card padding="md" className="mb-6 border-brand-100 bg-gradient-to-r from-brand-50 to-blue-50">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Icon name="shield" size={24} />
              </div>
              <div>
                <p className="text-base font-semibold text-text">Təhlükəsiz gedişlər</p>
                <p className="text-sm text-text-muted">Bütün sürücülər reytinqə malikdir. Profillər yoxlanılır.</p>
              </div>
            </div>
          </Card>
          <h3 className="mb-3 text-lg font-bold text-text">Populyar marşrutlar</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {POPULAR_ROUTES.map((r) => (
              <Card key={`${r.from}-${r.to}`} hoverable padding="md" onClick={() => openPopularRoute(r.from, r.to)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon name="map-pin" size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text">{r.from} → {r.to}</p>
                      <p className="text-xs text-text-muted">Uyğun gedişləri göstər</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-brand-600">~{formatPrice(r.avgPrice)}</p>
                    <Icon name="arrow-right" size={14} className="ml-auto text-text-muted" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
