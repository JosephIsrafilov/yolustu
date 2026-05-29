'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { formatPrice, AZ_CITIES } from '@/lib/utils';
import { I18N } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon, { type IconName } from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getUserCapabilities } from '@/lib/access-control';

const TOP_ROUTES: Array<{
  from: string;
  to: string;
  price: number;
  tripsKey: 'ganca' | 'quba' | 'lankaran';
  img: string;
}> = [
  {
    from: 'Bakı',
    to: 'Gəncə',
    price: 15,
    tripsKey: 'ganca',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5IQh9eoAlVCIbIcZm73CAErqvtVfQe0w5TQOlQY3KdCCK6p-5otR2flM3qhI0by15J2iBnjKJw3LONslc6QriE6eHjeC4Iuc7rtOqYBj792b04vkbLj16FUIv1kA2Onpnje30uGaIf0Ac2n5bGEyeANX0Jxqy3IKbjL0RZ-AOPVtqufzOv7V1LgW-xw-U1B9VSqgzukwxk0XZ15BJy3wuypKrHqv1ZRbp7RyhXkmxFGokMsAmpPiuhwnYzLSYjm8lr-YnfcV3tdo',
  },
  {
    from: 'Bakı',
    to: 'Quba',
    price: 10,
    tripsKey: 'quba',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfj91f3rPN3Yftx2nh9gkj_0fYD1wtf9PXcuPEBedXBuga-9CNvDdZODGuV1-84CBvQfLFbOnsyoHMDn8qdYwsLowUZDr7qpKgXiSrFAODLkOrpz1ShTHuArGiA-rT9POdgZWD2pvPlSXKCIe8KIzqcW-tRSibhray7Rirw2XDYrMbwv5dud79XF3kGTV-uHbe-IaDbahMkpFrsHFXjtfYtLxew524Pp39couepc14Lyxy9kfrSSzMtdPxOWNW1vXkhTdq5Xb94WM',
  },
  {
    from: 'Bakı',
    to: 'Lənkəran',
    price: 12,
    tripsKey: 'lankaran',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrRWiYBMTNGjfSDfkpQk9w9qYxCbJyvT-2eUDU4RiMVRWM4Zb50_XBVBKfWrHbjUJiCRRoahvwUJe21fU26evN1WkgTmeTaaWZ7RIRR02GwDE9XQXENqsfnKHhl5JyIesSQxOW8xSt6W66Tm9l2gINRh4F0k7gczDGc5nDL84Vg_LVcuYu7bTB5LA28BOuXBSGAYHoVXTvwonxQcVdkF49FfUg7DV_0UdzpK_Hqzpsjmx7t9YJzYLtwhf6zuGwpjHQqQVgRJC9Hlk',
  },
];

