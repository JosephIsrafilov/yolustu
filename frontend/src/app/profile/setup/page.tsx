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
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const SETUP_I18N = {
  az: {
    title: 'Profil qurulması',
    subtitle: 'Məlumatlarınızı tamamlayın',
    fullNameLabel: 'Ad və Soyad',
    phoneLabel: 'Telefon',
    cityLabel: 'Şəhər',
    citySelect: 'Şəhər seçin',
    bioLabel: 'Haqqımda (ixtiyari)',
    bioPlaceholder: 'Bir neçə cümlə ilə özünüz haqqında yazın...',
    saveBtn: 'Yadda saxla',
    skipBtn: 'Sonra tamamla',
  },
  ru: {
    title: 'Настройка профиля',
    subtitle: 'Заполните ваши данные',
    fullNameLabel: 'Имя и Фамилия',
    phoneLabel: 'Телефон',
    cityLabel: 'Город',
    citySelect: 'Выберите город',
    bioLabel: 'О себе (опционально)',
    bioPlaceholder: 'Напишите о себе в нескольких предложениях...',
    saveBtn: 'Сохранить',
    skipBtn: 'Пропустить',
  },
  en: {
    title: 'Profile Setup',
    subtitle: 'Complete your profile details',
    fullNameLabel: 'Full Name',
    phoneLabel: 'Phone Number',
    cityLabel: 'City',
    citySelect: 'Select city',
    bioLabel: 'About me (optional)',
    bioPlaceholder: 'Write a few sentences about yourself...',
    saveBtn: 'Save Changes',
    skipBtn: 'Skip for now',
  },
};

export default function ProfileSetupPage() {
  const router = useRouter();
  const { currentUser, updateProfile, clearError, lastError, language } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({
    fullName: currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    city: currentUser?.city || '',
    bio: currentUser?.bio || '',
  });

  const copy = SETUP_I18N[language] || SETUP_I18N.en;

  const handleSave = async () => {
    setSaving(true);
    setSubmitError('');
    clearError();
    try {
      await updateProfile(form);
      router.push(ROUTES.search);
    } catch {
      setSubmitError(useAppStore.getState().lastError || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-dim">
      <Header />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <ProtectedRoute>
          <Card className="w-full max-w-md p-8">
            <h1 className="text-2xl font-bold text-text mb-1 text-center">{copy.title}</h1>
            <p className="text-sm text-text-muted mb-6 text-center">{copy.subtitle}</p>
            <div className="flex flex-col gap-4">
              <Input label={copy.fullNameLabel} value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} icon={<Icon name="user" size={16} />} />
              <Input label={copy.phoneLabel} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">{copy.cityLabel}</label>
                <select value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">{copy.citySelect}</option>
                  {AZ_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">{copy.bioLabel}</label>
                <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} placeholder={copy.bioPlaceholder} className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
              {(submitError || lastError) && (
                <div className="rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-sm font-medium text-[#93000a]">
                  {submitError || lastError}
                </div>
              )}
              <Button fullWidth size="lg" onClick={handleSave} loading={saving}>{copy.saveBtn}</Button>
              <Button fullWidth size="lg" variant="ghost" onClick={() => router.push(ROUTES.search)} disabled={saving}>{copy.skipBtn}</Button>
            </div>
          </Card>
        </ProtectedRoute>
      </div>
      <Footer />
    </div>
  );
}
