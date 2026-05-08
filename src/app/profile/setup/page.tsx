'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { AZ_CITIES } from '@/lib/utils';
import Icon from '@/components/ui/Icon';

export default function ProfileSetupPage() {
  const router = useRouter();
  const { currentUser, updateProfile } = useAppStore();
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    city: currentUser?.city || '',
    bio: currentUser?.bio || '',
  });

  const handleSave = () => {
    updateProfile(form);
    router.push(ROUTES.search);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold text-text mb-1 text-center">Profil qurulması</h1>
          <p className="text-sm text-text-muted mb-6 text-center">Məlumatlarınızı tamamlayın</p>
          <div className="flex flex-col gap-4">
            <Input label="Ad və Soyad" value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} icon={<Icon name="user" size={16} />} />
            <Input label="Telefon" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Şəhər</label>
              <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Şəhər seçin</option>
                {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text">Haqqımda (ixtiyari)</label>
              <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Bir neçə cümlə ilə özünüz haqqında yazın..." className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            </div>
            <Button fullWidth size="lg" onClick={handleSave}>Yadda saxla</Button>
            <Button fullWidth size="lg" variant="ghost" onClick={() => router.push(ROUTES.search)}>Sonra tamamla</Button>
          </div>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
