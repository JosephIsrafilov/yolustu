import type { Metadata } from "next";
import AuthProvider from "@/components/auth/AuthProvider";
import RouteAccessGuard from "@/components/auth/RouteAccessGuard";
import SupportWidget from "@/components/chat/SupportWidget";
import LanguageSync from "@/components/layout/LanguageSync";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yolmates — Azərbaycan üçün carpooling platforması",
  description: "Şəhərlərarası gedişləri tap, paylaş, ucuz və rahat səyahət et. Bakı, Gəncə, Sumqayıt, Şəki, Quba və daha çox.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" data-scroll-behavior="smooth">
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>
            <LanguageSync />
            <RouteAccessGuard />
            {children}
            <SupportWidget />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

