'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { I18N, LANGUAGES } from '@/lib/i18n';
import { CURRENCY_CODE, CURRENCY_SYMBOL } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import YolmatesLogo from '@/components/brand/YolmatesLogo';

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
      <div className="mx-auto grid w-full max-w-[1140px] grid-cols-1 items-center gap-6 px-4 py-8 text-center md:grid-cols-[minmax(220px,1fr)_minmax(0,auto)_minmax(180px,1fr)] md:text-left">
        <div className="flex min-w-0 flex-col items-center gap-2 md:items-start">
          <YolmatesLogo size="sm" className="whitespace-nowrap" />
          <span className="ui-meta-text text-[#40484a]">© {currentYear} Yolmates. {copy.footer.rights}</span>
        </div>
        <nav className="flex min-w-0 flex-wrap justify-center gap-x-5 gap-y-2 md:flex-nowrap">
          {links.map((l) => (
            <Link key={l.label} href={l.href}
              className="ui-action-text whitespace-nowrap text-[#40484a] underline underline-offset-2 transition-colors hover:text-[#054752]">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ui-action-text grid grid-cols-[120px_auto_70px] items-center gap-3 justify-self-center text-[#40484a] md:justify-self-end shrink-0 flex-none h-6">
          <div className="flex w-[120px] items-center justify-between shrink-0 flex-none" aria-label={copy.footer.languageLabel}>
            {LANGUAGES.map((item, index) => (
              <React.Fragment key={item.code}>
                {index > 0 && <span className="text-[#c0c8ca] flex-none">|</span>}
                <button
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`transition-colors hover:text-[#054752] flex-none text-center min-w-[24px] ${
                    language === item.code ? 'text-[#002f37]' : 'text-[#40484a]'
                  }`}
                  aria-pressed={language === item.code}
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
          <span className="text-[#c0c8ca] shrink-0 flex-none">|</span>
          <button className="ui-action-text flex items-center justify-between w-[70px] shrink-0 flex-none transition-colors hover:text-[#054752]" aria-label={copy.footer.currencyLabel}>
            <span className="truncate">{CURRENCY_CODE} {CURRENCY_SYMBOL}</span>
            <Icon name="chevron-right" size={12} className="rotate-90 shrink-0" />
          </button>
        </div>
      </div>
    </footer>
  );
}
