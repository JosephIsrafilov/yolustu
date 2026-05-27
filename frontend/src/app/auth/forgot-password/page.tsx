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
import { I18N } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const requestPasswordReset = useAppStore((s) => s.requestPasswordReset);
  const resetPassword = useAppStore((s) => s.resetPassword);
  const clearError = useAppStore((s) => s.clearError);
  const language = useAppStore((s) => s.language);
  
  // Create a minimal copy for what we need if it's missing in I18N
  const copy = I18N[language];
  const t = copy.auth;
  
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) {
      e.email = (t as Record<string, string>).emailError || 'Email required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = (t as Record<string, string>).emailError || 'Invalid email format';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (otp.length !== 6) e.otp = language === 'az' ? '6 rəqəmli kod daxil edin' : language === 'ru' ? 'Введите 6-значный код' : 'Enter 6-digit code';
    if (newPassword.length < 6) e.newPassword = language === 'az' ? 'Ən azı 6 simvol' : language === 'ru' ? 'Минимум 6 символов' : 'Minimum 6 characters';
    if (newPassword !== confirmPassword) e.confirmPassword = language === 'az' ? 'Şifrələr uyğun gəlmir' : language === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRequestOtp = async (ev: React.FormEvent) => {
    ev.preventDefault();
    clearError();
    if (!validateStep1()) return;
    setLoading(true);
    setSubmitError('');
    
    const ok = await requestPasswordReset(email);
    setLoading(false);
    
    if (ok) {
      setStep(2);
    } else {
      setSubmitError(useAppStore.getState().lastError || copy.common.error);
    }
  };

  const handleResetPassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    clearError();
    if (!validateStep2()) return;
    setLoading(true);
    setSubmitError('');
    
    const ok = await resetPassword(email, otp, newPassword);
    setLoading(false);
    
    if (ok) {
      setSuccessMsg(language === 'az' ? 'Şifrəniz uğurla yeniləndi!' : language === 'ru' ? 'Ваш пароль успешно обновлен!' : 'Your password has been successfully reset!');
      setTimeout(() => {
        router.push(ROUTES.login);
      }, 2000);
    } else {
      setSubmitError(useAppStore.getState().lastError || copy.common.error);
    }
  };

  const title = step === 1 
    ? (language === 'az' ? 'Şifrənin bərpası' : language === 'ru' ? 'Восстановление пароля' : 'Reset Password')
    : (language === 'az' ? 'Yeni şifrə təyin edin' : language === 'ru' ? 'Установите новый пароль' : 'Set New Password');

  const subtitle = step === 1
    ? (language === 'az' ? 'Hesabınıza bağlı email ünvanını daxil edin' : language === 'ru' ? 'Введите адрес электронной почты, привязанный к вашему аккаунту' : 'Enter the email address associated with your account')
    : (language === 'az' ? 'Emaile göndərilmiş 6 rəqəmli kodu və yeni şifrəni daxil edin' : language === 'ru' ? 'Введите 6-значный код, отправленный на email, и новый пароль' : 'Enter the 6-digit code sent to your email and your new password');

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#edfcff' }}>
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-[#c0c8ca]" style={{ boxShadow: '0 8px 32px rgba(5,71,82,0.08)' }}>
          <div className="text-center mb-6">
            <span className="text-[24px] font-[900] text-[#002f37]">Yolmates</span>
          </div>
          
          <h1 className="text-[24px] font-semibold text-[#002f37] text-center mb-1">{title}</h1>
          <p className="text-[14px] text-[#40484a] text-center mb-6">{subtitle}</p>

          {successMsg ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#054752]/10 text-[#054752] rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check" size={32} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#011f23] mb-2">{successMsg}</h3>
              <p className="text-[14px] text-[#40484a] mb-6">
                {language === 'az' ? 'Giriş səhifəsinə yönləndirilirsiniz...' : language === 'ru' ? 'Перенаправление на страницу входа...' : 'Redirecting to login page...'}
              </p>
            </div>
          ) : (
            <form onSubmit={step === 1 ? handleRequestOtp : handleResetPassword} className="flex flex-col gap-4">
              
              {step === 1 ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-semibold text-[#011f23]">{(t as Record<string, string>).emailLabel || 'Email'}</label>
                  <div className="relative">
                    <Icon name="mail" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                    <input 
                      type="email" 
                      placeholder={(t as Record<string, string>).emailPlaceholder || 'Email ünvanı'} 
                      value={email}
                      onChange={(e) => { 
                        setEmail(e.target.value); 
                        if (errors.email) setErrors((p) => { const n = { ...p }; delete n.email; return n; }); 
                      }}
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" 
                    />
                  </div>
                  {errors.email && <p className="text-[12px] text-[#ba1a1a]">{errors.email}</p>}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-semibold text-[#011f23]">
                      {language === 'az' ? 'Təsdiq kodu' : language === 'ru' ? 'Код подтверждения' : 'Verification code'}
                    </label>
                    <div className="relative">
                      <Icon name="mail" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                      <input 
                        type="text" 
                        placeholder="123456" 
                        value={otp}
                        maxLength={6}
                        onChange={(e) => { 
                          setOtp(e.target.value.replace(/\D/g, '')); 
                          if (errors.otp) setErrors((p) => { const n = { ...p }; delete n.otp; return n; }); 
                        }}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" 
                      />
                    </div>
                    {errors.otp && <p className="text-[12px] text-[#ba1a1a]">{errors.otp}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-semibold text-[#011f23]">{t.passwordLabel || 'Şifrə'}</label>
                    <div className="relative">
                      <Icon name="lock" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                      <input 
                        type={showNewPassword ? "text" : "password"} 
                        placeholder={language === 'az' ? 'Yeni şifrə' : language === 'ru' ? 'Новый пароль' : 'New password'} 
                        value={newPassword}
                        onChange={(e) => { 
                          setNewPassword(e.target.value); 
                          if (errors.newPassword) setErrors((p) => { const n = { ...p }; delete n.newPassword; return n; }); 
                        }}
                        className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#70787b] hover:text-[#054752] transition-colors"
                      >
                        <Icon name={showNewPassword ? 'eye-off' : 'eye'} size={18} />
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-[12px] text-[#ba1a1a]">{errors.newPassword}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-semibold text-[#011f23]">
                      {language === 'az' ? 'Şifrəni təsdiqləyin' : language === 'ru' ? 'Подтвердите пароль' : 'Confirm password'}
                    </label>
                    <div className="relative">
                      <Icon name="lock" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
                      <input 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder={language === 'az' ? 'Təkrar daxil edin' : language === 'ru' ? 'Повторите пароль' : 'Confirm password'} 
                        value={confirmPassword}
                        onChange={(e) => { 
                          setConfirmPassword(e.target.value); 
                          if (errors.confirmPassword) setErrors((p) => { const n = { ...p }; delete n.confirmPassword; return n; }); 
                        }}
                        className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[16px] text-[#011f23] bg-white outline-none transition-all" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#70787b] hover:text-[#054752] transition-colors"
                      >
                        <Icon name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} />
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-[12px] text-[#ba1a1a]">{errors.confirmPassword}</p>}
                  </div>
                </>
              )}

              {submitError && (
                <div className="rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-[13px] font-medium text-[#93000a]">
                  {submitError}
                </div>
              )}

              <Button type="submit" size="lg" fullWidth loading={loading} className="text-[16px] mt-2">
                {step === 1 
                  ? (language === 'az' ? 'Kodu göndər' : language === 'ru' ? 'Отправить код' : 'Send code')
                  : (language === 'az' ? 'Şifrəni yenilə' : language === 'ru' ? 'Обновить пароль' : 'Update password')
                }
              </Button>
            </form>
          )}

          <div className="flex justify-center mt-6">
            <Link href={ROUTES.login} className="text-[14px] text-[#054752] font-semibold hover:underline flex items-center gap-1.5">
              <Icon name="arrow-left" size={16} />
              {language === 'az' ? 'Giriş səhifəsinə qayıt' : language === 'ru' ? 'Вернуться к входу' : 'Back to login'}
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
