'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { validateEmail, validatePassword, validatePhone } from '@/lib/mock-api';

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
    if (!validatePhone(form.phone) && form.phone.length < 10) e.phone = 'Düzgün telefon nömrəsi daxil edin';
    if (!validatePassword(form.password)) e.password = 'Ən azı 6 simvol olmalıdır';
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

  const fields = [
    { key: 'fullName', label: 'Ad və Soyad', icon: 'person', placeholder: 'Məs: Elvin Məmmədov', type: 'text' },
    { key: 'email', label: 'Email', icon: 'mail', placeholder: 'email@example.com', type: 'email' },
    { key: 'phone', label: 'Telefon', icon: 'phone', placeholder: '+994501234567', type: 'tel' },
    { key: 'password', label: 'Şifrə', icon: 'lock', placeholder: 'Ən azı 6 simvol', type: 'password' },
    { key: 'confirm', label: 'Şifrəni təsdiqləyin', icon: 'lock', placeholder: 'Şifrəni təkrar daxil edin', type: 'password' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant w-full max-w-md p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl font-black text-primary">YolUstu</span>
          </div>

          <h1 className="text-2xl font-semibold text-primary text-center mb-1">Qeydiyyat</h1>
          <p className="text-sm text-on-surface-variant text-center mb-6">Hesab yaradın və gedişlərə qoşulun</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-on-surface">{f.label}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">{f.icon}</span>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary-container focus:ring-1 focus:ring-primary-container text-base bg-surface-container-lowest"
                  />
                </div>
                {errors[f.key] && <p className="text-xs text-error">{errors[f.key]}</p>}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-action text-on-primary font-semibold text-lg py-3 rounded-lg hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              {loading ? 'Yüklənir...' : 'Qeydiyyatdan keç'}
            </button>
          </form>

          <p className="text-sm text-on-surface-variant text-center mt-6">
            Artıq hesabınız var?{' '}
            <Link href={ROUTES.login} className="text-primary-container font-semibold hover:underline">
              Daxil olun
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
