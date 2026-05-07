import React from 'react';
import Link from 'next/link';
import { Car } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

const FOOTER_LINKS = {
  Platforma: [
    { label: 'Gediş axtar', href: ROUTES.search },
    { label: 'Gediş yarat', href: ROUTES.createTrip },
    { label: 'Necə işləyir', href: '/' },
  ],
  Şirkət: [
    { label: 'Haqqımızda', href: '/' },
    { label: 'Əlaqə', href: '/' },
    { label: 'Karyera', href: '/' },
  ],
  Hüquqi: [
    { label: 'İstifadə qaydaları', href: '/' },
    { label: 'Məxfilik siyasəti', href: '/' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                <Car size={16} className="text-white" />
              </div>
              <span className="text-lg font-extrabold">
                Yol<span className="text-brand-600">üstü</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed max-w-xs">
              Azərbaycan üzrə şəhərlərarası gedişləri tap, paylaş, ucuz və rahat səyahət et.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-text mb-3">{title}</h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-brand-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} Yolüstü. Bütün hüquqlar qorunur.
          </p>
          <p className="text-xs text-text-muted">
            Bakı, Azərbaycan 🇦🇿
          </p>
        </div>
      </div>
    </footer>
  );
}
