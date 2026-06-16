'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ChatPanel from '@/components/chat/ChatPanel';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { ROUTES } from '@/lib/routes';
import { messagesService } from '@/services';
import { apiAiService, type SupportAssistantResponse } from '@/services/api/api-ai-service';
import { useAppStore } from '@/store/useAppStore';

const COPY = {
  az: {
    support: 'Destek',
    aiSupport: 'AI destek',
    aiIntro: 'Evvelce qisa cavabi AI destekden alin. Operator sorgusu ayridir.',
    loginMessage: 'Destek komandasi ile yazismaq ucun hesabiniza daxil olun.',
    loginAction: 'Daxil ol',
    failed: 'Destek sohbetini acmaq olmadi',
    aiFailed: 'AI cavabini almaq olmadi',
    aiPlaceholder: 'Sualinizi yazin',
    you: 'Siz',
    assistant: 'AI destek',
    questions: {
      booking: 'Rezerv nece isleyir?',
      payment: 'Odenis ne vaxt acilir?',
      price: 'AI qiymet neye gore hesablanir?',
      driver: 'Surucu olmaq ucun ne lazimdir?',
      operator: 'Operatora baglan',
    },
  },
  ru: {
    support: 'РџРѕРґРґРµСЂР¶РєР°',
    aiSupport: 'AI РїРѕРґРґРµСЂР¶РєР°',
    aiIntro: 'Сначала получите короткий ответ от AI. Запрос оператору вынесен отдельно.',
    loginMessage: 'Р§С‚РѕР±С‹ РЅР°РїРёСЃР°С‚СЊ РІ РїРѕРґРґРµСЂР¶РєСѓ, РІРѕР№РґРёС‚Рµ РІ Р°РєРєР°СѓРЅС‚.',
    loginAction: 'Р’РѕР№С‚Рё',
    failed: 'РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ С‡Р°С‚ РїРѕРґРґРµСЂР¶РєРё',
    aiFailed: 'РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕР»СѓС‡РёС‚СЊ РѕС‚РІРµС‚ AI',
    aiPlaceholder: 'РќР°РїРёС€РёС‚Рµ РІРѕРїСЂРѕСЃ',
    you: 'Р’С‹',
    assistant: 'AI РїРѕРґРґРµСЂР¶РєР°',
    questions: {
      booking: 'Как работает бронь?',
      payment: 'Когда открывается оплата?',
      price: 'Как считается AI цена?',
      driver: 'Что нужно, чтобы стать водителем?',
      operator: 'Связать с оператором',
    },
  },
  en: {
    support: 'Support',
    aiSupport: 'AI support',
    aiIntro: 'Start with a short AI answer. Operator handoff is a separate action.',
    loginMessage: 'Sign in to message the support team.',
    loginAction: 'Sign in',
    failed: 'Failed to open support chat',
    aiFailed: 'Failed to get an AI reply',
    aiPlaceholder: 'Type your question',
    you: 'You',
    assistant: 'AI support',
    questions: {
      booking: 'How does booking work?',
      payment: 'When does payment open?',
      price: 'How is the AI price calculated?',
      driver: 'What do I need to become a driver?',
      operator: 'Connect me to an operator',
    },
  },
} as const;

