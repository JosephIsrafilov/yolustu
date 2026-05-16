'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { toApiError } from '@/services/api-error';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') || '';
  
  const verifyAccount = useAppStore((s) => s.verifyAccount);
  const requestOtp = useAppStore((s) => s.requestOtp);
  
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!otp) e.otp = 'Kodu daxil edin';
    if (otp && otp.length !== 6) e.otp = 'Kod 6 rəqəmli olmalıdır';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleVerify = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError('');
    try {
      const ok = await verifyAccount(phone, otp);
      setLoading(false);
      if (ok) {
        setSuccessMessage('Hesabınız təsdiqləndi! İndi daxil ola bilərsiniz.');
        setTimeout(() => router.push(ROUTES.login), 2000);
        return;
      }
      setSubmitError(useAppStore.getState().lastError || 'Kod yanlışdır.');
    } catch (err) {
      const error = toApiError(err);
      setLoading(false);
      setSubmitError(error.message || 'Xəta baş verdi');
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setSubmitError('');
    setSuccessMessage('');
    try {
      const ok = await requestOtp(phone);
      setLoading(false);
      if (ok) {
        setSuccessMessage('Yeni kod göndərildi.');
      }
    } catch {
      setLoading(false);
      setSubmitError('Kodu təkrar göndərmək mümkün olmadı.');
    }
  };

  return (
    <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-[#c0c8ca]" style={{ boxShadow: '0 8px 32px rgba(5,71,82,0.08)' }}>
      <div className="text-center mb-6">
        <span className="text-[24px] font-[900] text-[#002f37]">Yolüstü</span>
      </div>
      
      <h1 className="text-[24px] font-semibold text-[#002f37] text-center mb-1">Hesabı təsdiqlə</h1>
      <p className="text-[14px] text-[#40484a] text-center mb-6">
        {phone ? `${phone} nömrəsinə göndərilən 6 rəqəmli kodu daxil edin` : 'Nömrənizə göndərilən kodu daxil edin'}
      </p>

      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-semibold text-[#011f23]">Təsdiq kodu</label>
          <div className="relative">
            <Icon name="lock" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#70787b]" />
            <input 
              type="text" 
              placeholder="000000" 
              value={otp}
              maxLength={6}
              onChange={(e) => { 
                setOtp(e.target.value.replace(/[^0-9]/g, '')); 
                if (errors.otp) setErrors((p) => { const n = { ...p }; delete n.otp; return n; }); 
              }}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#c0c8ca] focus:border-[#054752] focus:ring-2 focus:ring-[#054752]/20 text-[18px] text-[#011f23] bg-white outline-none transition-all tracking-[0.5em] text-center font-bold" 
            />
          </div>
          {errors.otp && <p className="text-[12px] text-[#ba1a1a]">{errors.otp}</p>}
        </div>

        {submitError && (
          <div className="rounded-xl border border-[#ffdad6] bg-[#fff4f2] px-4 py-3 text-[13px] font-medium text-[#93000a]">
            {submitError}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-[#def1d7] bg-[#f0f9eb] px-4 py-3 text-[13px] font-medium text-[#2e7d32]">
            {successMessage}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth loading={loading} className="text-[16px]">
          Təsdiqlə
        </Button>
        
        <button 
          type="button" 
          onClick={handleResend}
          disabled={loading}
          className="text-[14px] text-[#054752] font-medium hover:underline mt-2"
        >
          Kodu yenidən göndər
        </button>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#edfcff' }}>
      <Header />
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Suspense fallback={<div>Loading...</div>}>
          <VerifyContent />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
