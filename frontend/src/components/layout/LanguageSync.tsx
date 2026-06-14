'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Language } from '@/lib/i18n';

const TITLES = {
  az: {
    '/': 'Yolmates — Yolunu paylaş',
    '/trips': 'Gedişlər — Yolmates',
    '/trips/[id]': 'Gediş detalları — Yolmates',
    '/auth/login': 'Daxil ol — Yolmates',
    '/auth/register': 'Qeydiyyat — Yolmates',
    '/profile': 'Profil — Yolmates',
    '/wallet': 'Balans — Yolmates',
    '/bookings': 'Rezervlər — Yolmates',
    '/about': 'Haqqımızda — Yolmates',
    '/help': 'Yardım Mərkəzi — Yolmates',
    '/terms': 'İstifadə Şərtləri — Yolmates',
    '/privacy': 'Məxfilik Siyasəti — Yolmates',
    '/driver': 'Sürücü paneli — Yolmates',
    '/driver/create-trip': 'Gediş paylaş — Yolmates',
  },
  ru: {
    '/': 'Yolmates — Делитесь поездками',
    '/trips': 'Поездки — Yolmates',
    '/trips/[id]': 'Детали поездки — Yolmates',
    '/auth/login': 'Вход — Yolmates',
    '/auth/register': 'Регистрация — Yolmates',
    '/profile': 'Профиль — Yolmates',
    '/wallet': 'Баланс — Yolmates',
    '/bookings': 'Брони — Yolmates',
    '/about': 'О нас — Yolmates',
    '/help': 'Центр помощи — Yolmates',
    '/terms': 'Условия использования — Yolmates',
    '/privacy': 'Политика конфиденциальности — Yolmates',
    '/driver': 'Панель водителя — Yolmates',
    '/driver/create-trip': 'Опубликовать поездку — Yolmates',
  },
  en: {
    '/': 'Yolmates — Share rides',
    '/trips': 'Trips — Yolmates',
    '/trips/[id]': 'Trip details — Yolmates',
    '/auth/login': 'Sign in — Yolmates',
    '/auth/register': 'Register — Yolmates',
    '/profile': 'Profile — Yolmates',
    '/wallet': 'Wallet — Yolmates',
    '/bookings': 'Bookings — Yolmates',
    '/about': 'About — Yolmates',
    '/help': 'Help Center — Yolmates',
    '/terms': 'Terms of Use — Yolmates',
    '/privacy': 'Privacy Policy — Yolmates',
    '/driver': 'Driver dashboard — Yolmates',
    '/driver/create-trip': 'Offer a ride — Yolmates',
  }
} as const;

export default function LanguageSync({ serverLocale }: { serverLocale?: Language }) {
  const language = useAppStore((state) => state.language);
  const pathname = usePathname();

  React.useEffect(() => {
    if (serverLocale) {
      useAppStore.setState({ language: serverLocale });
    }
  }, [serverLocale]);

  React.useEffect(() => {
    document.documentElement.lang = language;
    document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000; SameSite=Lax`;
  }, [language]);

  React.useEffect(() => {
    let title = '';
    const langTitles = TITLES[language] || TITLES.az;

    if (pathname === '/') {
      title = langTitles['/'];
    } else if (pathname.startsWith('/trips/') && pathname.length > 7) {
      title = langTitles['/trips/[id]'];
    } else if (pathname === '/driver/create-trip') {
      title = langTitles['/driver/create-trip'];
    } else if (pathname.startsWith('/driver')) {
      title = langTitles['/driver'];
    } else {
      title = langTitles[pathname as keyof typeof langTitles];
    }

    if (title) {
      document.title = title;
    }
  }, [pathname, language]);

  return null;
}
