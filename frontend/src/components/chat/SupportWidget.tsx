'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ChatPanel from '@/components/chat/ChatPanel';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
import { messagesService } from '@/services';
import { useAppStore } from '@/store/useAppStore';

const COPY = {
  az: {
    support: 'Dəstək',
    contact: 'Dəstəklə əlaqə',
    loginMessage: 'Dəstək komandası ilə yazışmaq üçün hesabınıza daxil olun.',
    loginAction: 'Daxil ol',
    failed: 'Dəstək söhbətini açmaq olmadı',
  },
  ru: {
    support: 'Поддержка',
    contact: 'Связаться с поддержкой',
    loginMessage: 'Чтобы написать в поддержку, войдите в аккаунт.',
    loginAction: 'Войти',
    failed: 'Не удалось открыть чат поддержки',
  },
  en: {
    support: 'Support',
    contact: 'Contact support',
    loginMessage: 'Sign in to message the support team.',
    loginAction: 'Sign in',
    failed: 'Failed to open support chat',
  },
} as const;

export default function SupportWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const language = useAppStore((state) => state.language);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const currentUser = useAppStore((state) => state.currentUser);
  const t = COPY[language] || COPY.en;
  const [open, setOpen] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  if (pathname !== '/' || currentUser?.role === 'admin') {
    return null;
  }

  const toggleSupport = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    
    if (!isAuthenticated) {
      return;
    }

    if (conversationId) return;

    setLoading(true);
    setError(null);
    try {
      const conversation = await messagesService.createSupportChat();
      setConversationId(conversation.id);
    } catch {
      setError(t.failed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[max(5rem,calc(env(safe-area-inset-bottom,0px)+5rem))] z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
      {open && (
        <div className="h-[min(620px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="font-semibold text-text">{t.support}</div>
              <button
                type="button"
                className="rounded-lg p-2 text-text-muted hover:bg-surface-muted cursor-pointer"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            
            {!isAuthenticated ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500">
                  <Icon name="message-square" size={32} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-navy">{t.support}</h3>
                <p className="mb-6 text-sm text-slate-500">{t.loginMessage}</p>
                <Button 
                  onClick={() => {
                    setOpen(false);
                    const redirect = encodeURIComponent(pathname || ROUTES.home);
                    router.push(`${ROUTES.login}?redirect_to=${redirect}`);
                  }}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-navy font-bold cursor-pointer"
                >
                  {t.loginAction}
                </Button>
              </div>
            ) : loading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
                {t.support}...
              </div>
            ) : error ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-danger-600">
                {error}
              </div>
            ) : conversationId ? (
              <ChatPanel conversationId={conversationId} compact />
            ) : null}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleSupport}
        aria-label={t.support}
        className="h-[52px] w-[52px] flex items-center justify-center rounded-full bg-teal-500 text-navy shadow-lg transition-transform hover:scale-105 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-95 cursor-pointer border-none p-0"
      >
        <Icon name="message-square" size={24} />
      </button>
    </div>
  );
}
