import React from 'react';
import Link from 'next/link';

const LINKS = [
  { label: 'Haqqımızda', href: '/' },
  { label: 'Yardım Mərkəzi', href: '/' },
  { label: 'İstifadə Şərtləri', href: '/' },
  { label: 'Məxfilik Siyasəti', href: '/' },
];

export default function Footer() {
  return (
    <footer className="bg-[#edfcff] border-t border-[#c0c8ca] w-full mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-10 max-w-[1140px] mx-auto gap-6">
        <Link href="/" className="text-[18px] font-[900] text-[#002f37]">
          YolUstu
        </Link>
        <nav className="flex flex-wrap justify-center gap-5">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href}
              className="text-[12px] font-bold text-[#40484a] hover:text-[#3a6a00] underline underline-offset-2 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[12px] font-bold text-[#40484a]">
          <span>AZ | RU | EN</span>
          <span className="text-[#c0c8ca]">|</span>
          <span>AZN ₼</span>
        </div>
      </div>
      <div className="w-full text-center pb-4 text-[14px] text-[#40484a]">
        © {new Date().getFullYear()} YolUstu. Bütün hüquqlar qorunur.
      </div>
    </footer>
  );
}
