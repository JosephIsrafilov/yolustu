'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileShell from '@/components/layout/MobileShell';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES, formatPrice } from '@/lib/utils';
import { POPULAR_ROUTES } from '@/data/mock-data';
import { Search, ArrowRight, Shield, Calendar, MapPin } from 'lucide-react';

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

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  return (
    <MobileShell title="Gediş axtar">
      <div className="px-4 pt-2 pb-4 stagger-children">
        {/* Search Card */}
        <Card className="mb-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Haradan</label>
              <select value={dep} onChange={(e) => setDep(e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Bütün şəhərlər</option>
                {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Haraya</label>
              <select value={arr} onChange={(e) => setArr(e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Bütün şəhərlər</option>
                {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">Tarix</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <Button fullWidth onClick={handleSearch}><Search size={16} /> Axtar</Button>
          </div>
        </Card>

        {/* Safety */}
        <Card padding="sm" className="mb-4 bg-gradient-to-r from-brand-50 to-blue-50 border-brand-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Təhlükəsiz gedişlər</p>
              <p className="text-xs text-text-muted">Bütün sürücülər reytinqə malikdir</p>
            </div>
          </div>
        </Card>

        {/* Popular Routes */}
        <h3 className="text-sm font-semibold text-text mb-2">Populyar marşrutlar</h3>
        <div className="flex flex-col gap-2">
          {POPULAR_ROUTES.map((r) => (
            <Card key={`${r.from}-${r.to}`} hoverable padding="sm" onClick={() => {
              setDep(r.from); setArr(r.to); handleSearch();
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-brand-500" />
                  <span className="font-medium">{r.from}</span>
                  <ArrowRight size={14} className="text-text-muted" />
                  <span className="font-medium">{r.to}</span>
                </div>
                <span className="text-sm font-bold text-brand-600">~{formatPrice(r.avgPrice)}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </MobileShell>
  );
}
