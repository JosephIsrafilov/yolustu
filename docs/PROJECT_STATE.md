# Yolmates / Yolüstü Project State

_Last updated: 2026-06-14_

## 1. Executive Summary
Проект **Yolmates** (Yolüstü) представляет собой платформу совместных поездок (carpooling), адаптированную для Азербайджана.
На данный момент полностью готовы:
* Базовая инфраструктура бэкенда на FastAPI, подключенная к СУБД Supabase (PostgreSQL + PostGIS).
* Механизм идемпотентного заполнения демонстрационных данных (seed).
* Фронтенд на Next.js 16 с интеграцией карт Leaflet и формой поиска поездок, подключенный к API бэкенда.
* Полноценное мобильное Flutter-приложение (MVP), включающее Onboarding, Auth, Passenger Mode, Verified Driver Panel, Google Maps (Route flow), AI Price Suggestion, и локализацию (i18n).
* Полноценные Real-time WebSocket чаты.
* Настроенный конвейер CI/CD на GitHub Actions для всех трех платформ.

## 2. Latest Important Milestones
- **Mobile MVP Completed**: Полный флоу пассажира и водителя, Google Maps, i18n (AZ/EN/RU).
- **Backend Schema & Chats**: Добавлены таблицы для `audit_logs`, миграции `message_type` и `attachments` для чатов, полная поддержка веб-сокетов.
- **AI Price Suggestion**: Интеграция AI-советов по цене поездки при создании поездки водителем.

## 3. Repository State
- **branch**: `main`
- **remote**: `https://github.com/JosephIsrafilov/yolustu`

## 4. High-Level Architecture
- **backend**: FastAPI (Python 3.11) + SQLAlchemy + Alembic. Обрабатывает REST API, WebSockets для уведомлений/чата, авторизацию (JWT) и расчет стоимости поездок.
- **frontend**: Next.js 16 (React 19, App Router) + Tailwind CSS v4 + Zustand. Выполняет запросы к бэкенду.
- **mobile**: Мобильное приложение на Flutter (Dart) с архитектурой Feature-First (Riverpod + GoRouter + Dio). Поддерживает сборку под Android, iOS и Web.
- **database**: PostgreSQL + PostGIS. На разработке и стейджинге используется Supabase.
- **cache**: Redis в Docker-контейнере (используется для WebSocket-подключений и кэширования лимитов).
- **CI/CD**: GitHub Actions. Настроены автоматические тесты, линтинг и сборка для бэкенда, фронтенда и мобильного приложения.

## 5. Environment Configuration

### Files that must never be committed
- Любые `.env` файлы
- `frontend/.env.local`
- `mobile/yolmates_app/android/keys.properties`
- `mobile/yolmates_app/ios/Flutter/Keys.xcconfig`
- Конфиденциальные ключи доступа к payment providers, Supabase, AI/API ключам и SMTP.

## 6. Backend Status
- **stack**: FastAPI, Python 3.11, Uvicorn, SQLAlchemy 2.0, Alembic, Docker.
- **tests**: `pytest` проходит полностью зелёным. Настроена моковая SQLite БД для локальных проверок.
- **features**: Полностью готов Auth, Rides, Bookings, Chats (REST & WebSockets).
- **schema**: Все миграции синхронизированы (`alembic upgrade head`).

## 7. Frontend Status
- **stack**: Next.js 16.2.6, React 19, Zustand 5, Tailwind CSS v4, Leaflet Map.
- **checks**: `npm run typecheck`, `npm run lint`, `npm run build` и `Playwright e2e` тесты полностью зеленые.
- **features**: Поиск, создание поездок, кошелек, чаты (UI), AI price.

## 8. Mobile Flutter Status (MVP Readiness)
- **stack**: Flutter, Riverpod, GoRouter, Dio, Google Maps Flutter, WebSocketChannel.
- **checks**: `flutter analyze` и `flutter test` зеленые.
- **i18n**: Реализована полная поддержка локализации. Язык по умолчанию — Azerbaijani. Доступны: AZ, EN, RU в настройках `SettingsScreen`.
- **Google Maps**: Интегрировано отображение карт маршрута поездки. API-ключи скрыты через ignored local configs.
- **Driver Mode**: Реализован безопасный флоу `Driver Panel`, доступный только для Verified Drivers. Обычные пассажиры не могут зайти в режим водителя.
- **AI Price**: Реализован совет цены AI (Price Suggestion) через backend endpoint. Приложение напрямую с AI ключами не общается.
- **Chats**: 
  - Chat List и Chat Detail работают через `ChatRepository` (REST + WebSockets).
  - Фото, аудио и In-App Call иконки добавлены как foundation (заглушки со snackbar). Действия safely disabled, пока не подключены `image_picker` / `record` / WebRTC.
  - Support chat entry point существует.

## 9. Known Limitations & TODOs
- **Media/Audio in Mobile Chats**: UI готов, но загрузка multipart/form-data файлов и запись аудио с микрофона (record plugin) — в статусе TODO.
- **In-App Call**: Установлен foundation. Значок звонка выводит Snackbar "Звонок скоро появится". Сама интеграция WebRTC или Agora — в статусе TODO.
- **Google Maps Web**: В режиме веб-сборки Flutter могут возникать предупреждения `flutter_secure_storage` о WASM, это нормально. JS CanvasKit сборка собирается успешно.
- **Local Alembic out-of-sync**: Локальная SQLite может иногда рассинхронизироваться при изменении веток; `test.db` можно удалять для регенерации.

## 10. How to Run Checks

### Backend
```bash
cd backend
uvx ruff format --check .
uvx ruff check .
uv run pytest -q
```

### Mobile / Flutter
```bash
cd mobile/yolmates_app
flutter pub get
flutter analyze
flutter test
flutter build web --release
```

### Frontend / Web
```bash
cd frontend
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```
