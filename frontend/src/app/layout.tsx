import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProvider from "@/components/auth/AuthProvider";
import LanguageSync from "@/components/layout/LanguageSync";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yolüstü — Azərbaycan üçün carpooling platforması",
  description: "Şəhərlərarası gedişləri tap, paylaş, ucuz və rahat səyahət et. Bakı, Gəncə, Sumqayıt, Şəki, Quba və daha çox.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="az" className={inter.variable} data-scroll-behavior="smooth">
      <body className="antialiased">
        <QueryProvider>
          <AuthProvider>
            <LanguageSync />
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

