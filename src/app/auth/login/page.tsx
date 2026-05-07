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
import { Mail, Lock, Car } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Bütün sahələri doldurun'); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const ok = login(email, password);
    setLoading(false);
    if (ok) { router.push(ROUTES.search); }
    else { setError('İstifadəçi tapılmadı. Demo: elvin@example.com'); }
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
          <h1 className="text-2xl font-bold text-text mb-1 text-center">Daxil ol</h1>
          <p className="text-sm text-text-muted mb-6 text-center">Hesabınıza daxil olun</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={16} />} />
            <Input label="Şifrə" type="password" placeholder="Şifrənizi daxil edin" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={16} />} />
            {error && <p className="text-sm text-danger-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <Button type="submit" fullWidth size="lg" loading={loading}>Daxil ol</Button>
          </form>
          <div className="mt-6 p-3 bg-brand-50 rounded-xl">
            <p className="text-xs font-medium text-brand-700 mb-1">Demo istifadəçilər:</p>
            <p className="text-xs text-brand-600">Sürücü: elvin@example.com</p>
            <p className="text-xs text-brand-600">Sərnişin: aysel@example.com</p>
            <p className="text-xs text-brand-600">Admin: sanan@example.com</p>
            <p className="text-[10px] text-brand-400 mt-1">Şifrə: istənilən (mock)</p>
          </div>
          <p className="text-sm text-text-muted text-center mt-6">
            Hesabınız yoxdur?{' '}
            <Link href={ROUTES.register} className="text-brand-600 font-semibold hover:underline">Qeydiyyat</Link>
          </p>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
