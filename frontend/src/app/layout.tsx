import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import RouteAccessGuard from "@/components/auth/RouteAccessGuard";
import LanguageSync from "@/components/layout/LanguageSync";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yolmates — Azərbaycan üçün carpooling platforması",
  description: "Şəhərlərarası gedişləri tap, paylaş, ucuz və rahat səyahət et. Bakı, Gəncə, Sumqayıt, Şəki, Quba və daha çox.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className={`${plusJakartaSans.variable} ${inter.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>
            <LanguageSync />
            <RouteAccessGuard />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

