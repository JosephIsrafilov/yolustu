'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { AZ_CITIES, formatPrice } from '@/lib/utils';
import { POPULAR_ROUTES } from '@/data/mock-data';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import {
  MapPin, Shield, Star, Clock, Car, Users,
  ArrowRight, Search, CheckCircle,
} from 'lucide-react';

const BENEFITS = [
  { icon: Shield, title: 'Təhlükəsiz gedişlər', desc: 'Yoxlanmış profillər, reytinqlər və rəylər ilə arxayın səyahət edin.' },
  { icon: Star, title: 'Rəy sistemi', desc: 'Hər gediş sonrası sürücü və sərnişinlər bir-birini qiymətləndirir.' },
  { icon: Clock, title: 'Sürətli axtarış', desc: 'Bir neçə kliklə istədiyiniz gedişi tapın və rezerv edin.' },
  { icon: MapPin, title: 'Yerli marşrutlar', desc: 'Bakı, Gəncə, Şəki, Quba, Lənkəran — bütün Azərbaycan.' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Gediş axtarın', desc: 'Haradan, haraya və nə vaxt getmək istədiyinizi seçin.' },
  { step: '2', title: 'Sürücünü seçin', desc: 'Rəyləri oxuyun, qiyməti müqayisə edin və uyğun gedişi tapın.' },
  { step: '3', title: 'Rezerv edin', desc: 'Sorğu göndərin, sürücü təsdiqləsin və yola çıxın!' },
];

export default function HomePage() {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-white/5" />
        <div className="absolute bottom-[-60px] left-[-40px] w-[250px] h-[250px] rounded-full bg-white/5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-white animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                Ucuz və rahat
                <br />
                <span className="text-brand-200">şəhərlərarası</span>
                <br />
                gedişlər
              </h1>
              <p className="mt-5 text-lg text-brand-100 max-w-lg leading-relaxed">
                Yolüstü ilə Azərbaycan üzrə yoxlanmış sürücülərlə təhlükəsiz, ucuz və rahat yol paylaşın.
              </p>

              {/* Stats */}
              <div className="flex items-center gap-8 mt-8">
                <div>
                  <p className="text-3xl font-bold text-white">9+</p>
                  <p className="text-sm text-brand-200">Şəhər</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-3xl font-bold text-white">50+</p>
                  <p className="text-sm text-brand-200">Sürücü</p>
                </div>
                <div className="w-px h-10 bg-white/20" />
                <div>
                  <p className="text-3xl font-bold text-white">4.7</p>
                  <p className="text-sm text-brand-200">★ Reytinq</p>
                </div>
              </div>
            </div>

            {/* Right: Search Card */}
            <div className="animate-slide-up">
              <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-text mb-5">Gediş axtarın</h2>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">Haradan</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-500" />
                      <select
                        value={dep}
                        onChange={(e) => setDep(e.target.value)}
                        className="w-full rounded-xl border border-border bg-white pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none"
                      >
                        <option value="">Bütün şəhərlər</option>
                        {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">Haraya</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-600" />
                      <select
                        value={arr}
                        onChange={(e) => setArr(e.target.value)}
                        className="w-full rounded-xl border border-border bg-white pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 appearance-none"
                      >
                        <option value="">Bütün şəhərlər</option>
                        {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-secondary">Tarix</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>

                  <Button fullWidth size="lg" onClick={handleSearch} className="mt-1">
                    <Search size={18} /> Gediş axtar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular Routes ────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text">Populyar marşrutlar</h2>
            <p className="mt-2 text-text-muted">Ən çox axtarılan şəhərlərarası gedişlər</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {POPULAR_ROUTES.map((r) => (
              <Card
                key={`${r.from}-${r.to}`}
                hoverable
                padding="md"
                onClick={() => {
                  const params = new URLSearchParams({ from: r.from, to: r.to });
                  router.push(`${ROUTES.trips}?${params.toString()}`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <MapPin size={14} className="text-brand-500" />
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-semibold text-text">{r.from}</span>
                      <ArrowRight size={14} className="text-text-muted" />
                      <span className="font-semibold text-text">{r.to}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand-600">~{formatPrice(r.avgPrice)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text">Necə işləyir?</h2>
            <p className="mt-2 text-text-muted">3 sadə addımla yolunuza çıxın</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center animate-fade-in">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-700 text-xl font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-text mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-text">Niyə Yolüstü?</h2>
            <p className="mt-2 text-text-muted">WhatsApp qruplarından daha rahat, taksidən daha ucuz</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <Card key={b.title} padding="lg" className="text-center hover:shadow-lg transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mx-auto mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-base font-bold text-text mb-2">{b.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{b.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────── */}
      {!isAuthenticated && (
        <section className="hero-gradient py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Hazırsınız? İndi qoşulun!
            </h2>
            <p className="text-brand-100 mb-8 max-w-lg mx-auto">
              Qeydiyyatdan keçin və ilk gedişinizi tapın. Ucuz, rahat və təhlükəsiz.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={ROUTES.register}>
                <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50 shadow-lg">
                  Qeydiyyatdan keç
                </Button>
              </Link>
              <Link href={ROUTES.login}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Daxil ol
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
