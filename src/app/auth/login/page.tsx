'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { validateEmail, validatePassword } from '@/lib/mock-api';
import Icon from '@/components/ui/Icon';

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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#edfcff' }}>
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-[#c0c8ca]" style={{ boxShadow: '0 8px 32px rgba(5,71,82,0.08)' }}>
          <div className="text-center mb-6">
            <span className="text-[24px] font-[900] text-[#002f37]">YolUstu</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[#002f37] text-center mb-1">Daxil ol</h1>
          <p className="text-[14px] text-[#40484a] text-center mb-6">Hesabınıza daxil olun</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-[#011f23]">Email</label>
              <div className="relative">
                <Icon name="mail" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <input type="email" placeholder="email@example.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => { const n = { ...p }; delete n.email; return n; }); }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" />
              </div>
              {errors.email && <p className="text-[12px] text-[#ba1a1a]">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-[#011f23]">Şifrə</label>
              <div className="relative">
                <Icon name="lock" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <input type="password" placeholder="Ən azı 6 simvol" value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => { const n = { ...p }; delete n.password; return n; }); }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" />
              </div>
              {errors.password && <p className="text-[12px] text-[#ba1a1a]">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-[#7ED321] text-white font-semibold text-[16px] py-3.5 rounded-xl hover:bg-[#6bc01a] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ boxShadow: '0 2px 8px rgba(126,211,33,0.3)' }}>
              {loading ? <><Icon name="loader-2" size={18} className="animate-spin" /> Yüklənir...</> : 'Daxil ol'}
            </button>
          </form>

          <p className="text-[14px] text-[#40484a] text-center mt-6">
            Hesabınız yoxdur?{' '}
            <Link href={ROUTES.register} className="text-[#054752] font-semibold hover:underline">Qeydiyyatdan keçin</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
