'use client';

import WebLayout from '@/components/layout/WebLayout';
import Card from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';

const COPY = {
  az: {
    title: 'İstifadə Şərtləri',
    items: [
      ['İstifadəçi öhdəlikləri', 'Dəqiq profil məlumatı verin, hesabınızı qoruyun və platformadan qanunsuz və ya aldadıcı məqsədlərlə istifadə etməyin.'],
      ['Sürücü və sərnişin qaydaları', 'Sürücülər marşrut, qiymət və boş yerləri düzgün göstərməlidir. Sərnişinlər rezerv məlumatını təsdiqləməli və razılaşdırılmış qaydalara əməl etməlidir.'],
      ['Rezervasiyalar', 'Rezerv sorğusu yalnız sürücü təsdiq etdikdən sonra aktiv hesab olunur. Sürücü və sərnişin tərəfdən gecikmələr və dəyişikliklər vaxtında bildirilməlidir.'],
      ['Ödənişlər və qaytarmalar', 'Ödəniş, balans artırma və qaytarma axınları mövcud məhsul qaydalarına uyğun işləyir. Geri qaytarmalar yalnız uyğun status və ssenarilər üçün tətbiq olunur.'],
      ['Ləğv və məsuliyyət', 'Platforma səfərin faktiki icrasına zəmanət vermir. İstifadəçilər gecikmə, ləğv və görüş nöqtəsi razılaşmalarına görə öz aralarında məsuliyyət daşıyır.'],
      ['Təhlükəsizlik', 'Platformadan kənar nağd razılaşmalar, şəxsi risk yaradan davranışlar və təhlükəli sürücülük halları qadağandır. Problem olduqda dəstəyə yazın.'],
    ],
  },
  ru: {
    title: 'Условия использования',
    items: [
      ['Обязанности пользователя', 'Указывайте точные данные профиля, защищайте аккаунт и не используйте платформу для незаконных или вводящих в заблуждение действий.'],
      ['Правила для водителей и пассажиров', 'Водители должны корректно указывать маршрут, цену и свободные места. Пассажиры должны подтверждать детали бронирования и соблюдать согласованные условия поездки.'],
      ['Бронирования', 'Запрос считается активным только после подтверждения водителем. Об изменениях и задержках нужно сообщать заранее.'],
      ['Платежи и возвраты', 'Платежи, пополнения баланса и возвраты работают по текущим продуктовым правилам. Возвраты доступны только для подходящих сценариев и статусов.'],
      ['Отмена и ограничения платформы', 'Платформа не гарантирует фактическое выполнение поездки. Пользователи самостоятельно отвечают за договорённости о времени, отменах и точках встречи.'],
      ['Безопасность', 'Запрещены опасное поведение, сделки вне платформы и действия, создающие риск для других пользователей. При проблеме обращайтесь в поддержку.'],
    ],
  },
  en: {
    title: 'Terms of Use',
    items: [
      ['User responsibilities', 'Provide accurate profile details, protect your account and do not use the platform for unlawful or misleading activity.'],
      ['Driver and passenger responsibilities', 'Drivers must publish correct route, price and seat details. Passengers must confirm booking details and respect agreed trip rules.'],
      ['Bookings', 'A booking request becomes active only after driver approval. Delays and changes should be communicated promptly.'],
      ['Payments and refunds', 'Payments, wallet top-ups and refunds follow the current product rules. Refunds are available only for applicable scenarios and statuses.'],
      ['Cancellations and platform limits', 'The platform does not guarantee that every listed ride will be completed. Users remain responsible for timing, cancellations and meetup arrangements.'],
      ['Safety rules', 'Unsafe behavior, off-platform payment deals and conduct that puts others at risk are not allowed. Use support if something goes wrong.'],
    ],
  },
} as const;

export default function TermsPage() {
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
