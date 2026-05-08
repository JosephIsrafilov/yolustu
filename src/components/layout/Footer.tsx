import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';

const LINKS = [
  { label: 'Haqqımızda', href: '/' },
  { label: 'Yardım Mərkəzi', href: '/' },
  { label: 'İstifadə Şərtləri', href: '/' },
  { label: 'Məxfilik Siyasəti', href: '/' },
];

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-[#c0c8ca] bg-[#edfcff]">
      <div className="mx-auto flex w-full max-w-[1140px] flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link href="/" className="flex items-center gap-2 text-[18px] font-black text-[#002f37]">
            <Icon name="map" size={20} strokeWidth={1.8} />
            YolUstu
          </Link>
          <span className="text-[14px] text-[#40484a]">© 2024 YolUstu. Bütün hüquqlar qorunur.</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-5">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href}
              className="text-[12px] font-bold text-[#40484a] hover:text-[#3a6a00] underline underline-offset-2 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[12px] font-bold text-[#40484a]">
          <button className="transition-colors hover:text-[#3a6a00]">AZ | RU | EN</button>
          <span className="text-[#c0c8ca]">|</span>
          <button className="flex items-center gap-1 transition-colors hover:text-[#3a6a00]">
            AZN ₼
            <Icon name="chevron-right" size={12} className="rotate-90" />
          </button>
        </div>
      </div>
    </footer>
  );
}
