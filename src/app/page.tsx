'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { AZ_CITIES } from '@/lib/utils';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon, { type IconName } from '@/components/ui/Icon';

const FEATURES: { icon: IconName; title: string; desc: string }[] = [
  {
    icon: 'shield-check',
    title: 'Təhlükəsizlik',
    desc: 'Bütün sürücülər yoxlanılır. Səyahətiniz boyu rahatlığınız bizim prioritetimizdir.',
  },
  {
    icon: 'banknote',
    title: 'Sərfəli Qiymət',
    desc: 'Büdcənizə uyğun variantlar tapın. Şəffaf qiymətləndirmə, gizli ödənişlər yoxdur.',
  },
  {
    icon: 'leaf',
    title: 'Ekoloji Təmiz',
    desc: 'Boş yerləri paylaşaraq karbon izimizi azaldın. Birlikdə daha yaşıl bir gələcək üçün.',
  },
];

const TOP_ROUTES = [
  {
    from: 'Bakı',
    to: 'Gəncə',
    price: 15,
    trips: 'Hər gün 20+ səfər',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5IQh9eoAlVCIbIcZm73CAErqvtVfQe0w5TQOlQY3KdCCK6p-5otR2flM3qhI0by15J2iBnjKJw3LONslc6QriE6eHjeC4Iuc7rtOqYBj792b04vkbLj16FUIv1kA2Onpnje30uGaIf0Ac2n5bGEyeANX0Jxqy3IKbjL0RZ-AOPVtqufzOv7V1LgW-xw-U1B9VSqgzukwxk0XZ15BJy3wuypKrHqv1ZRbp7RyhXkmxFGokMsAmpPiuhwnYzLSYjm8lr-YnfcV3tdo',
  },
  {
    from: 'Bakı',
    to: 'Quba',
    price: 10,
    trips: 'Hər gün 15+ səfər',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfj91f3rPN3Yftx2nh9gkj_0fYD1wtf9PXcuPEBedXBuga-9CNvDdZODGuV1-84CBvQfLFbOnsyoHMDn8qdYwsLowUZDr7qpKgXiSrFAODLkOrpz1ShTHuArGiA-rT9POdgZWD2pvPlSXKCIe8KIzqcW-tRSibhray7Rirw2XDYrMbwv5dud79XF3kGTV-uHbe-IaDbahMkpFrsHFXjtfYtLxew524Pp39couepc14Lyxy9kfrSSzMtdPxOWNW1vXkhTdq5Xb94WM',
  },
  {
    from: 'Bakı',
    to: 'Lənkəran',
    price: 12,
    trips: 'Hər gün 10+ səfər',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrRWiYBMTNGjfSDfkpQk9w9qYxCbJyvT-2eUDU4RiMVRWM4Zb50_XBVBKfWrHbjUJiCRRoahvwUJe21fU26evN1WkgTmeTaaWZ7RIRR02GwDE9XQXENqsfnKHhl5JyIesSQxOW8xSt6W66Tm9l2gINRh4F0k7gczDGc5nDL84Vg_LVcuYu7bTB5LA28BOuXBSGAYHoVXTvwonxQcVdkF49FfUg7DV_0UdzpK_Hqzpsjmx7t9YJzYLtwhf6zuGwpjHQqQVgRJC9Hlk',
  },
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
    params.set('passengers', String(passengers));
    router.push(`${ROUTES.trips}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative flex h-[500px] w-full items-center justify-center overflow-hidden md:h-[600px]">
          <div className="absolute inset-0 z-0">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdhXsktOYAkazf8LKTPl37m1Yh_7UPyMGxC5x7Fu62lr_Bw4sYyfhThMBsrkOXnHPn_rwXc8LkrSbArYkG7ucl0ynDnHrNj4PeQPHcK2-em0m-ZdwTUjnHCC9qsj2lyfQa4bkSqmWyNggmy4E0TwkSdVxvpWcHx-CnCtpLxAnxczJD3aNxgDeU2R-xxx6rKD34RqChhSg6jsEK_pewJ_d1b71R1neeQWGelPWc3yWdzuh_dcbtzBstbiIuDvhhdHkteIE4GlKFIrs"
              alt="Azerbaijan highway landscape"
              fill
              preload
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#054752]/40 to-[#054752]/80" />
          </div>

          <div className="relative z-10 mx-auto flex w-full max-w-[1140px] flex-col items-center px-4 text-center">
            <h1 className="mb-6 max-w-2xl text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-white drop-shadow-sm">
              Səyahətinizi Asanlaşdırın
            </h1>

            <div className="mt-4 flex w-full max-w-4xl flex-col gap-4 rounded-xl bg-white p-4 shadow-lg md:flex-row md:p-6">
              <div className="flex-1 relative">
                <Icon name="map-pin" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <select value={dep} onChange={(e) => setDep(e.target.value)}
                  className="w-full rounded-lg border border-[#c0c8ca] bg-[#edfcff] py-3 pl-10 pr-4 text-[16px] text-[#011f23] outline-none transition-all appearance-none focus:border-[#002f37] focus:ring-1 focus:ring-[#002f37]">
                  <option value="">From</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="z-10 -mx-4 hidden items-center justify-center md:flex">
                <button
                  type="button"
                  className="rounded-full border border-[#c0c8ca] bg-[#00AFF5] p-2 text-white shadow-sm transition-all hover:border-[#054752] hover:bg-[#054752]"
                  onClick={() => {
                    setDep(arr);
                    setArr(dep);
                  }}
                  aria-label="Swap route"
                >
                  <Icon name="arrow-right" size={20} />
                </button>
              </div>

              <div className="flex-1 relative">
                <Icon name="map-pin" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <select value={arr} onChange={(e) => setArr(e.target.value)}
                  className="w-full rounded-lg border border-[#c0c8ca] bg-[#edfcff] py-3 pl-10 pr-4 text-[16px] text-[#011f23] outline-none transition-all appearance-none focus:border-[#002f37] focus:ring-1 focus:ring-[#002f37]">
                  <option value="">To</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="flex-1 relative">
                <Icon name="calendar" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-[#c0c8ca] bg-[#edfcff] py-3 pl-10 pr-4 text-[16px] text-[#011f23] outline-none transition-all focus:border-[#002f37] focus:ring-1 focus:ring-[#002f37]" />
              </div>

              <div className="flex-1 relative">
                <Icon name="user" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <select
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#c0c8ca] bg-[#edfcff] py-3 pl-10 pr-4 text-[16px] text-[#011f23] outline-none transition-all appearance-none focus:border-[#002f37] focus:ring-1 focus:ring-[#002f37]"
                >
                  <option value={1}>1 Passenger</option>
                  <option value={2}>2 Passengers</option>
                  <option value={3}>3 Passengers</option>
                  <option value={4}>4+ Passengers</option>
                </select>
              </div>

              <button onClick={handleSearch}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00AFF5] px-8 py-3 text-[18px] font-semibold text-white shadow-md transition-colors hover:bg-[#054752] md:w-auto">
                Search
                <Icon name="search" size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-[#c0c8ca] bg-white px-4 py-10">
          <div className="mx-auto w-full max-w-[1140px]">
            <h2 className="mb-10 text-center text-[24px] font-semibold leading-[32px] text-[#002f37]">
              Niyə YolUstu?
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title}
                  className="flex flex-col items-center rounded-xl border border-transparent bg-[#edfcff] p-6 text-center transition-all duration-300 hover:border-[#c0c8ca] hover:shadow-md">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#b5ebf9] text-[#002f37]">
                    <Icon name={f.icon} size={32} className="text-[#002f37]" />
                  </div>
                  <h3 className="mb-2 text-[18px] font-semibold leading-6 text-[#011f23]">{f.title}</h3>
                  <p className="text-[14px] leading-5 text-[#40484a]">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Routes */}
        <section className="bg-[#edfcff] px-4 py-10">
          <div className="mx-auto max-w-[1140px]">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-[24px] font-semibold leading-[32px] text-[#002f37]">
                Məşhur İstiqamətlər
              </h2>
              <Link href={ROUTES.trips}
                className="hidden items-center gap-1 text-[12px] font-bold text-[#002f37] transition-colors hover:text-[#3a6a00] md:flex">
                Hamısına bax <Icon name="arrow-right" size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOP_ROUTES.map((r) => (
                <div key={`${r.from}-${r.to}`}
                  onClick={() => router.push(`${ROUTES.trips}?from=${r.from}&to=${r.to}`)}
                  className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
                    <Image
                      src={r.img}
                      alt={`${r.from} → ${r.to}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#002f37]/90 via-[#002f37]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 flex w-full items-end justify-between gap-4 p-4">
                      <div>
                        <h3 className="mb-1 text-[18px] font-semibold leading-6 text-white">
                          {r.from} → {r.to}
                        </h3>
                        <p className="text-[14px] leading-5 text-white/80">{r.trips}</p>
                      </div>
                      <div className="shrink-0 rounded-lg bg-white px-3 py-1 text-[12px] font-bold leading-4 text-[#002f37] shadow-sm">
                        {r.price} ₼-dən
                      </div>
                    </div>
                  </div>
              ))}
            </div>

            <Link href={ROUTES.trips}
              className="mt-6 block text-center text-[14px] font-medium text-[#054752] hover:underline md:hidden">
              Hamısına bax
            </Link>
          </div>
        </section>

        {/* Driver CTA */}
        <section className="relative overflow-hidden bg-[#002f37] px-4 py-10">
          <div className="relative z-10 mx-auto w-full max-w-[1140px]">
            <div className="flex flex-col items-center justify-between gap-12 md:flex-row lg:gap-20">
              <div className="flex flex-1 flex-col items-start gap-4 text-left">
                <h2 className="text-[40px] font-bold leading-[48px] tracking-[-0.02em] text-white">
                  Maşınınız var?
                </h2>
                <p className="max-w-lg text-[18px] leading-7 text-[#9acfdc]">
                  Xərclərinizi bölüşün və səyahətinizi daha maraqlı edin. Bu gün sürücü kimi qeydiyyatdan keçin və pul qazanmağa başlayın.
                </p>
                <Link href={ROUTES.createTrip}
                  className="mt-4 inline-flex items-center gap-3 rounded-xl bg-[#3a6a00] px-10 py-4 text-[18px] font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#a1fa49] hover:text-[#3e7100] hover:shadow-xl">
                  Offer a Ride
                  <Icon name="car" size={20} />
                </Link>
              </div>

              <div className="w-full max-w-md flex-1 md:max-w-none">
                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-2 backdrop-blur-sm md:p-4">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-2xl md:aspect-square">
                    <Image
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDFHqHGdWMMr1wRtsLtmkZ3BAe6yWoErMvoFd3cvKo5S16lJe5dkqXqP_7205400KdUIIWAmgFFEp1Y_DrDYH8OCj3AlxA7QOtlsG7C_Kc2o0HQSvdHszojofXkvK1KQhrqlOJ4P7afxo8sbZrcNh6CsFgsvBSRGhpGVqLL_N2RMuq8Nt5mZPJIY61vSaaNQvByRJ3ug4cF7fps8mSWHIlwo3ZLukPDRkW4j9njnAIMO0qY3nG6nhbq6mLt7gZYEi3L2gtllKmQm4"
                      alt="Professional carpooling route in Azerbaijan"
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
