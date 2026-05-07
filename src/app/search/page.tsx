'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WebLayout from '@/components/layout/WebLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES, formatPrice } from '@/lib/utils';
import { POPULAR_ROUTES } from '@/data/mock-data';
import { Search, ArrowRight, Shield, MapPin } from 'lucide-react';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppStore();
  const [dep, setDep] = useState('');
  const [arr, setArr] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (dep) params.set('from', dep);
    if (arr) params.set('to', arr);
    if (date) params.set('date', date);
    router.push(`${ROUTES.trips}?${params.toString()}`);
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
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <h2 className="text-lg font-bold text-text mb-4">Axtarış</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Haradan</label>
                <select value={dep} onChange={(e) => setDep(e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Bütün şəhərlər</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Haraya</label>
                <select value={arr} onChange={(e) => setArr(e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">Bütün şəhərlər</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-secondary">Tarix</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <Button fullWidth onClick={handleSearch}><Search size={16} /> Axtar</Button>
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2 stagger-children">
          <Card padding="md" className="mb-6 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-base font-semibold text-text">Təhlükəsiz gedişlər</p>
                <p className="text-sm text-text-muted">Bütün sürücülər reytinqə malikdir. Profillər yoxlanılır.</p>
              </div>
            </div>
          </Card>
          <h3 className="text-lg font-bold text-text mb-3">Populyar marşrutlar</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {POPULAR_ROUTES.map((r) => (
              <Card key={`${r.from}-${r.to}`} hoverable padding="md" onClick={() => {
                setDep(r.from); setArr(r.to); handleSearch();
              }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brand-500" />
                    <span className="font-medium text-sm">{r.from}</span>
                    <ArrowRight size={14} className="text-text-muted" />
                    <span className="font-medium text-sm">{r.to}</span>
                  </div>
                  <span className="text-sm font-bold text-brand-600">~{formatPrice(r.avgPrice)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </WebLayout>
  );
}
