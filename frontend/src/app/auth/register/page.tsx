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
import PhoneInput from '@/components/auth/PhoneInput';
import {
  AZERBAIJAN_PHONE_PREFIX,
  isValidAzerbaijaniPhone,
  normalizeAzerbaijaniPhone,
} from '@/lib/azerbaijani-phone';

export default function RegisterPage() {
  const router = useRouter();
  const register = useAppStore((s) => s.register);
  const language = useAppStore((s) => s.language);
  const copy = I18N[language];

  const [form, setForm] = useState({
    fullName: '',
    phone: AZERBAIJAN_PHONE_PREFIX,
    email: '',
    password: '',
    confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const phoneErrorText = language === 'az'
    ? 'Mobil nömrə düzgün deyil'
    : language === 'ru'
      ? 'Номер телефона указан неверно'
      : 'Phone number is invalid';

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.fullName.trim()) nextErrors.fullName = copy.auth.fullNameError;
    if (!isValidAzerbaijaniPhone(form.phone)) nextErrors.phone = phoneErrorText;
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      nextErrors.email = language === 'az' ? 'Düzgün email daxil edin' : language === 'ru' ? 'Введите правильный email' : 'Enter a valid email';
    }
    if (form.password.length < 8) {
      nextErrors.password = language === 'az' ? 'Ən azı 8 simvol' : language === 'ru' ? 'Минимум 8 символов' : 'Minimum 8 characters';
    }
    if (form.password !== form.confirm) {
      nextErrors.confirm = language === 'az' ? 'Şifrələr uyğun gəlmir' : language === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const normalizedPhone = normalizeAzerbaijaniPhone(form.phone);

    setLoading(true);
    setSubmitError('');

    try {
      const ok = await register({
        fullName: form.fullName,
        phone: normalizedPhone,
        email: form.email,
        password: form.password,
      });
      setLoading(false);

      if (ok) {
        router.push(ROUTES.profileSetup);
      } else {
        setSubmitError(useAppStore.getState().lastError || copy.common.error);
      }
    } catch {
      setLoading(false);
      setSubmitError(copy.common.error);
    }
  };

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const fields: { key: string; label: string; icon: IconName; placeholder: string; type: string }[] = [
    { key: 'fullName', label: copy.auth.fullNameLabel, icon: 'user', placeholder: copy.auth.fullNamePlaceholder, type: 'text' },
    { key: 'phone', label: copy.auth.phoneLabel, icon: 'phone', placeholder: copy.auth.phonePlaceholder, type: 'tel' },
    { key: 'email', label: 'Email', icon: 'mail', placeholder: 'nadir@example.com', type: 'email' },
    { key: 'password', label: copy.auth.passwordLabel, icon: 'lock', placeholder: language === 'az' ? 'Ən azı 8 simvol' : language === 'ru' ? 'Минимум 8 символов' : 'Minimum 8 characters', type: 'password' },
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
            {fields.map((field) => {
              const isPassword = field.key === 'password' || field.key === 'confirm';
              const show = field.key === 'password' ? showPassword : showConfirm;
              const inputType = isPassword ? (show ? 'text' : 'password') : field.type;

              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  {field.key === 'phone' ? (
                    <PhoneInput
                      label={field.label}
                      value={form.phone}
                      onChange={(nextPhone) => update('phone', nextPhone)}
                      error={errors.phone}
                    />
                  ) : (
                    <>
                      <label className="text-[14px] font-semibold text-[#011f23]">{field.label}</label>
                      <div className="relative">
                        <Icon name={field.icon} size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                        <input
                          type={inputType}
                          placeholder={field.placeholder}
                          value={(form as Record<string, string>)[field.key]}
                          onChange={(event) => update(field.key, event.target.value)}
                          className={`w-full pl-11 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all ${isPassword ? 'pr-12' : 'pr-4'}`}
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() => field.key === 'password' ? setShowPassword(!showPassword) : setShowConfirm(!showConfirm)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#70787b] hover:text-[#054752] transition-colors"
                          >
                            <Icon name={show ? 'eye-off' : 'eye'} size={18} />
                          </button>
                        )}
                      </div>
                      {errors[field.key] && <p className="text-[12px] text-[#ba1a1a]">{errors[field.key]}</p>}
                    </>
                  )}
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
