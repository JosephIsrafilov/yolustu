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
    support: 'Destek',
    contact: 'Destekle elaqe',
    login: 'Destekle elaqe ucun daxil olun',
    failed: 'Destek sohbetini acmaq olmadi',
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
    <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">
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

      <Button type="button" onClick={openSupport} aria-label={isAuthenticated ? t.contact : t.login}>
        <Icon name="message-square" size={18} />
        <span>{isAuthenticated ? t.contact : t.support}</span>
      </Button>
    </div>
  );
}
