'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import {
  getConversationAvatar,
  getConversationName,
  getMessageSenderLabel,
} from '../data/chat-models';
import { useChatConversation, useChatMessages } from '../data/chat-controller';

const COPY = {
  az: {
    chat: 'Sohbet',
    loading: 'Mesajlar yuklenir',
    failed: 'Mesajlari yuklemek olmadi',
    empty: 'Sohbete baslayin',
    placeholder: 'Mesajinizi yazin',
    send: 'Gonder',
    online: 'Onlayn',
  },
  ru: {
    chat: 'Chat',
    loading: 'Loading messages',
    failed: 'Failed to load messages',
    empty: 'Start the conversation',
    placeholder: 'Type your message',
    send: 'Send',
    online: 'Online',
  },
  en: {
    chat: 'Chat',
    loading: 'Loading messages',
    failed: 'Failed to load messages',
    empty: 'Start the conversation',
    placeholder: 'Type your message',
    send: 'Send',
    online: 'Online',
  },
} as const;

function isImageAttachment(attachment: string) {
  const normalized = attachment.split('?')[0].toLowerCase();
  return (
    normalized.endsWith('.jpg') ||
    normalized.endsWith('.jpeg') ||
    normalized.endsWith('.png') ||
    normalized.endsWith('.webp') ||
    normalized.endsWith('.gif')
  );
}

export default function ChatDetailView({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const currentUser = useAppStore((state) => state.currentUser);
  const t = COPY[language] || COPY.en;
  const { conversation } = useChatConversation(conversationId);
  const { messages, loading, error, sending, isConnected, sendMessage } =
    useChatMessages(conversationId);
  const [text, setText] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const title = conversation
    ? getConversationName(conversation, currentUser?.id, t.chat)
    : t.chat;
  const avatar = conversation
    ? getConversationAvatar(conversation, currentUser?.id)
    : undefined;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    await sendMessage(body);
    setText('');
  };

  return (
    <main className="mx-auto flex h-[calc(100vh-150px)] w-full max-w-3xl flex-1 flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 hover:bg-white"
          onClick={() => (window.history.length > 1 ? router.back() : router.push(ROUTES.chats))}
          aria-label="Back"
        >
          <Icon name="arrow-left" size={18} />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold">
                {title.trim().charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-text">{title}</h1>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-success-500' : 'bg-text-muted'
                }`}
              />
              {t.online}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-white">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">{t.loading}</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-danger-600">{t.failed}</p>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-muted">{t.empty}</p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const mine = message.sender_id === currentUser?.id;
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] ${mine ? 'text-right' : 'text-left'}`}>
                      {!mine ? (
                        <div className="mb-1 text-xs font-medium text-text-muted">
                          {getMessageSenderLabel(message, currentUser?.id)}
                        </div>
                      ) : null}
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm ${
                          mine ? 'bg-brand-600 text-white' : 'bg-surface-muted text-text'
                        }`}
                      >
                        <div className="space-y-2">
                          {(message.attachments || []).map((attachment, index) =>
                            isImageAttachment(attachment) || message.message_type === 'photo' ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={attachment}
                                src={attachment}
                                alt={`Attachment ${index + 1}`}
                                className="max-h-64 w-full rounded-xl object-cover"
                              />
                            ) : (
                              <a
                                key={attachment}
                                href={attachment}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block underline underline-offset-2"
                              >
                                Attachment {index + 1}
                              </a>
                            ),
                          )}
                          {message.content ? <div>{message.content}</div> : null}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-text-muted">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {mine ? <Icon name="check" size={13} /> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
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
            aria-label={t.send}
          >
            <Icon name="send" size={16} />
            <span>{t.send}</span>
          </Button>
        </form>
      </div>
    </main>
  );
}
