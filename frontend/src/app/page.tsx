'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES } from '@/lib/utils';
import { I18N } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon, { type IconName } from '@/components/ui/Icon';
import DatePicker from '@/components/ui/DatePicker';

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

export default function HomePage() {
  const router = useRouter();
  const { language } = useAppStore();
  const copy = I18N[language];
  const [dep, setDep] = useState('');
  const [arr, setArr] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [isSwapping, setIsSwapping] = useState(false);

  const swapRoute = () => {
    setIsSwapping(true);
    const temp = dep;
    setDep(arr);
    setArr(temp);
    setTimeout(() => setIsSwapping(false), 400);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (dep) params.set('from', dep);
    if (arr) params.set('to', arr);
    if (date) params.set('date', date);
    params.set('passengers', String(passengers));
    router.push(`${ROUTES.trips}?${params.toString()}`);
  };
  const formatRoutePrice = (price: number) => {
    if (language === 'az') return `${price} ₼-dən`;
    if (language === 'ru') return `от ${price} ₼`;
    return `from ${price} ₼`;
  };
  const features: { icon: IconName; title: string; desc: string }[] = [
    {
      icon: 'shield-check',
      title: copy.home.features.safetyTitle,
      desc: copy.home.features.safetyDesc,
    },
    {
      icon: 'banknote',
      title: copy.home.features.priceTitle,
      desc: copy.home.features.priceDesc,
    },
    {
      icon: 'leaf',
      title: copy.home.features.ecoTitle,
      desc: copy.home.features.ecoDesc,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-grow">
        <section className="relative overflow-hidden px-4 pb-8 pt-5 md:py-20">
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/driver-mountain-road.png"
              alt={copy.home.heroImageAlt}
              fill
              preload
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,31,36,0.40)_0%,rgba(0,47,55,0.58)_42%,rgba(0,47,55,0.22)_72%,#ffffff_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,175,245,0.12),transparent_58%)]" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[1140px] flex-col items-center text-center">
            <div className="animate-fade-in w-full max-w-2xl">
              <p className="mb-2 text-[13px] font-bold uppercase tracking-[0.12em] text-white/85">
                {copy.home.eyebrow}
              </p>
              <h1 className="text-[32px] font-bold leading-[38px] text-white drop-shadow-sm md:text-[48px] md:leading-[56px]">
                {copy.home.title}
              </h1>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 text-white/90 md:text-[17px]">
                {copy.home.subtitle}
              </p>
            </div>

            <div className="animate-fade-in mt-5 w-full max-w-4xl rounded-[24px] border border-white/70 bg-white/95 p-3 text-left shadow-[0_18px_45px_rgba(5,71,82,0.18)] backdrop-blur md:mt-8 md:p-4">
              <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-[1fr_auto_1fr_1fr_1fr_auto] md:items-end">
                <div className="flex flex-col">
                  <label className="mb-1 block text-[12px] font-bold text-[#40484a]">{copy.common.from}</label>
                  <div className="relative">
                    <Icon name="map-pin" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                    <select
                      value={dep}
                      onChange={(e) => setDep(e.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-[#c0c8ca] bg-[#edfcff] pl-10 pr-4 text-[15px] text-[#011f23] outline-none transition-all duration-200 ease-out focus:border-[#054752] focus:bg-white focus:ring-2 focus:ring-[#b5ebf9]"
                    >
                      <option value="">{copy.common.from}</option>
                      {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="z-10 hidden items-end justify-center pb-1 md:flex">
                  <button
                    type="button"
                    className={`rounded-full border border-[#c0c8ca] bg-white p-2 text-[#054752] shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#054752] hover:bg-[#edfcff] hover:shadow-md active:translate-y-0 active:scale-[0.96] ${isSwapping ? 'rotate-180' : ''}`}
                    onClick={swapRoute}
                    aria-label={copy.common.routeSwap}
                  >
                    <Icon name="arrow-right" size={20} />
                  </button>
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 block text-[12px] font-bold text-[#40484a]">{copy.common.to}</label>
                  <div className="relative">
                    <Icon name="map-pin" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                    <select
                      value={arr}
                      onChange={(e) => setArr(e.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-[#c0c8ca] bg-[#edfcff] pl-10 pr-4 text-[15px] text-[#011f23] outline-none transition-all duration-200 ease-out focus:border-[#054752] focus:bg-white focus:ring-2 focus:ring-[#b5ebf9]"
                    >
                      <option value="">{copy.common.to}</option>
                      {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <DatePicker
                  value={date}
                  onChange={setDate}
                  label={copy.common.date}
                  placeholder={copy.common.selectDate}
                  className="[&_label]:mb-1 [&_label]:text-[12px] [&_label]:font-bold [&_label]:text-[#40484a]"
                />

                <div className="flex flex-col">
                  <label className="mb-1 block text-[12px] font-bold text-[#40484a]">{copy.common.passenger}</label>
                  <div className="relative">
                    <Icon name="user" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                    <select
                      value={passengers}
                      onChange={(e) => setPassengers(Number(e.target.value))}
                      className="h-12 w-full appearance-none rounded-2xl border border-[#c0c8ca] bg-[#edfcff] pl-10 pr-4 text-[15px] text-[#011f23] outline-none transition-all duration-200 ease-out focus:border-[#054752] focus:bg-white focus:ring-2 focus:ring-[#b5ebf9]"
                    >
                      <option value={1}>1 {copy.common.passenger.toLowerCase()}</option>
                      <option value={2}>2 {copy.common.passengers.toLowerCase()}</option>
                      <option value={3}>3 {copy.common.passengers.toLowerCase()}</option>
                      <option value={4}>4+ {copy.common.passengers.toLowerCase()}</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#00AFF5] px-7 text-[16px] font-semibold text-white shadow-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#054752] hover:shadow-lg active:translate-y-0 active:scale-[0.98] md:mt-0 md:w-auto"
                >
                  {copy.common.search}
                  <Icon name="search" size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 pb-10 pt-8 md:py-12">
          <div className="mx-auto w-full max-w-[1140px]">
            <h2 className="mb-6 text-center text-[24px] font-semibold leading-[32px] text-[#002f37] md:mb-8">
              {copy.home.whyTitle}
            </h2>
            <div className="stagger-children grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col rounded-[22px] border border-[#d5f3f9] bg-[#f7feff] p-5 text-left shadow-card transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#b5ebf9] hover:shadow-card-hover active:translate-y-0 active:scale-[0.99] md:items-center md:p-6 md:text-center"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b5ebf9] text-[#002f37] md:h-16 md:w-16 md:rounded-full">
                    <Icon name={f.icon} size={28} className="text-[#002f37]" />
                  </div>
                  <h3 className="mb-2 text-[18px] font-semibold leading-6 text-[#011f23]">{f.title}</h3>
                  <p className="text-[14px] leading-5 text-[#40484a]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#edfcff] px-4 py-10">
          <div className="mx-auto max-w-[1140px]">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-[24px] font-semibold leading-[32px] text-[#002f37]">
                {copy.home.popularTitle}
              </h2>
              <Link
                href={ROUTES.trips}
                className="hidden items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-bold text-[#002f37] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white hover:text-[#054752] md:flex"
              >
                {copy.home.viewAll} <Icon name="arrow-right" size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOP_ROUTES.map((r) => (
                <button
                  key={`${r.from}-${r.to}`}
                  onClick={() => router.push(`${ROUTES.trips}?from=${r.from}&to=${r.to}`)}
                  className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-[22px] text-left shadow-card transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0 active:scale-[0.98]"
                >
                  <Image
                    src={r.img}
                    alt={`${r.from} → ${r.to}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#002f37]/90 via-[#002f37]/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 flex w-full items-end justify-between gap-4 p-4">
                    <div>
                      <h3 className="mb-1 text-[18px] font-semibold leading-6 text-white">
                        {r.from} → {r.to}
                      </h3>
                      <p className="text-[14px] leading-5 text-white/80">{copy.home.dailyTrips[r.tripsKey]}</p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-white px-3 py-1 text-[12px] font-bold leading-4 text-[#002f37] shadow-sm">
                      {formatRoutePrice(r.price)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Link
              href={ROUTES.trips}
              className="mt-6 block rounded-xl bg-white px-4 py-3 text-center text-[14px] font-semibold text-[#054752] shadow-card transition-all duration-200 ease-out active:scale-[0.98] md:hidden"
            >
              {copy.home.viewAll}
            </Link>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#002f37] px-4 py-10">
          <div className="relative z-10 mx-auto w-full max-w-[1140px]">
            <div className="flex flex-col items-center justify-between gap-10 md:flex-row lg:gap-20">
              <div className="flex flex-1 flex-col items-start gap-4 text-left">
                <h2 className="text-[34px] font-bold leading-[40px] text-white md:text-[40px] md:leading-[48px]">
                  {copy.home.driverCtaTitle}
                </h2>
                <p className="max-w-lg text-[16px] leading-7 text-[#9acfdc] md:text-[18px]">
                  {copy.home.driverCtaDesc}
                </p>
                <Link
                  href={ROUTES.createTrip}
                  className="mt-2 inline-flex items-center gap-3 rounded-2xl bg-[#054752] px-8 py-3.5 text-[16px] font-semibold text-white shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-[#306671] hover:shadow-xl active:translate-y-0 active:scale-[0.98] md:px-10 md:py-4 md:text-[18px]"
                >
                  {copy.home.driverCtaButton}
                  <Icon name="car" size={20} />
                </Link>
              </div>

              <div className="w-full max-w-md flex-1 md:max-w-none">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2 backdrop-blur-sm md:rounded-[2.5rem] md:p-4">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] shadow-2xl md:aspect-square md:rounded-[2rem]">
                    <Image
                      src="/images/driver-mountain-road.png"
                      alt={copy.home.driverImageAlt}
                      fill
                      sizes="(max-width: 768px) 100vw, 520px"
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/20" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
