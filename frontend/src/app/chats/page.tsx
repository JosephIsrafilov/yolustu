'use client';

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatListView from '@/features/chats/presentation/ChatListView';

export default function ChatsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Header />
      <ChatListView />
      <Footer />
    </div>
  );
}
