import type { Metadata } from 'next';
import AuthProvider from '@/components/auth/AuthProvider';
import RouteAccessGuard from '@/components/auth/RouteAccessGuard';
import SupportWidget from '@/components/chat/SupportWidget';
import LanguageSync from '@/components/layout/LanguageSync';
import QueryProvider from '@/providers/QueryProvider';
import { Language } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'Yolmates — Share rides across Azerbaijan' : 'Yolmates — Azərbaycan üçün carpooling platforması',
  description: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'Explore an interactive, browser-based demo of Yolmates, an Azerbaijan carpooling platform.' : 'Şəhərlərarası gedişləri tap, paylaş, ucuz və rahat səyahət et. Bakı, Gəncə, Sumqayıt, Şəki, Quba və daha çox.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale: Language = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ? 'en' : 'az';

  return (
    <html lang={locale} data-scroll-behavior="smooth" className="overflow-x-hidden">
      <body className="antialiased overflow-x-hidden">
        <QueryProvider>
          <AuthProvider>
            <LanguageSync serverLocale={locale} />
            <RouteAccessGuard />
            {children}
            <SupportWidget />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
