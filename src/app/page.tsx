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

const FEATURES = [
  {
    icon: 'verified_user',
    title: 'Təsdiqlənmiş Sürücülər',
    desc: 'Bütün sürücülər platformamıza qatılmazdan əvvəl şəxsiyyət və sənəd yoxlanışından keçir.',
  },
  {
    icon: 'payments',
    title: 'Sərfəli Qiymətlər',
    desc: 'Səyahət xərclərini bölüşərək daha ucuz və rahat yolçuluq edin.',
  },
  {
    icon: 'eco',
    title: 'Ekoloji Təmiz',
    desc: 'Boş oturacaqları dolduraraq karbon emissiyasını azaltmağa kömək edin.',
  },
];

const ROUTE_IMAGES: Record<string, string> = {
  'Bakı-Gəncə': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM7LZRJ3_vRLkf7aJbFim3PHgizHDH09QLx4oCmBjhhwIQ8xTOj58nI8lajjzLiw9IqjNRGlFwSI6Gvneo-QnPjVl2YDOQyPf09GGzSB5D1ZE8qmnQ6WoaghhG1N98NXui0dIJXu10WL_jNmrcUc8GWy5AX5-yJRiPELbgbjJHAFXy2KOC_Kk2c0bDHyQ6AisZ6t_PozZeeMwleB8rbyHw1Xji8C6-hkEy_U0ymO9CyJQlDnG-pK-f4t1nBg2vR9G9X_bPhpXJWGQ',
  'Bakı-Lənkəran': 'https://lh3.googleusercontent.com/aida-public/AB6AXuClf0mYYkt7HvE7_cJ02Z0LyWTh7ESAdnDblfA-nCjztrnsuO8xUSUD2Jw_YguKr0TR6EQsbb_GnB_4QJlNePCBG1a-Sy-32OG6IfoxZjPsbSezF95txQ5ad4Ry6YzCvArh7aL4S4yzjG799DQwdE-bY_3AyqxFXCuVkevqu774lKFWf10ObmJQZEcLdGjP483V7aNatvaRHyjB2Uo8Uyf1wwr9etE9ZNSmHHEl0jnEkhExN2_ABtwYjn2g0v1wZeUUhADfNQjLOCs',
  'Bakı-Şəki': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX75FRsx_fVi6GYaSgcBWt30jv6bIMuyg-rHiCH4eDG-dEQYnyd4LMJb4CXrgoI22qXCtvJMXSt-QZUDafCl3eilFffKGq3HzfbLEKccEoEC3kfMwpfr7v2hXCoIyeoK8PNHEBMnS5r4RvvZ0kGVfrI48J2YtPYf3rBVsm6zcRQa03vB84NiEYkNcjvs5zv14u0n1M6K0bqIPnBZOaL4sCDuwlcFrzYSt28jmHvJCw1WWUEhl2nTG4ZW5YHw_8_DNUaFdlYSU5pvc',
};

const TOP_ROUTES = [
  { from: 'Bakı', to: 'Gəncə', price: 15 },
  { from: 'Bakı', to: 'Lənkəran', price: 12 },
  { from: 'Bakı', to: 'Şəki', price: 18 },
];

