'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Icon from '@/components/ui/Icon';

interface WebLayoutProps {
  children: React.ReactNode;
  title?: string;
  narrow?: boolean;
  showBack?: boolean;
  hideFooter?: boolean;
}

export default function WebLayout({ children, title, narrow, showBack, hideFooter }: WebLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-grow w-full mx-auto px-6 py-8 ${narrow ? 'max-w-2xl' : 'max-w-[1140px]'}`}>
        {(title || showBack) && (
          <div className="flex items-center gap-3 mb-8">
            {showBack && (
              <button onClick={() => window.history.back()}
                className="w-10 h-10 rounded-full bg-white border border-[#c0c8ca] flex items-center justify-center hover:bg-[#d5f3f9] transition-colors">
                <Icon name="arrow-left" size={18} className="text-[#40484a]" />
              </button>
            )}
            {title && (
              <h1 className="text-[24px] font-semibold leading-[32px] text-[#002f37]">{title}</h1>
            )}
          </div>
        )}
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
