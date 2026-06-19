'use client';

import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatDetailView from '@/features/chats/presentation/ChatDetailView';

export default function ChatDetailsPage() {
  const { id } = useParams() as { id: string };

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <ChatDetailView conversationId={id} />
      <Footer />
    </div>
  );
}
