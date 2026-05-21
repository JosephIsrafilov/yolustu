'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { I18N, LANGUAGES } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { language, setLanguage } = useAppStore();
  const copy = I18N[language];
  const links = [
    { label: copy.footer.about, href: '/' },
    { label: copy.footer.help, href: '/' },
    { label: copy.footer.terms, href: '/' },
    { label: copy.footer.privacy, href: '/' },
  ];

  return (
    <footer className="mt-auto w-full border-t border-[#c0c8ca] bg-[#edfcff]">
      <div className="mx-auto flex w-full max-w-[1140px] flex-col items-center justify-between gap-6 px-4 py-10 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Link href="/" className="flex items-center gap-2 text-[18px] font-black text-[#002f37]">
            <Icon name="map" size={20} strokeWidth={1.8} />
            Yolüstü
          </Link>
          <span className="text-[14px] text-[#40484a]">© {currentYear} Yolüstü. {copy.footer.rights}</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-5">
          {links.map((l) => (
            <Link key={l.label} href={l.href}
              className="text-[12px] font-bold text-[#40484a] hover:text-[#054752] underline underline-offset-2 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[12px] font-bold text-[#40484a]">
          <div className="flex items-center gap-1" aria-label={copy.footer.languageLabel}>
            {LANGUAGES.map((item, index) => (
              <React.Fragment key={item.code}>
                {index > 0 && <span className="text-[#c0c8ca]">|</span>}
                <button
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`transition-colors hover:text-[#054752] ${
                    language === item.code ? 'text-[#002f37]' : 'text-[#40484a]'
                  }`}
                  aria-pressed={language === item.code}
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
          <span className="text-[#c0c8ca]">|</span>
          <button className="flex items-center gap-1 transition-colors hover:text-[#054752]" aria-label={copy.footer.currencyLabel}>
            AZN ₼
            <Icon name="chevron-right" size={12} className="rotate-90" />
          </button>
        </div>
      </div>
    </footer>
  );
}
