'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { validateEmail, validatePassword, validatePhone } from '@/lib/mock-api';
import { User, Mail, Phone, Lock, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAppStore((s) => s.register);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Ad tələb olunur';
    if (!validateEmail(form.email)) e.email = 'Düzgün email daxil edin';
    if (!validatePhone(form.phone) && form.phone.length < 10) e.phone = 'Düzgün telefon nömrəsi';
    if (!validatePassword(form.password)) e.password = 'Ən azı 6 simvol';
    if (form.password !== form.confirm) e.confirm = 'Şifrələr uyğun gəlmir';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password });
    router.push(ROUTES.profileSetup);
  };

  const update = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const fields: { key: string; label: string; icon: React.ElementType; placeholder: string; type: string }[] = [
    { key: 'fullName', label: 'Ad və Soyad', icon: User, placeholder: 'Məs: Elvin Məmmədov', type: 'text' },
    { key: 'email', label: 'Email', icon: Mail, placeholder: 'email@example.com', type: 'email' },
    { key: 'phone', label: 'Telefon', icon: Phone, placeholder: '+994501234567', type: 'tel' },
    { key: 'password', label: 'Şifrə', icon: Lock, placeholder: 'Ən azı 6 simvol', type: 'password' },
    { key: 'confirm', label: 'Şifrəni təsdiqləyin', icon: Lock, placeholder: 'Təkrar daxil edin', type: 'password' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#edfcff' }}>
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-[#c0c8ca]" style={{ boxShadow: '0 8px 32px rgba(5,71,82,0.08)' }}>
          <div className="text-center mb-6">
            <span className="text-[24px] font-[900] text-[#002f37]">YolUstu</span>
          </div>
          <h1 className="text-[24px] font-semibold text-[#002f37] text-center mb-1">Qeydiyyat</h1>
          <p className="text-[14px] text-[#40484a] text-center mb-6">Hesab yaradın və gedişlərə qoşulun</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#011f23]">{f.label}</label>
                  <div className="relative">
                    <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                    <input type={f.type} placeholder={f.placeholder}
                      value={(form as Record<string, string>)[f.key]}
                      onChange={(e) => update(f.key, e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" />
                  </div>
                  {errors[f.key] && <p className="text-[12px] text-[#ba1a1a]">{errors[f.key]}</p>}
                </div>
              );
            })}

            <button type="submit" disabled={loading}
              className="w-full bg-[#7ED321] text-white font-semibold text-[16px] py-3.5 rounded-xl hover:bg-[#6bc01a] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ boxShadow: '0 2px 8px rgba(126,211,33,0.3)' }}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> Yüklənir...</> : 'Qeydiyyatdan keç'}
            </button>
          </form>

          <p className="text-[14px] text-[#40484a] text-center mt-6">
            Artıq hesabınız var?{' '}
            <Link href={ROUTES.login} className="text-[#054752] font-semibold hover:underline">Daxil olun</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
