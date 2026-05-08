import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

const FOOTER_LINKS = [
  { label: 'Haqqımızda', href: '/' },
  { label: 'Yardım Mərkəzi', href: '/' },
  { label: 'İstifadə Şərtləri', href: '/' },
  { label: 'Məxfilik Siyasəti', href: '/' },
];

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-outline-variant w-full mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 py-10 max-w-[1140px] mx-auto gap-6">
        <Link href="/" className="text-lg font-black text-primary">
          YolUstu
        </Link>
        <nav className="flex flex-wrap justify-center gap-4">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-bold text-on-surface-variant hover:text-secondary underline transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-xs font-bold text-on-surface-variant">
          <span>AZ | RU | EN</span>
          <span className="text-outline-variant">|</span>
          <span>AZN ₼</span>
        </div>
      </div>
      <div className="w-full text-center pb-4 text-sm text-on-surface-variant">
        © {new Date().getFullYear()} YolUstu. Bütün hüquqlar qorunur.
      </div>
    </footer>
  );
}
