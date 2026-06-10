'use client';

import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';

const COPY = {
  az: {
    title: 'Məxfilik Siyasəti',
    items: [
      ['Toplanan məlumatlar', 'Qeydiyyat və giriş üçün telefon nömrəsi, hesab məlumatları, profil sahələri və platforma istifadəsi zamanı yaradılan fəaliyyət məlumatları toplanır.'],
      ['Profil və səfər məlumatları', 'Ad, şəhər, reytinq, avtomobil, gediş, rezerv və çat məlumatları uyğun istifadəçi axınlarını göstərmək üçün istifadə olunur.'],
      ['Ödəniş və balans məlumatları', 'Balans, top-up, ödəniş, gəlir və qaytarma ilə bağlı tranzaksiya qeydləri istifadəçiyə görünür və maliyyə axınlarını izləmək üçün saxlanılır.'],
      ['Dəstək mesajları', 'Dəstək və səfər çatlarında yazılan mesajlar problemi araşdırmaq, istifadəçi tarixçəsini göstərmək və xidmət keyfiyyətini qorumaq üçün saxlanıla bilər.'],
      ['Cookies və lokal yaddaş', 'Sessiya bərpası, dil seçimi və auth xidmət axınları üçün brauzer storage və cookie mexanizmləri istifadə oluna bilər.'],
      ['İstifadəçi hüquqları', 'İstifadəçilər profil məlumatlarını yeniləyə, dəstəyə yaza və məhsul daxilində görünən məlumatlarını idarə edə bilirlər.'],
    ],
  },
  ru: {
    title: 'Политика конфиденциальности',
    items: [
      ['Какие данные собираются', 'Для регистрации и входа используются номер телефона, данные аккаунта, поля профиля и информация о действиях внутри сервиса.'],
      ['Профиль и данные поездок', 'Имя, город, рейтинг, автомобиль, поездки, бронирования и данные чатов используются для отображения и сопровождения пользовательских сценариев.'],
      ['Платёжные и кошелёчные данные', 'Записи о балансе, пополнениях, платежах, доходах и возвратах сохраняются для отображения пользователю и отслеживания финансовых операций.'],
      ['Сообщения поддержки', 'Сообщения в поддержке и чатах поездок могут храниться для разбора проблем, истории общения и качества сервиса.'],
      ['Cookies и локальное хранилище', 'Браузерное хранилище и cookie могут использоваться для восстановления сессии, сохранения языка и служебных задач авторизации.'],
      ['Права пользователя', 'Пользователи могут обновлять профиль, обращаться в поддержку и управлять доступной им информацией внутри продукта.'],
    ],
  },
  en: {
    title: 'Privacy Policy',
    items: [
      ['Data collected', 'Phone number, account details, profile fields and in-product activity data are used for registration, login and core product flows.'],
      ['Profile and ride data', 'Name, city, rating, vehicle, ride, booking and chat data are used to power matching, booking and communication experiences.'],
      ['Payment and wallet data', 'Balance, top-up, payment, earnings and refund records are stored so users can see their activity and the product can track wallet flows.'],
      ['Support messages', 'Support and ride chat messages may be retained to investigate issues, show conversation history and maintain service quality.'],
      ['Cookies and local storage', 'Browser storage and cookies may be used for session restore, language preference and auth-related housekeeping.'],
      ['User rights', 'Users can update profile details, contact support and manage the information exposed to them inside the product.'],
    ],
  },
} as const;

export default function PrivacyPage() {
  const language = useAppStore((state) => state.language);
  const copy = COPY[language];

  return (
    <WebLayout title={copy.title}>
      <div className="space-y-4">
        {copy.items.map(([title, body]) => (
          <Card key={title} className="p-6">
            <h2 className="text-lg font-semibold text-[#002f37]">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#4a5e64]">{body}</p>
          </Card>
        ))}
      </div>
    </WebLayout>
  );
}
