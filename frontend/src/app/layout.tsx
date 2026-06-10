import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import AuthProvider from '@/components/auth/AuthProvider';
import RouteAccessGuard from '@/components/auth/RouteAccessGuard';
import SupportWidget from '@/components/chat/SupportWidget';
import LanguageSync from '@/components/layout/LanguageSync';
import QueryProvider from '@/providers/QueryProvider';
import { Language } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yolmates — Azərbaycan üçün carpooling platforması',
  description: 'Şəhərlərarası gedişləri tap, paylaş, ucuz və rahat səyahət et. Bakı, Gəncə, Sumqayıt, Şəki, Quba və daha çox.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value || 'az') as Language;

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
