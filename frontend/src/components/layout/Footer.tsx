'use client';

import React from 'react';
import Link from 'next/link';
import { I18N, LANGUAGES } from '@/lib/i18n';
import { useAppStore } from '@/store/useAppStore';
import YolmatesLogo from '@/components/brand/YolmatesLogo';
import { resetDemoData, switchDemoAccount } from '@/services/demo/data';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { language, setLanguage } = useAppStore();
  const copy = I18N[language];
  const links = [
    { label: copy.footer.about, href: '/about' },
    { label: copy.footer.help, href: '/help' },
    // TODO: Create actual Terms and Privacy pages with legal content
    { label: copy.footer.terms, href: '/terms' },
    { label: copy.footer.privacy, href: '/privacy' },
  ];

  return (
    <footer className="mt-auto w-full border-t border-[#c0c8ca] bg-[#edfcff]">
      <div className="mx-auto grid w-full max-w-[1140px] grid-cols-1 items-center gap-6 px-4 py-8 text-center md:grid-cols-[minmax(220px,1fr)_minmax(0,auto)_minmax(180px,1fr)] md:text-left">
        <div className="flex min-w-0 flex-col items-center gap-2 md:items-start">
          <YolmatesLogo size="sm" className="whitespace-nowrap" />
          <span className="ui-meta-text text-[#40484a]">© {currentYear} Yolmates. {copy.footer.rights}</span>
        </div>
        <nav className="flex min-w-0 flex-wrap justify-center gap-x-5 gap-y-2 md:flex-nowrap">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="ui-action-text whitespace-nowrap rounded-sm text-[#40484a] opacity-80 transition-colors hover:text-[#054752] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#054752]/30 focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ui-action-text flex h-6 flex-none shrink-0 items-center justify-self-center text-[#40484a] md:justify-self-end">
          <div className="flex w-[120px] flex-none items-center justify-between shrink-0" aria-label={copy.footer.languageLabel}>
            {LANGUAGES.map((item, index) => (
              <React.Fragment key={item.code}>
                {index > 0 && <span className="flex-none text-[#c0c8ca]">|</span>}
                <button
                  type="button"
                  onClick={() => setLanguage(item.code)}
                  className={`min-w-[24px] flex-none rounded-sm text-center transition-colors hover:text-[#054752] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#054752]/30 focus-visible:ring-offset-2 ${
                    language === item.code ? 'text-[#002f37]' : 'text-[#40484a]'
                  }`}
                  aria-pressed={language === item.code}
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
        <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-3 border-t border-[#c0c8ca] px-4 py-5 text-sm text-[#40484a] sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div>
              <strong className="text-[#002f37]">Interactive Portfolio Demonstration · Simulated In-Browser Data</strong>
            </div>
            <div>
              <span className="font-semibold text-[#002f37]">Karim Baliyev</span>
              {' · '}
              <span>Software Developer · Project Contributor</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#054752]">
              <a className="underline hover:text-[#002f37]" href="https://github.com/d3fenddr" target="_blank" rel="noopener noreferrer">GitHub</a>
              <span className="text-[#c0c8ca]">·</span>
              <a className="underline hover:text-[#002f37]" href="https://degree-lens.pages.dev/" target="_blank" rel="noopener noreferrer">Degree Lens Portfolio</a>
              <span className="text-[#c0c8ca]">·</span>
              <a className="underline hover:text-[#002f37]" href="https://github.com/JosephIsrafilov/yolustu" target="_blank" rel="noopener noreferrer">Original Team Repository</a>
              <span className="text-[#c0c8ca]">·</span>
              <a className="underline hover:text-[#002f37]" href="https://github.com/JosephIsrafilov/yolustu/commits?author=d3fenddr" target="_blank" rel="noopener noreferrer">Contribution History</a>
            </div>
            <p className="text-xs text-[#5a7175]">
              Yolmates was developed as a collaborative team project. This interactive deployment simulates all flows client-side for portfolio and university evaluation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => switchDemoAccount('passenger')} className="rounded-lg border border-[#054752] px-3 py-2 text-[#054752] hover:bg-white">Explore passenger</button>
            <button type="button" onClick={() => switchDemoAccount('driver')} className="rounded-lg border border-[#054752] px-3 py-2 text-[#054752] hover:bg-white">Explore driver</button>
            <button type="button" onClick={resetDemoData} className="rounded-lg border border-[#c0c8ca] px-3 py-2 hover:bg-white">Reset demo data</button>
          </div>
        </div>
      )}
    </footer>
  );
}
