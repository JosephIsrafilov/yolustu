'use client';

import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatPanel from '@/components/chat/ChatPanel';
import Icon from '@/components/ui/Icon';
import { useAppStore } from '@/store/useAppStore';

const COPY = {
  az: { title: 'Sohbet' },
  ru: { title: 'Чат' },
  en: { title: 'Chat' },
} as const;

export default function ChatDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const language = useAppStore((state) => state.language);
  const t = COPY[language] || COPY.en;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <main className="mx-auto flex h-[calc(100vh-150px)] w-full max-w-3xl flex-1 flex-col px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white"
            onClick={() => router.back()}
            aria-label="Back"
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <h1 className="text-lg font-semibold text-text">{t.title}</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-white">
          <ChatPanel conversationId={id} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
