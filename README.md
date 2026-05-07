# 🚗 YolUstu (Yol Üstü)

> Платформа попутных поездок для Азербайджана — удобный поиск и предложение поездок между городами.

## О проекте

**YolUstu** — централизованная платформа для поиска попутчиков в Азербайджане. Решает проблему хаотичного поиска поездок через WhatsApp-группы и Telegram, предоставляя удобный сервис с верификацией, рейтингами и онлайн-оплатой.

## Технический стек

| Компонент | Технология |
|---|---|
| **Backend** | Node.js + NestJS (Modular Monolith) |
| **Database** | PostgreSQL + PostGIS |
| **Cache** | Redis |
| **Web** | Next.js (React) |
| **Mobile** | React Native |
| **Карты** | Google Maps API |
| **Оплата** | Payriff / Kapital Bank |
| **SMS** | lsim.az |
| **CI/CD** | GitHub Actions |
| **Инфраструктура** | Docker + Docker Compose |

## Архитектура

Modular Monolith — единое NestJS-приложение, разбитое на изолированные модули:

```
src/
├── modules/
│   ├── auth/          # Аутентификация, SMS OTP, JWT
│   ├── users/         # Профили, верификация KYC
│   ├── rides/         # Поездки, геопоиск
│   ├── bookings/      # Бронирование
│   ├── payments/      # Интеграция с Payriff
│   ├── chat/          # WebSocket чат
│   ├── notifications/ # Push, SMS
│   └── reviews/       # Рейтинги и отзывы
├── common/            # Shared: guards, pipes, filters, DTOs
├── config/            # Конфигурация (env, database)
└── main.ts
```

## Ключевые фичи (MVP)

- 🔍 Поиск поездок по маршруту, дате и времени (PostGIS геопоиск)
- 📱 Регистрация через SMS OTP
- 💳 Онлайн-бронирование и оплата
- ⭐ Рейтинги и отзывы
- 💬 Real-time чат (WebSocket)
- 🔔 Push-уведомления

## Документация

- [📋 План проекта](./yolustu_plan.md)
- [🏗️ Архитектура](./yolustu_architecture.md)

## Запуск (dev)

```bash
# Установка зависимостей
npm install

# Запуск в dev-режиме
docker compose up -d   # PostgreSQL, Redis
npm run dev
```

## Лицензия

MIT