function HeroSelect({ label, value, onChange, options, icon }: { label: string, value: string, onChange: (val: string) => void, options: readonly string[], icon: IconName }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className={`flex h-full w-full min-w-0 items-center gap-3 rounded-xl bg-white/5 px-4 py-2 text-left border border-transparent transition-all duration-300 hover:bg-white/10 focus:outline-none ${
          isOpen ? 'ring-2 ring-teal-500/40 border-teal-500/20 bg-white/10 shadow-[0_0_15px_rgba(20,184,166,0.15)]' : ''
        }`}
      >
        <Icon name={icon} className="h-5 w-5 shrink-0 text-teal-400" />
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-xs text-teal-200/50">{label}</p>
          <p className="truncate text-sm font-medium text-white">{value}</p>
        </div>
        <Icon name="chevron-down" className={`h-4 w-4 shrink-0 text-teal-200/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <div 
        className={`absolute left-0 top-[calc(100%+8px)] z-50 max-h-60 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0B1B2B]/95 py-1.5 shadow-2xl backdrop-blur-xl custom-scrollbar transition-all duration-300 ease-out origin-top ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 visible' 
            : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
        }`}
      >
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              onChange(option);
              setIsOpen(false);
            }}
            className={`w-full px-4 py-2.5 text-left text-sm transition-all duration-200 hover:bg-white/5 hover:pl-5 cursor-pointer ${
              value === option ? 'font-semibold text-teal-400 bg-white/5' : 'text-teal-50/80'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { language, currentUser, isAuthenticated, activeMode } = useAppStore();
  const copy = I18N[language];
  const capabilities = getUserCapabilities(currentUser, isAuthenticated, activeMode);
  const offerRoute = capabilities.canOfferRide ? ROUTES.createTrip : ROUTES.driverApply;
  const passengers = 1;

  const [from, setFrom] = React.useState('Bakı');
  const [to, setTo] = React.useState('Gəncə');

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.set('from', from);
    params.set('to', to);
    params.set('passengers', String(passengers));
    router.push(`${ROUTES.trips}?${params.toString()}`);
  };

  const formatRoutePrice = (price: number) => {
    const formatted = formatPrice(price);
    if (language === 'az') return `${formatted}-dən`;
    if (language === 'ru') return `от ${formatted}`;
    return `from ${formatted}`;
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />

      <main className="grow flex flex-col">
        {/* Hero */}
        <section className="relative w-full overflow-hidden bg-navy text-white py-24 sm:py-32 lg:py-[140px] animate-fade-in">
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.35_0.065_248)_0%,transparent_50%)] opacity-40 animate-pulse-slow-1 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,oklch(0.55_0.085_215)_0%,transparent_50%)] opacity-30 animate-pulse-slow-2 pointer-events-none" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-teal-300 backdrop-blur-sm hover:scale-105 active:scale-95 transition-transform duration-300 cursor-default shadow-md select-none border border-white/5">
                <Icon name="zap" className="h-4 w-4" />
                {copy.home.zapBadge}
              </div>
              <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-tight leading-[1.05] sm:text-5xl sm:leading-none lg:text-[56px] lg:leading-[0.92]">
                {language === 'az' ? 'Azərbaycan daxilində' : language === 'ru' ? 'Делитесь поездками' : 'Share the road across'}{' '}
                <span className="block text-teal-400 mt-2">
                  {language === 'az' ? 'yolu paylaşın' : language === 'ru' ? 'по Азербайджану' : 'Azerbaijan'}
                </span>
              </h1>
              <p className="mt-5 text-lg text-teal-100/70 sm:text-xl max-w-2xl mx-auto">
                {copy.home.heroSubtitle}
              </p>
              
              <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href={`${ROUTES.trips}?from=${from}&to=${to}&passengers=${passengers}`}>
                  <Button size="lg" className="h-12 px-8 text-sm bg-teal-500 hover:bg-teal-400 text-navy font-bold rounded-xl shadow-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_0_25px_rgba(20,184,166,0.35)] cursor-pointer">
                    <Icon name="search" className="mr-2 h-5 w-5" />
                    {language === 'en' ? 'Find a Ride' : copy.common.search}
                  </Button>
                </Link>
                <Link href={offerRoute}>
                  <Button size="lg" variant="outline" className="h-12 px-8 text-sm border-white/20! bg-white/5! text-white! hover:bg-white/10! hover:text-white! rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer">
                    <Icon name="car" className="mr-2 h-5 w-5" />
                    {language === 'en' ? 'Offer a Ride' : copy.home.driverCtaButton}
                  </Button>
                </Link>
              </div>

              <div className="mt-8 rounded-2xl bg-white/5 p-2 backdrop-blur-md border border-white/10 max-w-[672px] mx-auto transition-all duration-300 hover:border-white/20 hover:bg-white/8 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <HeroSelect
                    label={copy.common.from}
                    value={from}
                    onChange={setFrom}
                    options={AZ_CITIES}
                    icon="map-pin" // IconName
                  />
                  
                  <HeroSelect
                    label={copy.common.to}
                    value={to}
                    onChange={setTo}
                    options={AZ_CITIES}
                    icon="map-pin"
                  />

                  <div className="relative w-full">
                    <button 
                      type="button" 
                      onClick={handleSearch} 
                      className="flex h-full w-full min-w-0 items-center gap-3 rounded-xl bg-white/5 px-4 py-2.5 text-left border border-transparent transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer"
                    >
                      <Icon name="calendar" className="h-5 w-5 shrink-0 text-teal-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-teal-200/50 mb-0.5">{copy.home.searchWhen}</p>
                        <p className="truncate text-sm font-medium text-white">{copy.home.searchToday}</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="w-full bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                {copy.home.howItWorksTitle}
              </h2>
              <p className="mt-4 text-lg text-slate-500">
                {copy.home.howItWorksSub}
              </p>
            </div>
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3 stagger-children">
              {([
                {
                  icon: "search",
                  title: copy.home.step1Title,
                  desc: copy.home.step1Desc,
                },
                {
                  icon: "message-square",
                  title: copy.home.step2Title,
                  desc: copy.home.step2Desc,
                },
                {
                  icon: "shield-check",
                  title: copy.home.step3Title,
                  desc: copy.home.step3Desc,
                },
              ] satisfies Array<{ icon: IconName; title: string; desc: string }>).map((step, i) => (
                <div 
                  key={i} 
                  className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-teal-100"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition-all duration-300 group-hover:bg-teal-500 group-hover:text-white group-hover:scale-110 shadow-xs">
                    <Icon name={step.icon} className="h-7 w-7" />
                  </div>
                  <div className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-navy transition-colors duration-300 group-hover:text-teal-600">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Feature highlight */}
        <section className="w-full bg-teal-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="lg:max-w-[560px] animate-slide-up">
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3.5 py-1 text-sm font-semibold text-teal-700 hover:scale-105 transition-transform duration-300">
                  <Icon name="zap" className="h-4 w-4" />
                  {copy.home.aiBadge}
                </div>
                <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl leading-tight">
                  {copy.home.aiTitle}
                </h2>
                <p className="mt-4 text-lg text-slate-600 leading-relaxed">
                  {copy.home.aiDesc}
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    copy.home.aiPoint1,
                    copy.home.aiPoint2,
                    copy.home.aiPoint3,
                    copy.home.aiPoint4,
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium hover:translate-x-1 transition-transform duration-200">
                      <div className="flex h-6 w-6 items-center justify-center bg-teal-100 rounded-full shrink-0 shadow-xs">
                        <Icon name="zap" className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <Card className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-3 shadow-[0_24px_70px_rgba(0,31,36,0.14)] backdrop-blur lg:ml-auto lg:w-[512px] hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgba(0,31,36,0.2)] transition-all duration-500">
                <div className="relative overflow-hidden rounded-[22px] bg-navy p-6 text-white">
                  <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-teal-400/20 blur-2xl animate-pulse" />
                  <div className="absolute -bottom-16 left-10 h-28 w-28 rounded-full bg-cyan-300/10 blur-2xl" />
                  <div className="relative z-10 flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-teal-200">Baku to Ganja</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-100 ring-1 ring-white/10">
                      {copy.home.aiRecommended}
                    </span>
                  </div>
                  <div className="relative z-10 mt-5 flex items-end justify-between gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-5xl font-extrabold tracking-tight">11.50</span>
                      <span className="pb-1 text-base font-semibold text-teal-100/80">AZN / {copy.home.aiSeat}</span>
                    </div>
                    <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 sm:flex hover:rotate-12 transition-transform duration-300">
                      <Icon name="zap" className="h-5 w-5 text-teal-200" />
                    </div>
                  </div>
                  <p className="relative z-10 mt-3 max-w-[390px] text-sm leading-relaxed text-teal-100/65">
                    {copy.home.aiCardReasoning}
                  </p>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white shadow-sm">
                        RM
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-navy">Rashad M.</p>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Icon name="star" className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium text-slate-700">4.9</span>
                          <span>- 312 trips</span>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 ring-1 ring-teal-100">
                      Verified driver
                    </div>
                  </div>

                  <div className="my-5 grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-teal-500 ring-4 ring-teal-50" />
                    <div className="h-px bg-linear-to-r from-teal-200 via-slate-200 to-navy/20" />
                    <div className="h-2.5 w-2.5 rounded-full bg-navy ring-4 ring-slate-100" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
                    <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-3 hover:border-teal-300 transition-colors">
                      <p className="font-heading text-lg font-extrabold text-navy">2</p>
                      <p className="mt-0.5 font-medium">Seats left</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 hover:border-slate-300 transition-colors">
                      <p className="font-heading text-lg font-extrabold text-navy">08:00</p>
                      <p className="mt-0.5 font-medium">Departure</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 hover:border-slate-300 transition-colors">
                      <p className="font-heading text-lg font-extrabold text-navy">Toyota</p>
                      <p className="mt-0.5 font-medium">Camry</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Popular Rides */}
        <section className="w-full bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between animate-slide-up">
              <div>
                <h2 className="font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                  {copy.home.popularTitle}
                </h2>
                <p className="mt-4 text-lg text-slate-500">
                  {copy.home.popularSub}
                </p>
              </div>
              <Link href={ROUTES.trips} className="hidden items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 hover:underline sm:flex transition-all duration-200 hover:translate-x-1">
                {copy.home.viewAll} <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {TOP_ROUTES.map((r) => (
                <button
                  key={`${r.from}-${r.to}`}
                  onClick={() => router.push(`${ROUTES.trips}?from=${r.from}&to=${r.to}`)}
                  className="group relative h-[320px] w-full cursor-pointer overflow-hidden rounded-[24px] text-left shadow-lg transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl"
                >
                  <Image
                    src={r.img}
                    alt={`${r.from} → ${r.to}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-navy/95 via-navy/40 to-transparent pointer-events-none" />
                  
                  {/* Subtle glass reflection hover effect */}
                  <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

                  <div className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="mb-1 font-heading text-2xl font-bold text-white drop-shadow-md flex items-center">
                          {r.from} 
                          <Icon name="arrow-right" size={16} className="inline mx-1.5 opacity-70 transition-transform duration-300 group-hover:translate-x-1" /> 
                          {r.to}
                        </h3>
                        <p className="flex items-center gap-1.5 text-sm font-medium text-teal-200">
                          <Icon name="car" size={14} /> {copy.home.dailyTrips[r.tripsKey]}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/30 bg-white/20 px-3 py-1.5 text-sm font-bold text-white shadow-sm backdrop-blur-md">
                        {formatRoutePrice(r.price)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-10 text-center sm:hidden">
              <Link href={ROUTES.trips} className="inline-flex items-center gap-2 text-sm font-bold text-teal-600 hover:text-teal-700 hover:underline transition-colors">
                {copy.home.viewAll} <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="w-full bg-navy py-16 text-white border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4 stagger-children">
              {[
                { value: copy.home.stat1Val, label: copy.home.stat1Lbl },
                { value: copy.home.stat2Val, label: copy.home.stat2Lbl },
                { value: copy.home.stat3Val, label: copy.home.stat3Lbl },
                { value: copy.home.stat4Val, label: copy.home.stat4Lbl },
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <p className="font-heading text-3xl font-bold text-teal-400 sm:text-4xl transition-all duration-300 group-hover:scale-105 group-hover:text-teal-300">{stat.value}</p>
                  <p className="mt-2 text-sm font-medium uppercase tracking-wider text-teal-200/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full bg-white py-20 sm:py-28 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-slate-50/50 to-white pointer-events-none" />
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 animate-slide-up">
            <div className="inline-flex items-center justify-center p-4 bg-teal-50 rounded-2xl mb-8 transition-transform duration-500 hover:rotate-12 hover:scale-110 shadow-xs">
              <Icon name="car" size={32} className="text-teal-600 animate-pulse" />
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              {copy.home.ctaTitle}
            </h2>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
              {copy.home.ctaDesc}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={ROUTES.register} className="w-full sm:w-auto">
                <Button size="lg" className="h-14 px-8 text-base bg-teal-500 hover:bg-teal-400 text-navy font-bold rounded-xl shadow-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] hover:shadow-[0_8px_20px_rgba(20,184,166,0.25)] w-full cursor-pointer">
                  <Icon name="user" className="mr-2 h-5 w-5" />
                  {copy.home.ctaJoin}
                </Button>
              </Link>
              <Link href={ROUTES.trips} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base font-bold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 w-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer">
                  {copy.home.ctaBrowse}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