type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

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
  const [assistantMessages, setAssistantMessages] = React.useState<AssistantMessage[]>([]);
  const [assistantInput, setAssistantInput] = React.useState('');
  const [assistantLoading, setAssistantLoading] = React.useState(false);
  const [supportMode, setSupportMode] = React.useState<'ai' | 'human'>('ai');

  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  if (
    currentUser?.role === 'admin' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/chats')
  ) {
    return null;
  }

  const appendMessages = (userMessage: string, reply: string) => {
    setAssistantMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: userMessage },
      { id: `assistant-${Date.now() + 1}`, role: 'assistant', content: reply },
    ]);
  };

  const getLocalReply = (message: string) => {
    const lowered = message.toLowerCase();

    if (lowered.includes('book') || lowered.includes('rezerv') || lowered.includes('брон')) {
      return language === 'az'
        ? 'Rezerv sefer sehifesinden gonderilir. Statusu Rezervler bolmesinde izleyirsiniz. Odenis surucu qebul edenden sonra acilir.'
        : language === 'ru'
        ? 'Бронь отправляется со страницы поездки. Статус виден в разделе бронирований. Оплата открывается после подтверждения водителем.'
        : 'Booking is sent from the trip page. You track it in Bookings. Payment opens after the driver accepts.';
    }

    if (lowered.includes('payment') || lowered.includes('odenis') || lowered.includes('ödəniş') || lowered.includes('оплат')) {
      return language === 'az'
        ? 'Odenis yalniz qebul olunmus rezerv ucun acilir. Evvelce Rezervler ve Cuzdan bolmesini yoxlayin.'
        : language === 'ru'
        ? 'Оплата открывается только для принятой брони. Сначала проверьте разделы Бронирования и Кошелек.'
        : 'Payment opens only for an accepted booking. First check Bookings and Wallet.';
    }

    if (lowered.includes('price') || lowered.includes('qiym') || lowered.includes('цен')) {
      return language === 'az'
        ? 'AI qiymet marshrut, mesafe ve tarix uzre orta qiymeti hesablayir. Seherleri secenden sonra Trips sehifesinde gosterilir.'
        : language === 'ru'
        ? 'AI цена считается по маршруту, расстоянию и дате. Она показывается на странице поездок после выбора городов.'
        : 'The AI price uses route, distance, and date. It appears on the trips page after both cities are selected.';
    }

    if (lowered.includes('driver') || lowered.includes('surucu') || lowered.includes('sürücü') || lowered.includes('водител')) {
      return language === 'az'
        ? 'Surucu olmaq ucun profil ve senedleri tamamlayin. Tesdiqden sonra driver dashboard ve ride creation acilir.'
        : language === 'ru'
        ? 'Чтобы стать водителем, заполните профиль и документы. После подтверждения откроются панель водителя и создание поездок.'
        : 'To become a driver, complete your profile and documents. After approval, the driver dashboard and ride creation open.';
    }

    return null;
  };

  const ensureSupportConversation = async () => {
    if (conversationId) {
      setSupportMode('human');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const conversation = await messagesService.createSupportChat();
      setConversationId(conversation.id);
      setSupportMode('human');
    } catch {
      setError(t.failed);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = async (question: string, isOperator = false) => {
    if (isOperator) {
      appendMessages(
        question,
        language === 'az'
          ? 'Operator sorgusu acilir.'
          : language === 'ru'
          ? 'Открываю запрос оператору.'
          : 'Opening an operator request.',
      );
      await ensureSupportConversation();
      return;
    }

    const reply = getLocalReply(question);
    if (reply) {
      appendMessages(question, reply);
    }
  };

  const askAssistant = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = assistantInput.trim();
    if (!message || assistantLoading) return;

    const localReply = getLocalReply(message);
    if (localReply) {
      appendMessages(message, localReply);
      setAssistantInput('');
      return;
    }

    setAssistantMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: message },
    ]);
    setAssistantInput('');
    setAssistantLoading(true);
    setError(null);

    try {
      const response: SupportAssistantResponse = await apiAiService.askSupportAssistant({
        message,
        language,
      });
      setAssistantMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
        },
      ]);
    } catch {
      setError(t.aiFailed);
    } finally {
      setAssistantLoading(false);
    }
  };

  return (
    <div className="fixed right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[max(5rem,calc(env(safe-area-inset-bottom,0px)+5rem))] z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3 sm:bottom-[max(1.5rem,calc(env(safe-area-inset-bottom,0px)+1.5rem))]">
      {open && (
        <div className="h-[min(620px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-white shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="font-semibold text-text">{t.support}</div>
              <button
                type="button"
                className="rounded-lg p-2 text-text-muted hover:bg-surface-muted cursor-pointer"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <Icon name="x" size={18} />
              </button>
            </div>

            {!isAuthenticated ? (
              <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-500">
                  <Icon name="message-square" size={32} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-navy">{t.support}</h3>
                <p className="mb-6 text-sm text-slate-500">{t.loginMessage}</p>
                <Button
                  onClick={() => {
                    setOpen(false);
                    const redirect = encodeURIComponent(pathname || ROUTES.home);
                    router.push(`${ROUTES.login}?redirect_to=${redirect}`);
                  }}
                  className="w-full bg-teal-500 hover:bg-teal-400 text-navy font-bold cursor-pointer"
                >
                  {t.loginAction}
                </Button>
              </div>
            ) : loading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
                {t.support}...
              </div>
            ) : supportMode === 'human' && conversationId ? (
              <ChatPanel conversationId={conversationId} compact />
            ) : (
              <div className="flex h-full min-h-0 flex-col bg-white">
                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text">
                    <Icon name="sparkles" size={16} />
                    {t.aiSupport}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-text-muted">{t.aiIntro}</p>
                </div>

                {error ? <div className="px-4 pt-3 text-sm text-danger-600">{error}</div> : null}

                <div className="border-b border-border px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void handleSuggestedQuestion(t.questions.booking)} className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-dim">
                      {t.questions.booking}
                    </button>
                    <button type="button" onClick={() => void handleSuggestedQuestion(t.questions.payment)} className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-dim">
                      {t.questions.payment}
                    </button>
                    <button type="button" onClick={() => void handleSuggestedQuestion(t.questions.price)} className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-dim">
                      {t.questions.price}
                    </button>
                    <button type="button" onClick={() => void handleSuggestedQuestion(t.questions.driver)} className="rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-text hover:bg-surface-dim">
                      {t.questions.driver}
                    </button>
                    <button type="button" onClick={() => void handleSuggestedQuestion(t.questions.operator, true)} className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">
                      {t.questions.operator}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  {assistantMessages.length === 0 ? (
                    <div className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-text-muted">
                      {t.aiIntro}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assistantMessages.map((message) => {
                        const mine = message.role === 'user';
                        return (
                          <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[78%] ${mine ? 'text-right' : 'text-left'}`}>
                              <div className="mb-1 text-xs font-medium text-text-muted">
                                {mine ? t.you : t.assistant}
                              </div>
                              <div
                                className={`rounded-2xl px-3 py-2 text-sm ${
                                  mine ? 'bg-brand-600 text-white' : 'bg-surface-muted text-text'
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form onSubmit={askAssistant} className="flex gap-2 border-t border-border p-3">
                  <input
                    value={assistantInput}
                    onChange={(event) => setAssistantInput(event.target.value)}
                    maxLength={1000}
                    placeholder={t.aiPlaceholder}
                    className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                  <Button
                    type="submit"
                    loading={assistantLoading}
                    disabled={!assistantInput.trim()}
                    className="h-10 w-10 p-0"
                    aria-label={t.aiSupport}
                  >
                    <Icon name="send" size={16} />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={t.support}
        className="h-[52px] w-[52px] flex items-center justify-center rounded-full bg-teal-500 text-navy shadow-lg transition-transform hover:scale-105 hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 active:scale-95 cursor-pointer border-none p-0"
      >
        <Icon name="message-square" size={24} />
      </button>
    </div>
  );
}
