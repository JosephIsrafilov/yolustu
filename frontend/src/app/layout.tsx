import type { Metadata } from "next";
import AuthProvider from "@/components/auth/AuthProvider";
import LanguageSync from "@/components/layout/LanguageSync";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

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
    <html lang="az" data-scroll-behavior="smooth">
      <body className="antialiased" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
