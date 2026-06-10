'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { useChat } from '@/hooks/useChat';
import { messagesService } from '@/services';
import { useAppStore } from '@/store/useAppStore';

const COPY = {
  az: {
    loading: 'Mesajlar yuklenir',
    failed: 'Mesajlari yuklemek olmadi',
    empty: 'Hele mesaj yoxdur',
    placeholder: 'Mesajinizi yazin',
    send: 'Gonder',
    user: 'Istifadeci',
  },
  ru: {
    loading: 'Загрузка сообщений',
    failed: 'Не удалось загрузить сообщения',
    empty: 'Сообщений пока нет',
    placeholder: 'Введите сообщение',
    send: 'Отправить',
    user: 'Пользователь',
  },
  en: {
    loading: 'Loading messages',
    failed: 'Failed to load messages',
    empty: 'No messages yet',
    placeholder: 'Type your message',
    send: 'Send',
    user: 'User',
  },
} as const;

interface ChatPanelProps {
  conversationId: string;
  compact?: boolean;
}

export default function ChatPanel({ conversationId, compact = false }: ChatPanelProps) {
  const currentUser = useAppStore((state) => state.currentUser);
  const language = useAppStore((state) => state.language);
  const t = COPY[language] || COPY.en;
  const { messages, setMessages, isConnected, addMessage } = useChat(
    conversationId,
    'conversation',
  );
  const [text, setText] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    messagesService
      .getChatMessages(conversationId, { limit: 50 })
      .then((history) => {
        if (!cancelled) {
          setMessages(history);
          setError(null);
        }
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
  }, [conversationId, setMessages, t.failed]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const message = await messagesService.sendChatMessage(conversationId, body);
      addMessage(message);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-text">
          <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-success-500' : 'bg-text-muted'}`} />
          Chat
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">{t.loading}</p>
        ) : error ? (
          <p className="py-8 text-center text-sm text-danger-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">{t.empty}</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const mine = message.sender_id === currentUser?.id;
              return (
                <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${mine ? 'text-right' : 'text-left'}`}>
                    {!mine && (
                      <div className="mb-1 text-xs font-medium text-text-muted">
                        {message.sender_name || t.user}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        mine ? 'bg-brand-600 text-white' : 'bg-surface-muted text-text'
                      }`}
                    >
                      {message.content}
                    </div>
                    <div className="mt-1 text-[11px] text-text-muted">
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          placeholder={t.placeholder}
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <Button
          type="submit"
          loading={sending}
          disabled={!text.trim()}
          className={compact ? 'h-10 w-10 p-0' : undefined}
          aria-label={t.send}
        >
          <Icon name="send" size={16} />
          {!compact && <span>{t.send}</span>}
        </Button>
      </form>
    </div>
  );
}
