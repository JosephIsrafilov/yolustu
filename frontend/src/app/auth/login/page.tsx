'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { toApiError } from '@/services/api-error';
import { I18N } from '@/lib/i18n';
import YolmatesLogo from '@/components/brand/YolmatesLogo';
import PhoneInput from '@/components/auth/PhoneInput';
import {
  AZERBAIJAN_PHONE_PREFIX,
  isValidAzerbaijaniPhone,
  normalizeAzerbaijaniPhone,
} from '@/lib/azerbaijani-phone';

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const language = useAppStore((s) => s.language);
  const copy = I18N[language];

  const [phone, setPhone] = useState(AZERBAIJAN_PHONE_PREFIX);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const phoneErrorText = language === 'az'
    ? 'Mobil nömrə düzgün deyil'
    : language === 'ru'
      ? 'Номер телефона указан неверно'
      : 'Phone number is invalid';

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!isValidAzerbaijaniPhone(phone)) nextErrors.phone = phoneErrorText;
    if (!password) nextErrors.password = copy.auth.passwordError;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const normalizedPhone = normalizeAzerbaijaniPhone(phone);

    setLoading(true);
    setSubmitError('');

    try {
      const ok = await login(normalizedPhone, password);
      setLoading(false);

      if (ok) {
        const loggedInUser = useAppStore.getState().currentUser;
        router.push(loggedInUser?.role === 'admin' ? ROUTES.admin : ROUTES.search);
        return;
      }

      const lastError = useAppStore.getState().lastError;
      setSubmitError(lastError || copy.auth.loginFail);
    } catch (error) {
      const apiError = toApiError(error);
      setLoading(false);
      setSubmitError(apiError.message || copy.common.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#edfcff' }}>
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-[#c0c8ca]" style={{ boxShadow: '0 8px 32px rgba(5,71,82,0.08)' }}>
          <div className="text-center mb-6">
            <YolmatesLogo size="lg" href="" className="justify-center" />
          </div>

          <h1 className="text-[24px] font-semibold text-[#002f37] text-center mb-1">{copy.auth.loginTitle}</h1>
          <p className="text-[14px] text-[#40484a] text-center mb-6">{copy.auth.loginSubtitle}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <PhoneInput
              label={copy.auth.phoneLabel}
              value={phone}
              onChange={(nextPhone) => {
                setPhone(nextPhone);
                if (errors.phone) setErrors((prev) => { const next = { ...prev }; delete next.phone; return next; });
              }}
              error={errors.phone}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-[#011f23]">{copy.auth.passwordLabel}</label>
              <div className="relative">
                <Icon name="lock" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={copy.auth.passwordPlaceholder}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errors.password) setErrors((prev) => { const next = { ...prev }; delete next.password; return next; });
                  }}
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#70787b] hover:text-[#054752] transition-colors"
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
                </button>
              </div>
              {errors.password && <p className="text-[12px] text-[#ba1a1a]">{errors.password}</p>}
            </div>

            <div className="flex justify-end -mt-2 mb-1">
              <Link href={ROUTES.passwordReset} className="text-[13px] text-[#054752] font-semibold hover:underline">
                {language === 'az' ? 'Şifrəni unutmusunuz?' : language === 'ru' ? 'Забыли пароль?' : 'Forgot Password?'}
              </Link>
            </div>

            {submitError && (
              <div className="rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-[13px] font-medium text-[#93000a]">
                {submitError}
              </div>
            )}

            <Button type="submit" size="lg" fullWidth loading={loading} className="text-[16px]">
              {loading ? copy.auth.loggingIn : copy.auth.loginBtn}
            </Button>
          </form>

          <p className="text-[14px] text-[#40484a] text-center mt-6">
            {copy.auth.noAccount}{' '}
            <Link href={ROUTES.register} className="text-[#054752] font-semibold hover:underline">{copy.auth.registerLink}</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