export default function HomePage() {
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
    router.push(`${ROUTES.trips}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <Header />

      <main className="flex-grow">
        {/* ── Hero Section ──────────────────────────────── */}
        <section className="relative bg-surface-container-high py-20 px-4">
          {/* Background image */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHxIqknSmcrI7UDCNZrC1YKEZntQFALItCeTKNKoxFiKIRDXxI9SaLGM7W-vdr06sWCD3j2IFn8FOu9SIWVAwpi2afedPvKnjjsrJyHIhVtSkurTmYIcJfBjwGqN-dfxYEajoJlo_Dt8YRV9V_wfSTeI4STnu3kmjYPoUQqd7kJyVcsDe2R0IqaMBLgjVV3_YZ_hKrUvrhf63nIZ5SK3IMHOey_eBov8Nk1NGpRN8oCDSQS1NlcHDvNIEl5IFN_LPT49G6Jbujr4M"
              alt="Azerbaijan highway"
              className="w-full h-full object-cover opacity-20"
            />
          </div>

          <div className="relative z-10 max-w-[1140px] mx-auto flex flex-col items-center text-center">
            <h1 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-primary mb-4">
              Sərfəli və Təhlükəsiz Səyahət
            </h1>
            <p className="text-2xl font-semibold leading-8 text-on-surface-variant mb-12">
              Azərbaycanın hər yerinə etibarlı sürücülərlə yolçuluq edin.
            </p>

            {/* Search bar */}
            <div className="bg-surface-container-lowest rounded-xl shadow-md p-4 w-full max-w-4xl flex flex-col md:flex-row gap-1 items-center">
              <div className="flex-1 w-full relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">location_on</span>
                <select
                  value={dep}
                  onChange={(e) => setDep(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container text-base bg-surface-container-lowest appearance-none"
                >
                  <option value="">Haradan</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="hidden md:flex items-center justify-center p-2 text-outline-variant">
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>

              <div className="flex-1 w-full relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">location_on</span>
                <select
                  value={arr}
                  onChange={(e) => setArr(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container text-base bg-surface-container-lowest appearance-none"
                >
                  <option value="">Haraya</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex-1 w-full relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">calendar_today</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container text-base bg-surface-container-lowest"
                />
              </div>

              <div className="w-full md:w-28 relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">person</span>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container text-base bg-surface-container-lowest"
                />
              </div>

              <button
                onClick={handleSearch}
                className="w-full md:w-auto bg-action text-on-primary font-semibold text-lg px-8 py-3 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap shadow-sm"
              >
                Axtar
              </button>
            </div>
          </div>
        </section>

        {/* ── Features Section ─────────────────────────── */}
        <section className="py-10 px-4 max-w-[1140px] mx-auto">
          <h2 className="text-2xl font-semibold leading-8 text-primary mb-10 text-center">
            Niyə YolUstu?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-surface-container-lowest p-6 rounded-xl shadow-card border border-surface-dim hover:shadow-card-hover transition-shadow"
              >
                <div className="w-12 h-12 bg-surface-container flex items-center justify-center rounded-full mb-4">
                  <span className="material-symbols-outlined text-primary-container text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-5">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Popular Routes ───────────────────────────── */}
        <section className="bg-surface-container py-10 px-4">
          <div className="max-w-[1140px] mx-auto">
            <div className="flex justify-between items-end mb-10">
              <h2 className="text-2xl font-semibold leading-8 text-primary">
                Populyar İstiqamətlər
              </h2>
              <Link
                href={ROUTES.trips}
                className="text-sm text-primary-container hover:underline hidden md:block"
              >
                Bütün istiqamətlərə bax
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TOP_ROUTES.map((r) => (
                <div
                  key={`${r.from}-${r.to}`}
                  onClick={() => {
                    const params = new URLSearchParams({ from: r.from, to: r.to });
                    router.push(`${ROUTES.trips}?${params.toString()}`);
                  }}
                  className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-card group cursor-pointer"
                >
                  <div className="h-40 relative">
                    <img
                      src={ROUTE_IMAGES[`${r.from}-${r.to}`]}
                      alt={`${r.from} → ${r.to}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <h3 className="absolute bottom-4 left-4 text-on-primary text-lg font-semibold">
                      {r.from} → {r.to}
                    </h3>
                  </div>
                  <div className="p-4 flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Başlayan qiymət:</span>
                    <span className="text-xl font-bold text-primary">{r.price} ₼</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href={ROUTES.trips}
              className="block mt-6 text-center text-sm text-primary-container hover:underline md:hidden"
            >
              Bütün istiqamətlərə bax
            </Link>
          </div>
        </section>

        {/* ── Driver CTA ───────────────────────────────── */}
        <section className="py-10 px-4">
          <div className="max-w-[1140px] mx-auto bg-primary-container rounded-2xl overflow-hidden relative shadow-lg">
            <div className="absolute inset-0 z-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARLFSOEGJ3Mx03z965Iwz2nfLLy-1Eskiz98UKv8XjA8HYdcUwKb2kKz7PXzsZ29Dwh-S9euW2_QwIRzTuSN3NIIiacxV61HK0-i5z0PGJ6DV4MwK9D3uapcQLKQf6xy2neRxWKbFQ7cOlEhkD4MTODs42wzJZao3mfqxE5HEfQ2skqdW9KrrdZFdZI_RZiZ8BXqCn_BovmcTfth30lzyrxnfCggVJJs8FlAyU21H9ACrfiBho6uMPMm-n0pIkqRh6FR0d4AHnysg"
                alt="Driver on the road"
                className="w-full h-full object-cover opacity-30 mix-blend-overlay"
              />
            </div>
            <div className="relative z-10 p-12 md:p-16 flex flex-col items-center md:items-start text-center md:text-left text-on-primary w-full md:w-2/3">
              <h2 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] mb-2">
                Maşınınız var?
              </h2>
              <p className="text-2xl font-semibold opacity-90 mb-6">
                Yolda qazanın. Boş yerləri paylaşın və səyahət xərclərinizi qarşılayın.
              </p>
              <Link href={ROUTES.createTrip}>
                <button className="bg-action text-on-primary font-semibold text-lg px-8 py-3 rounded-full hover:opacity-90 transition-opacity shadow-md">
                  Səfər təklif et
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
