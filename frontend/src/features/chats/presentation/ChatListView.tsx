'use client';

import Link from 'next/link';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import {
  getConversationAvatar,
  getConversationName,
  getMessageSenderLabel,
} from '../data/chat-models';
import { useChatConversations } from '../data/chat-controller';

const COPY = {
  az: {
    title: 'Sohbetler',
    empty: 'Hele sohbet yoxdur',
    loading: 'Sohbetler yuklenir',
    failed: 'Sohbetleri yuklemek olmadi',
    ride: 'Gedis sohbeti',
    start: 'Sohbete baslayin',
  },
  ru: {
    title: 'Chats',
    empty: 'No conversations yet',
    loading: 'Loading chats',
    failed: 'Failed to load chats',
    ride: 'Ride chat',
    start: 'Start the conversation',
  },
  en: {
    title: 'Chats',
    empty: 'No conversations yet',
    loading: 'Loading chats',
    failed: 'Failed to load chats',
    ride: 'Ride chat',
    start: 'Start the conversation',
  },
} as const;

function formatTime(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatListView() {
  const language = useAppStore((state) => state.language);
  const currentUser = useAppStore((state) => state.currentUser);
  const t = COPY[language] || COPY.en;
  const { conversations, loading, error } = useChatConversations();

  return (
    <section className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <h1 className="mb-5 text-2xl font-bold text-text">{t.title}</h1>

      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center text-sm text-text-muted">
          {t.loading}
        </div>
      ) : error ? (
        <div className="rounded-lg bg-white p-8 text-center text-sm text-danger-600">
          {t.failed}
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-sm text-text-muted">
          {t.empty}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          {conversations.map((conversation) => {
            const lastMessage = conversation.last_message;
            const name = getConversationName(conversation, currentUser?.id, t.ride);
            const avatar = getConversationAvatar(conversation, currentUser?.id);
            const preview = lastMessage
              ? `${getMessageSenderLabel(lastMessage, currentUser?.id)}: ${lastMessage.content || t.start}`
              : t.start;
            const unreadCount = conversation.unread_count || 0;

            return (
              <Link
                key={conversation.id}
                href={ROUTES.chatDetails(conversation.id)}
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 last:border-b-0 hover:bg-surface-muted"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold">
                        {name.trim().charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-text">{name}</div>
                    <div className="mt-1 flex min-w-0 items-center gap-1 text-sm text-text-muted">
                      {lastMessage?.sender_id === currentUser?.id ? (
                        <Icon
                          name="check"
                          size={14}
                        />
                      ) : null}
                      <span className="truncate">{preview}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <div className="text-xs text-text-muted">
                    {formatTime(lastMessage?.created_at || conversation.updated_at)}
                  </div>
                  {unreadCount > 0 ? (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
