'use client';

import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Icon from '@/components/ui/Icon';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAppStore } from '@/store/useAppStore';
import { I18N } from '@/lib/i18n';

interface WebLayoutProps {
  children: React.ReactNode;
  title?: string;
  narrow?: boolean;
  showBack?: boolean;
  hideFooter?: boolean;
}

export default function WebLayout({ children, title, narrow, showBack, hideFooter }: WebLayoutProps) {
  const { activeToast, setActiveToast } = usePushNotifications();
  const { acceptBooking, rejectBooking, language } = useAppStore();
  const [actionLoading, setActionLoading] = useState<'accept' | 'reject' | null>(null);

  const copy = I18N[language];

  const handleAccept = async (bookingId: string) => {
    setActionLoading('accept');
    await acceptBooking(bookingId);
    setActionLoading(null);
    setActiveToast(null);
  };

  const handleReject = async (bookingId: string) => {
    setActionLoading('reject');
    await rejectBooking(bookingId);
    setActionLoading(null);
    setActiveToast(null);
  };

  const notificationBookingId =
    activeToast?.data.type === 'booking_request' && typeof activeToast.data.booking_id === 'string'
      ? activeToast.data.booking_id
      : null;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <Header />
      <main className={`grow w-full mx-auto px-6 py-8 min-w-0 ${narrow ? 'max-w-2xl' : 'max-w-285'}`}>
        {(title || showBack) && (
          <div className="flex items-center gap-3 mb-8 min-w-0">
            {showBack && (
              <button onClick={() => window.history.back()}
                className="w-10 h-10 rounded-full bg-white border border-[#c0c8ca] flex items-center justify-center hover:bg-[#d5f3f9] transition-colors shrink-0">
                <Icon name="arrow-left" size={18} className="text-[#40484a]" />
              </button>
            )}
            {title && (
              <h1 className="ui-panel-title text-[24px] leading-8 text-[#002f37] min-w-0 break-words">{title}</h1>
            )}
          </div>
        )}
        {children}
      </main>
      {!hideFooter && <Footer />}

      {/* Toast Notification Container */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white rounded-xl border border-[#c0c8ca] shadow-lg p-4 max-w-sm flex gap-3 items-start relative overflow-hidden">
            <div className="w-1.5 h-full bg-[#054752] absolute left-0 top-0"></div>
            <div className="shrink-0 w-8 h-8 rounded-full bg-[#d5f3f9] flex items-center justify-center text-[#054752]">
              <Icon name="bell" size={16} />
            </div>
            <div className="flex-1 pr-6">
              <h4 className="ui-card-title mb-0.5 text-[#002f37]">{activeToast.title}</h4>
              <p className="ui-meta-text text-[#40484a] leading-tight">{activeToast.body}</p>
              
              {notificationBookingId && (
                <div className="flex gap-2 mt-3">
                  <button
                    disabled={!!actionLoading}
                    onClick={() => handleAccept(notificationBookingId)}
                    className="ui-action-text px-2.5 py-1 bg-[#054752] text-white rounded-lg hover:bg-[#002f37] transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'accept' ? '...' : copy.bookings.acceptBtn}
                  </button>
                  <button
                    disabled={!!actionLoading}
                    onClick={() => handleReject(notificationBookingId)}
                    className="ui-action-text px-2.5 py-1 border border-[#c0c8ca] text-[#40484a] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === 'reject' ? '...' : copy.bookings.rejectBtn}
                  </button>
                </div>
              )}
            </div>
            <button 
              onClick={() => setActiveToast(null)}
              className="absolute top-3 right-3 text-[#70787b] hover:text-[#002f37] transition-colors"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
