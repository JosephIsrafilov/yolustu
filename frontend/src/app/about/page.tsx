'use client';

import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';

const COPY = {
  az: {
    title: 'Haqqımızda',
    intro: 'Yolmates Azərbaycanın şəhərlərarası səfərləri üçün qurulmuş carpooling platformasıdır.',
    sections: [
      ['Platforma nə edir', 'Sərnişinlər sərfəli gediş tapa, sürücülər boş yerlərini paylaşa, marşrut və vaxt üzrə uyğun səfərləri bir yerdə görə bilirlər.'],
      ['Kimlər üçündür', 'Platforma Bakı, Gəncə, Şəki, Quba, Lənkəran və digər şəhərlər arasında rahat, paylaşılmış səfər axtaran sərnişinlər və sürücülər üçündür.'],
      ['Etibar və təhlükəsizlik', 'Rezervasiya axını, sürücü profilləri, reytinqlər, çat və ödəniş alətləri istifadəçilərin səfəri daha şəffaf və təhlükəsiz idarə etməsinə kömək edir.'],
    ],
  },
  ru: {
    title: 'О сервисе',
    intro: 'Yolmates — это платформа для совместных междугородних поездок по Азербайджану.',
    sections: [
      ['Что делает платформа', 'Пассажиры находят подходящие поездки, водители публикуют свободные места, а маршруты, время и условия бронирования собраны в одном понятном интерфейсе.'],
      ['Для кого она создана', 'Сервис подходит пассажирам и водителям, которые ездят между Баку, Гянджой, Шеки, Губой, Ленкоранью и другими городами Азербайджана.'],
      ['Доверие и безопасность', 'Профили, рейтинги, бронирования, сообщения и платёжные сценарии помогают договариваться о поездке прозрачнее и безопаснее.'],
    ],
  },
  en: {
    title: 'About',
    intro: 'Yolmates is a carpooling platform built for intercity travel across Azerbaijan.',
    sections: [
      ['What the platform does', 'Passengers can find suitable rides, drivers can share empty seats, and route, timing, booking and ride details stay in one place.'],
      ['Who it is for', 'It serves passengers and drivers traveling between Baku, Ganja, Sheki, Quba, Lankaran and other cities across Azerbaijan.'],
      ['Trust and safety', 'Profiles, ratings, booking flows, messaging and payment tools are designed to make shared travel more transparent and safer.'],
    ],
  },
} as const;

export default function AboutPage() {
  const language = useAppStore((state) => state.language);
  const copy = COPY[language];

  return (
    <WebLayout title={copy.title}>
      <div className="space-y-6">
        <Card className="border-[#cbe8ee] bg-gradient-to-br from-white to-[#f4fdff] p-6 md:p-8">
          <p className="max-w-3xl text-base leading-7 text-[#33555d] md:text-lg">{copy.intro}</p>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {copy.sections.map(([title, body]) => (
            <Card key={title} className="h-full p-6">
              <h2 className="text-lg font-semibold text-[#002f37]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#4a5e64]">{body}</p>
            </Card>
          ))}
        </div>
      </div>
    </WebLayout>
  );
}
