'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import Icon, { type IconName } from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { I18N } from '@/lib/i18n';
import YolmatesLogo from '@/components/brand/YolmatesLogo';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAppStore((s) => s.register);
  const language = useAppStore((s) => s.language);
  const copy = I18N[language];

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = copy.auth.fullNameError;
    if (!form.phone.trim()) {
      e.phone = copy.auth.phoneError;
    } else if (!/^\+?[0-9]{10,15}$/.test(form.phone.replace(/\s/g, ''))) {
      e.phone = language === 'az' ? 'Düzgün telefon nömrəsi daxil edin' : language === 'ru' ? 'Введите правильный номер телефона' : 'Enter a valid phone number';
    }
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      e.email = language === 'az' ? 'Düzgün email daxil edin' : language === 'ru' ? 'Введите правильный email' : 'Enter a valid email';
    }
    if (form.password.length < 6) e.password = language === 'az' ? 'Ən azı 6 simvol' : language === 'ru' ? 'Минимум 6 символов' : 'Minimum 6 characters';
    if (form.password !== form.confirm) e.confirm = language === 'az' ? 'Şifrələr uyğun gəlmir' : language === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const ok = await register({ 
        fullName: form.fullName, 
        phone: form.phone, 
        email: form.email,
        password: form.password 
      });
      setLoading(false);
      if (ok) {
        router.push(`/auth/verify?phone=${encodeURIComponent(form.phone)}&from=register`);
      } else {
        setSubmitError(useAppStore.getState().lastError || copy.common.error);
      }
    } catch {
      setLoading(false);
      setSubmitError(copy.common.error);
    }
  };

  const update = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const fields: { key: string; label: string; icon: IconName; placeholder: string; type: string }[] = [
    { key: 'fullName', label: copy.auth.fullNameLabel, icon: 'user', placeholder: copy.auth.fullNamePlaceholder, type: 'text' },
    { key: 'phone', label: copy.auth.phoneLabel, icon: 'phone', placeholder: copy.auth.phonePlaceholder, type: 'tel' },
    { key: 'email', label: 'Email', icon: 'mail', placeholder: 'nadir@example.com', type: 'email' },
    { key: 'password', label: copy.auth.passwordLabel, icon: 'lock', placeholder: language === 'az' ? 'Ən azı 6 simvol' : language === 'ru' ? 'Минимум 6 символов' : 'Minimum 6 characters', type: 'password' },
    { key: 'confirm', label: language === 'az' ? 'Şifrəni təsdiqləyin' : language === 'ru' ? 'Подтвердите пароль' : 'Confirm password', icon: 'lock', placeholder: language === 'az' ? 'Təkrar daxil edin' : language === 'ru' ? 'Повторите пароль' : 'Confirm password', type: 'password' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#edfcff' }}>
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-[#c0c8ca]" style={{ boxShadow: '0 8px 32px rgba(5,71,82,0.08)' }}>
          <div className="text-center mb-6">
            <YolmatesLogo size="lg" href="" className="justify-center" />
          </div>
          <h1 className="text-[24px] font-semibold text-[#002f37] text-center mb-1">{copy.auth.registerTitle}</h1>
          <p className="text-[14px] text-[#40484a] text-center mb-6">{language === 'az' ? 'Hesab yaradın və gedişlərə qoşulun' : language === 'ru' ? 'Создайте аккаунт и присоединяйтесь к поездкам' : 'Create an account and join rides'}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map((f) => {
              const isPassword = f.key === 'password' || f.key === 'confirm';
              const show = f.key === 'password' ? showPassword : showConfirm;
              const inputType = isPassword ? (show ? 'text' : 'password') : f.type;
              
              return (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#011f23]">{f.label}</label>
                  <div className="relative">
                    <Icon name={f.icon} size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                    <input 
                      type={inputType} 
                      placeholder={f.placeholder}
                      value={(form as Record<string, string>)[f.key]}
                      onChange={(e) => update(f.key, e.target.value)}
                      className={`w-full pl-11 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all ${isPassword ? 'pr-12' : 'pr-4'}`} 
                    />
                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => f.key === 'password' ? setShowPassword(!showPassword) : setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#70787b] hover:text-[#054752] transition-colors"
                      >
                        <Icon name={show ? 'eye-off' : 'eye'} size={18} />
                      </button>
                    )}
                  </div>
                  {errors[f.key] && <p className="text-[12px] text-[#ba1a1a]">{errors[f.key]}</p>}
                </div>
              );
            })}

            {submitError && (
              <div className="rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-[13px] font-medium text-[#93000a]">
                {submitError}
              </div>
            )}

            <Button type="submit" size="lg" fullWidth loading={loading} className="text-[16px]">
              {loading ? copy.auth.registering : copy.auth.registerBtn}
            </Button>
          </form>

          <p className="text-[14px] text-[#40484a] text-center mt-6">
            {copy.auth.hasAccount}{' '}
            <Link href={ROUTES.login} className="text-[#054752] font-semibold hover:underline">{copy.auth.loginLink}</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
