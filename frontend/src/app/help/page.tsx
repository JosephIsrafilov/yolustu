'use client';

import Link from 'next/link';
import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';

const COPY = {
  az: {
    title: 'Yardım Mərkəzi',
    subtitle: 'Səfər tapmaq, sürücü olmaq, ödənişlər və dəstək barədə əsas cavablar.',
    sections: [
      ['Gediş necə tapılır', 'Marşrut, tarix və sərnişin sayını seçin, sonra nəticələrdən sizə uyğun gedişi açın və detalları yoxlayın.'],
      ['Sürücü necə olmaq olar', 'Profilinizi tamamlayın, sürücü axınına keçin və uyğun avtomobil ilə gediş paylaşın.'],
      ['Rezervasiyalar', 'Rezerv sorğusu göndərildikdən sonra sürücü təsdiqi gözlənilir. Təsdiqdən sonra ödəniş və çat addımları aktiv olur.'],
      ['Ödənişlər və balans', 'Balans səhifəsində top-up, ödəniş, qaytarma və gəlir hərəkətləri görünür.'],
      ['Dəstək və əlaqə', 'Texniki və ya sifariş problemi olduqda dəstək çatından istifadə edin.'],
    ],
    cta: 'Dəstəyə keç',
    login: 'Dəstək üçün daxil olun',
  },
  ru: {
    title: 'Центр помощи',
    subtitle: 'Короткие ответы о поиске поездки, водительском режиме, бронированиях и оплате.',
    sections: [
      ['Как найти поездку', 'Выберите маршрут, дату и количество мест, затем откройте подходящую поездку и проверьте детали.'],
      ['Как стать водителем', 'Заполните профиль, перейдите в режим водителя и опубликуйте поездку с доступным автомобилем.'],
      ['Бронирования', 'После отправки запроса нужно дождаться подтверждения водителя. Затем становятся доступны оплата и чат.'],
      ['Платежи и баланс', 'На странице баланса отображаются пополнения, платежи, возвраты и доход.'],
      ['Поддержка и связь', 'Если возникла техническая проблема или вопрос по поездке, используйте чат поддержки.'],
    ],
    cta: 'Открыть поддержку',
    login: 'Войти для связи с поддержкой',
  },
  en: {
    title: 'Help Center',
    subtitle: 'Quick guidance for finding rides, becoming a driver, bookings, payments and support.',
    sections: [
      ['How to find a ride', 'Choose your route, date and seat count, then open a matching trip and review the details.'],
      ['How to become a driver', 'Complete your profile, switch into driver mode and publish rides with your vehicle.'],
      ['Bookings', 'After you send a booking request, wait for driver approval. Payment and chat become available after acceptance.'],
      ['Payments and wallet', 'The wallet page shows top-ups, payments, refunds and earnings in one place.'],
      ['Support and contact', 'Use the support chat whenever you have a technical issue or need help with a trip.'],
    ],
    cta: 'Open support',
    login: 'Log in for support',
  },
} as const;

export default function HelpPage() {
  const language = useAppStore((state) => state.language);
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const copy = COPY[language];

  return (
    <WebLayout title={copy.title}>
      <div className="space-y-6">
        <Card className="border-[#cbe8ee] bg-gradient-to-r from-[#f5fdff] to-white p-6 md:p-8">
          <p className="max-w-3xl text-sm leading-6 text-[#4a5e64] md:text-base">{copy.subtitle}</p>
          <div className="mt-5">
            <Link href={isAuthenticated ? ROUTES.chats : `${ROUTES.login}?redirect_to=${encodeURIComponent('/help')}`}>
              <Button>{isAuthenticated ? copy.cta : copy.login}</Button>
            </Link>
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {copy.sections.map(([title, body]) => (
            <Card key={title} className="p-6">
              <h2 className="text-lg font-semibold text-[#002f37]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#4a5e64]">{body}</p>
            </Card>
          ))}
        </div>
      </div>
    </WebLayout>
  );
}
