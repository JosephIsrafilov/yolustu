'use client';

import Link from 'next/link';
import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
import { messagesService } from '@/services';
import { useAppStore } from '@/store/useAppStore';
import { Conversation } from '@/types';

const COPY = {
  az: {
    title: 'Sohbetler',
    empty: 'Hele sohbet yoxdur',
    loading: 'Sohbetler yuklenir',
    failed: 'Sohbetleri yuklemek olmadi',
    support: 'Destek',
    ride: 'Gedis sohbeti',
  },
  ru: {
    title: 'Чаты',
    empty: 'Разговоров пока нет',
    loading: 'Загрузка чатов',
    failed: 'Не удалось загрузить чаты',
    support: 'Поддержка',
    ride: 'Чат поездки',
  },
  en: {
    title: 'Chats',
    empty: 'No conversations yet',
    loading: 'Loading chats',
    failed: 'Failed to load chats',
    support: 'Support',
    ride: 'Ride chat',
  },
} as const;

export default function ChatsPage() {
  const language = useAppStore((state) => state.language);
  const t = COPY[language] || COPY.en;
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    messagesService
      .getChats()
      .then((data) => {
        if (!cancelled) setConversations(data.filter((conversation) => conversation.type !== 'support'));
      })
      .catch(() => {
        if (!cancelled) setError(t.failed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t.failed]);

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <h1 className="mb-5 text-2xl font-bold text-text">{t.title}</h1>

        {loading ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-text-muted">{t.loading}</div>
        ) : error ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-danger-600">{error}</div>
        ) : conversations.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-sm text-text-muted">{t.empty}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            {conversations.map((conversation) => (
              <Link
                key={conversation.id}
                href={ROUTES.chatDetails(conversation.id)}
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 last:border-b-0 hover:bg-surface-muted"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Icon name={conversation.type === 'support' ? 'message-square' : 'car'} size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-text">
                      {conversation.type === 'support' ? t.support : t.ride}
                    </div>
                    <div className="truncate text-sm text-text-muted">{conversation.status}</div>
                  </div>
                </div>
                <div className="shrink-0 text-xs text-text-muted">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
