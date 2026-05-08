'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { AZ_CITIES } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MapPin, ArrowRight, Calendar, Users, ShieldCheck, Banknote, Leaf, ChevronRight } from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Təsdiqlənmiş Sürücülər',
    desc: 'Bütün sürücülər platformamıza qatılmazdan əvvəl şəxsiyyət və sənəd yoxlanışından keçir.',
  },
  {
    icon: Banknote,
    title: 'Sərfəli Qiymətlər',
    desc: 'Səyahət xərclərini bölüşərək daha ucuz və rahat yolçuluq edin.',
  },
  {
    icon: Leaf,
    title: 'Ekoloji Təmiz',
    desc: 'Boş oturacaqları dolduraraq karbon emissiyasını azaltmağa kömək edin.',
  },
];

const TOP_ROUTES = [
  { from: 'Bakı', to: 'Gəncə', price: 15, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBM7LZRJ3_vRLkf7aJbFim3PHgizHDH09QLx4oCmBjhhwIQ8xTOj58nI8lajjzLiw9IqjNRGlFwSI6Gvneo-QnPjVl2YDOQyPf09GGzSB5D1ZE8qmnQ6WoaghhG1N98NXui0dIJXu10WL_jNmrcUc8GWy5AX5-yJRiPELbgbjJHAFXy2KOC_Kk2c0bDHyQ6AisZ6t_PozZeeMwleB8rbyHw1Xji8C6-hkEy_U0ymO9CyJQlDnG-pK-f4t1nBg2vR9G9X_bPhpXJWGQ' },
  { from: 'Bakı', to: 'Lənkəran', price: 12, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClf0mYYkt7HvE7_cJ02Z0LyWTh7ESAdnDblfA-nCjztrnsuO8xUSUD2Jw_YguKr0TR6EQsbb_GnB_4QJlNePCBG1a-Sy-32OG6IfoxZjPsbSezF95txQ5ad4Ry6YzCvArh7aL4S4yzjG799DQwdE-bY_3AyqxFXCuVkevqu774lKFWf10ObmJQZEcLdGjP483V7aNatvaRHyjB2Uo8Uyf1wwr9etE9ZNSmHHEl0jnEkhExN2_ABtwYjn2g0v1wZeUUhADfNQjLOCs' },
  { from: 'Bakı', to: 'Şəki', price: 18, img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAX75FRsx_fVi6GYaSgcBWt30jv6bIMuyg-rHiCH4eDG-dEQYnyd4LMJb4CXrgoI22qXCtvJMXSt-QZUDafCl3eilFffKGq3HzfbLEKccEoEC3kfMwpfr7v2hXCoIyeoK8PNHEBMnS5r4RvvZ0kGVfrI48J2YtPYf3rBVsm6zcRQa03vB84NiEYkNcjvs5zv14u0n1M6K0bqIPnBZOaL4sCDuwlcFrzYSt28jmHvJCw1WWUEhl2nTG4ZW5YHw_8_DNUaFdlYSU5pvc' },
];

export default function HomePage() {
  const router = useRouter();
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
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* ═══ Hero ═══ */}
        <section className="relative py-20 px-6 overflow-hidden" style={{ background: 'linear-gradient(180deg, #d0edf3 0%, #edfcff 100%)' }}>
          <div className="absolute inset-0 z-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHxIqknSmcrI7UDCNZrC1YKEZntQFALItCeTKNKoxFiKIRDXxI9SaLGM7W-vdr06sWCD3j2IFn8FOu9SIWVAwpi2afedPvKnjjsrJyHIhVtSkurTmYIcJfBjwGqN-dfxYEajoJlo_Dt8YRV9V_wfSTeI4STnu3kmjYPoUQqd7kJyVcsDe2R0IqaMBLgjVV3_YZ_hKrUvrhf63nIZ5SK3IMHOey_eBov8Nk1NGpRN8oCDSQS1NlcHDvNIEl5IFN_LPT49G6Jbujr4M"
              alt="" className="w-full h-full object-cover opacity-15" />
          </div>

          <div className="relative z-10 max-w-[1140px] mx-auto flex flex-col items-center text-center">
            <h1 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-[#002f37] mb-4">
              Sərfəli və Təhlükəsiz Səyahət
            </h1>
            <p className="text-[20px] font-medium leading-[28px] text-[#40484a] mb-12 max-w-2xl">
              Azərbaycanın hər yerinə etibarlı sürücülərlə yolçuluq edin.
            </p>

            {/* Search bar — inline on desktop */}
            <div className="bg-white rounded-2xl p-4 w-full max-w-4xl flex flex-col md:flex-row gap-2 items-stretch"
                 style={{ boxShadow: '0 8px 32px rgba(5,71,82,0.12)' }}>
              {/* From */}
              <div className="flex-1 relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <select value={dep} onChange={(e) => setDep(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all appearance-none">
                  <option value="">Haradan</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center px-1">
                <ArrowRight size={20} className="text-[#c0c8ca]" />
              </div>

              {/* To */}
              <div className="flex-1 relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <select value={arr} onChange={(e) => setArr(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all appearance-none">
                  <option value="">Haraya</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Date */}
              <div className="flex-1 relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" />
              </div>

              {/* Passengers */}
              <div className="w-full md:w-24 relative">
                <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <input type="number" min={1} max={4} value={passengers} onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" />
              </div>

              {/* Search button */}
              <button onClick={handleSearch}
                className="w-full md:w-auto bg-[#7ED321] text-white font-semibold text-[16px] px-8 py-3.5 rounded-xl hover:bg-[#6bc01a] active:scale-[0.98] transition-all whitespace-nowrap"
                style={{ boxShadow: '0 2px 8px rgba(126,211,33,0.3)' }}>
                Axtar
              </button>
            </div>
          </div>
        </section>

        {/* ═══ Features ═══ */}
        <section className="py-16 px-6 max-w-[1140px] mx-auto">
          <h2 className="text-[24px] font-semibold leading-[32px] text-[#002f37] mb-10 text-center">
            Niyə YolUstu?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title}
                  className="bg-white p-7 rounded-2xl border border-[#c2dfe5] hover:border-[#9acfdc] transition-all cursor-default group"
                  style={{ boxShadow: '0 4px 12px rgba(5,71,82,0.05)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(5,71,82,0.10)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,71,82,0.05)')}>
                  <div className="w-12 h-12 bg-[#d5f3f9] flex items-center justify-center rounded-full mb-5">
                    <Icon size={22} className="text-[#054752]" />
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#002f37] mb-2 leading-6">{f.title}</h3>
                  <p className="text-[14px] text-[#40484a] leading-5">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ Popular Routes ═══ */}
        <section className="py-16 px-6" style={{ backgroundColor: '#d5f3f9' }}>
          <div className="max-w-[1140px] mx-auto">
            <div className="flex justify-between items-end mb-10">
              <h2 className="text-[24px] font-semibold leading-[32px] text-[#002f37]">
                Populyar İstiqamətlər
              </h2>
              <Link href={ROUTES.trips}
                className="text-[14px] text-[#054752] hover:underline hidden md:flex items-center gap-1 font-medium">
                Bütün istiqamətlərə bax <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children">
              {TOP_ROUTES.map((r) => (
                <div key={`${r.from}-${r.to}`}
                  onClick={() => router.push(`${ROUTES.trips}?from=${r.from}&to=${r.to}`)}
                  className="bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all"
                  style={{ boxShadow: '0 4px 12px rgba(5,71,82,0.05)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(5,71,82,0.10)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(5,71,82,0.05)')}>
                  <div className="h-44 relative overflow-hidden">
                    <img src={r.img} alt={`${r.from} → ${r.to}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <h3 className="absolute bottom-4 left-5 text-white text-[18px] font-semibold">
                      {r.from} → {r.to}
                    </h3>
                  </div>
                  <div className="px-5 py-4 flex justify-between items-center">
                    <span className="text-[14px] text-[#40484a]">Başlayan qiymət:</span>
                    <span className="text-[20px] font-bold text-[#002f37]">{r.price} ₼</span>
                  </div>
                </div>
              ))}
            </div>

            <Link href={ROUTES.trips}
              className="block mt-6 text-center text-[14px] text-[#054752] hover:underline md:hidden font-medium">
              Bütün istiqamətlərə bax
            </Link>
          </div>
        </section>

        {/* ═══ Driver CTA ═══ */}
        <section className="py-16 px-6">
          <div className="max-w-[1140px] mx-auto bg-[#054752] rounded-3xl overflow-hidden relative"
               style={{ boxShadow: '0 16px 48px rgba(5,71,82,0.25)' }}>
            <div className="absolute inset-0 z-0">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuARLFSOEGJ3Mx03z965Iwz2nfLLy-1Eskiz98UKv8XjA8HYdcUwKb2kKz7PXzsZ29Dwh-S9euW2_QwIRzTuSN3NIIiacxV61HK0-i5z0PGJ6DV4MwK9D3uapcQLKQf6xy2neRxWKbFQ7cOlEhkD4MTODs42wzJZao3mfqxE5HEfQ2skqdW9KrrdZFdZI_RZiZ8BXqCn_BovmcTfth30lzyrxnfCggVJJs8FlAyU21H9ACrfiBho6uMPMm-n0pIkqRh6FR0d4AHnysg"
                alt="" className="w-full h-full object-cover opacity-25 mix-blend-overlay" />
            </div>
            <div className="relative z-10 p-12 md:p-16 flex flex-col items-center md:items-start text-center md:text-left text-white w-full md:w-2/3">
              <h2 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] mb-3">
                Maşınınız var?
              </h2>
              <p className="text-[20px] font-medium leading-[28px] opacity-90 mb-8">
                Yolda qazanın. Boş yerləri paylaşın və səyahət xərclərinizi qarşılayın.
              </p>
              <Link href={ROUTES.createTrip}
                className="inline-flex bg-[#7ED321] text-white font-semibold text-[16px] px-8 py-4 rounded-full hover:bg-[#6bc01a] active:scale-[0.98] transition-all"
                style={{ boxShadow: '0 4px 16px rgba(126,211,33,0.4)' }}>
                Səfər təklif et
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
