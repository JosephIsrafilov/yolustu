'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { validateEmail, validatePassword, validatePhone } from '@/lib/mock-api';
import { User, Mail, Phone, Lock, Car } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">Yol<span className="text-brand-600">üstü</span></span>
          </div>
          <h1 className="text-2xl font-bold text-text mb-1 text-center">Qeydiyyat</h1>
          <p className="text-sm text-text-muted mb-6 text-center">Hesab yaradın və gedişlərə qoşulun</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Ad və Soyad" placeholder="Məs: Elvin Məmmədov" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} error={errors.fullName} icon={<User size={16} />} />
            <Input label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} icon={<Mail size={16} />} />
            <Input label="Telefon" placeholder="+994501234567" value={form.phone} onChange={(e) => update('phone', e.target.value)} error={errors.phone} icon={<Phone size={16} />} />
            <Input label="Şifrə" type="password" placeholder="Ən azı 6 simvol" value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} icon={<Lock size={16} />} />
            <Input label="Şifrəni təsdiqləyin" type="password" placeholder="Şifrəni təkrar daxil edin" value={form.confirm} onChange={(e) => update('confirm', e.target.value)} error={errors.confirm} icon={<Lock size={16} />} />
            <Button type="submit" fullWidth size="lg" loading={loading}>Qeydiyyatdan keç</Button>
          </form>
          <p className="text-sm text-text-muted text-center mt-6">
            Artıq hesabınız var?{' '}
            <Link href={ROUTES.login} className="text-brand-600 font-semibold hover:underline">Daxil olun</Link>
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
