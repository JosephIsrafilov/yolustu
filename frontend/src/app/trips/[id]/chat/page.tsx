'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useChat } from '@/hooks/useChat';
import { messagesService } from '@/services';
import { useAppStore } from '@/store/useAppStore';
import { ROUTES } from '@/lib/routes';
import { I18N } from '@/lib/i18n';

const CHAT_PAGE_I18N = {
  az: {
    statusOnline: 'Onlayn',
    statusOffline: 'Bağlantı kəsilib',
    noMessages: 'Hələ mesaj yoxdur',
    chatInstructions: 'Sürücü və ya sərnişinlərlə burada danışa bilərsiniz.',
    userFallback: 'İstifadəçi',
  },
  ru: {
    statusOnline: 'Онлайн',
    statusOffline: 'Соединение разорвано',
    noMessages: 'Сообщений нет',
    chatInstructions: 'Здесь вы можете общаться с водителем или другими пассажирами.',
    userFallback: 'Пользователь',
  },
  en: {
    statusOnline: 'Online',
    statusOffline: 'Disconnected',
    noMessages: 'No messages yet',
    chatInstructions: 'You can communicate with the driver or other passengers here.',
    userFallback: 'User',
  },
};

export default function ChatPage() {
  const { id: rideId } = useParams() as { id: string };
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const language = useAppStore((s) => s.language);
  const { messages, setMessages, isConnected } = useChat(rideId);
  const markRideAsRead = useAppStore((s) => s.markRideAsRead);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const copy = I18N[language].chat;
  const localCopy = CHAT_PAGE_I18N[language] || CHAT_PAGE_I18N.en;

  useEffect(() => {
    if (rideId && markRideAsRead) {
      markRideAsRead(rideId);
    }
  }, [rideId, messages, markRideAsRead]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await messagesService.getRideMessages(rideId);
        setMessages(history);
      } catch (err) {
        // Error handled silently
      }
    };
    if (rideId) fetchHistory();
  }, [rideId, setMessages, isConnected]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !currentUser) return;

    setIsSending(true);
    try {
      await messagesService.sendMessage({
        ride_id: rideId,
        content: inputText.trim(),
      });
      setInputText('');
    } catch (err) {
      // Error handled silently
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUser) {
    router.push(ROUTES.login);
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Header />
      
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 overflow-hidden h-[calc(100vh-140px)]">
        <div className="flex items-center gap-3 mb-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <Icon name="arrow-left" size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text">{copy.title}</h1>
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-text-secondary">
                {isConnected ? localCopy.statusOnline : localCopy.statusOffline}
              </span>
            </div>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden p-0">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
          >
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-50">
                <Icon name="message-square" size={48} className="mb-2" />
                <p>{localCopy.noMessages}</p>
                <p className="text-xs text-center px-8 mt-1">
                  {localCopy.chatInstructions}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === currentUser.id;
                return (
                  <div 
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[10px] text-text-muted mb-0.5 ml-2 font-medium">
                        {msg.sender_name || localCopy.userFallback}
                      </span>
                    )}
                    <div 
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                        isMe 
                          ? 'bg-brand-500 text-white rounded-tr-none' 
                          : 'bg-white text-text border border-border rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-text-muted mt-1 mx-2">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t border-border bg-white flex gap-2"
          >
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={copy.placeholder}
              className="flex-1 px-4 py-2 rounded-full bg-bg border border-border focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all text-sm"
            />
            <Button 
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0"
            >
              {isSending ? (
                <Icon name="loader-2" size={18} className="animate-spin" />
              ) : (
                <Icon name="send" size={18} />
              )}
            </Button>
          </form>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
