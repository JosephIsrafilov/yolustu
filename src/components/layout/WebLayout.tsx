'use client';

import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface WebLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  narrow?: boolean;
  hideFooter?: boolean;
}

export default function WebLayout({
  children,
  title,
  showBack = false,
  narrow = false,
  hideFooter = false,
}: WebLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-dim">
      <Header />

      <main className="flex-1">
        <div className={`mx-auto px-4 sm:px-6 lg:px-8 py-6 ${narrow ? 'max-w-3xl' : 'max-w-7xl'}`}>
          {title && (
            <div className="flex items-center gap-3 mb-6">
              {showBack && (
                <button
                  onClick={() => window.history.back()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-muted transition-colors text-text-secondary"
                  aria-label="Geri"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-bold text-text">{title}</h1>
            </div>
          )}

          {children}
        </div>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
