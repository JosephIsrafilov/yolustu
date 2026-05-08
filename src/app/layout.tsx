import type { Metadata } from "next";
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
      <body className="antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
