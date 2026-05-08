'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface WebLayoutProps {
  children: React.ReactNode;
  title?: string;
  narrow?: boolean;
  showBack?: boolean;
  hideFooter?: boolean;
}

export default function WebLayout({ children, title, narrow, showBack, hideFooter }: WebLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <Header />
      <main className={`flex-grow w-full mx-auto px-4 py-6 ${narrow ? 'max-w-2xl' : 'max-w-[1140px]'}`}>
        {(title || showBack) && (
          <div className="flex items-center gap-3 mb-6">
            {showBack && (
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant flex items-center justify-center hover:bg-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">arrow_back</span>
              </button>
            )}
            {title && (
              <h1 className="text-2xl font-semibold leading-8 text-primary">{title}</h1>
            )}
          </div>
        )}
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
