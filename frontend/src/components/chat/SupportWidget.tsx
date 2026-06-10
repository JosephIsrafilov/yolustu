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
    login: 'Dəstəklə əlaqə üçün daxil olun',
    failed: 'Dəstək söhbətini açmaq olmadı',
  },
  ru: {
    support: 'Поддержка',
    contact: 'Связаться с поддержкой',
    login: 'Войдите, чтобы связаться с поддержкой',
    failed: 'Не удалось открыть чат поддержки',
  },
  en: {
    support: 'Support',
    contact: 'Contact support',
    login: 'Log in to contact support',
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
  const buttonLabel = isAuthenticated ? t.contact : t.support;

  if (pathname?.startsWith('/admin') || currentUser?.role === 'admin') {
    return null;
  }

  const openSupport = async () => {
    if (!isAuthenticated) {
      const redirect = encodeURIComponent(pathname || ROUTES.home);
      router.push(`${ROUTES.login}?redirect_to=${redirect}`);
      return;
    }

    setOpen(true);
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
    <div className="group fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[max(5rem,calc(env(safe-area-inset-bottom,0px)+5rem))] z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
      {open && (
        <div className="h-[min(620px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="font-semibold text-text">{t.support}</div>
              <button
                type="button"
                className="rounded-lg p-2 text-text-muted hover:bg-surface-muted"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
            {loading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
                {t.support}
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

      <Button
        type="button"
        onClick={openSupport}
        aria-label={isAuthenticated ? t.contact : t.login}
        className="h-12 overflow-hidden rounded-full shadow-lg transition-all duration-300 ease-in-out w-12 hover:w-[14rem] focus-visible:w-[14rem] sm:group-focus-within:w-[14rem] p-0 flex items-center bg-teal-500 hover:bg-teal-400 text-navy"
      >
        <div className="flex items-center w-[14rem] h-full">
          <div className="w-12 h-12 flex shrink-0 items-center justify-center">
            <Icon name="message-square" size={18} />
          </div>
          <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            {buttonLabel}
          </span>
        </div>
      </Button>
    </div>
  );
}
