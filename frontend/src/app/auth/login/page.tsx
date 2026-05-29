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

export default function LoginPage() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const language = useAppStore((s) => s.language);
  const copy = I18N[language];
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!phone) e.phone = copy.auth.phoneError;
    if (!password) e.password = copy.auth.passwordError;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const ok = await login(phone, password);
      setLoading(false);
      if (ok) {
        const loggedInUser = useAppStore.getState().currentUser;
        router.push(loggedInUser?.role === 'admin' ? ROUTES.admin : ROUTES.search);
        return;
      }
      
      const lastError = useAppStore.getState().lastError;
      if (lastError && lastError.toLowerCase().includes('verify')) {
        router.push(`/auth/verify?phone=${encodeURIComponent(phone)}`);
      } else {
        setSubmitError(lastError || copy.auth.loginFail);
      }
    } catch (err) {
      const error = toApiError(err);
      setLoading(false);
      setSubmitError(error.message || copy.common.error);
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
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-[#011f23]">{copy.auth.phoneLabel}</label>
              <div className="relative">
                <Icon name="phone" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <input 
                  type="text" 
                  placeholder={copy.auth.phonePlaceholder} 
                  value={phone}
                  onChange={(e) => { 
                    setPhone(e.target.value); 
                    if (errors.phone) setErrors((p) => { const n = { ...p }; delete n.phone; return n; }); 
                  }}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" 
                />
              </div>
              {errors.phone && <p className="text-[12px] text-[#ba1a1a]">{errors.phone}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-semibold text-[#011f23]">{copy.auth.passwordLabel}</label>
              <div className="relative">
                <Icon name="lock" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder={copy.auth.passwordPlaceholder} 
                  value={password}
                  onChange={(e) => { 
                    setPassword(e.target.value); 
                    if (errors.password) setErrors((p) => { const n = { ...p }; delete n.password; return n; }); 
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
              <Link href={ROUTES.forgotPassword} className="text-[13px] text-[#054752] font-semibold hover:underline">
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
