'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { validateEmail, validatePassword } from '@/lib/mock-api';

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!validateEmail(email)) e.email = 'Düzgün email daxil edin';
    if (!validatePassword(password)) e.password = 'Ən azı 6 simvol';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    login(email, password);
    router.push(ROUTES.search);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant w-full max-w-md p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl font-black text-primary">YolUstu</span>
          </div>

          <h1 className="text-2xl font-semibold text-primary text-center mb-1">Daxil ol</h1>
          <p className="text-sm text-on-surface-variant text-center mb-6">Hesabınıza daxil olun</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">mail</span>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => { const n = { ...p }; delete n.email; return n; }); }}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container text-base bg-surface-container-lowest"
                />
              </div>
              {errors.email && <p className="text-xs text-error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-on-surface">Şifrə</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                <input
                  type="password"
                  placeholder="Ən azı 6 simvol"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => { const n = { ...p }; delete n.password; return n; }); }}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container text-base bg-surface-container-lowest"
                />
              </div>
              {errors.password && <p className="text-xs text-error">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-action text-on-primary font-semibold text-lg py-3 rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              {loading ? 'Yüklənir...' : 'Daxil ol'}
            </button>
          </form>

          <p className="text-sm text-on-surface-variant text-center mt-6">
            Hesabınız yoxdur?{' '}
            <Link href={ROUTES.register} className="text-primary-container font-semibold hover:underline">
              Qeydiyyatdan keçin
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
