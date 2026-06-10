# Yolmates / Yolüstü Project State

_Last updated: 2026-06-10_

## 1. Executive Summary
Проект **Yolmates** (Yolüstü) представляет собой платформу совместных поездок (carpooling), адаптированную для Азербайджана.
На данный момент полностью готовы:
* Базовая инфраструктура бэкенда на FastAPI, подключенная к СУБД Supabase (PostgreSQL + PostGIS).
* Механизм идемпотентного заполнения демонстрационных данных (seed).
* Фронтенд на Next.js 16 с интеграцией карт Leaflet и формой поиска поездок, подключенный к API бэкенда.
* Стартовый каркас (foundation) мобильного Flutter-приложения.
* Настроенный конвейер CI/CD на GitHub Actions для всех трех платформ.

## 2. Latest Important Commits
| Commit | Message | Purpose |
|---|---|---|
| `488eb9e` | `chore: add development seed data` | Добавление идемпотентного скрипта сидирования базы данных для разработки. |
| `8dd731b` | `chore: document frontend API configuration` | Конфигурация API URL фронтенда и инструкция по переопределению порта. |
| `6983d73` | `chore: deduplicate environment templates` | Очистка и упорядочивание шаблонов переменных окружения. |
| `6fa858a` | `feat: add Flutter mobile app foundation` | Интеграция структуры и базового кода мобильного Flutter-приложения. |

## 3. Repository State
- **branch**: `main`
- **remote**: `https://github.com/JosephIsrafilov/yolustu`
- **working tree before this document commit**: содержит новый файл `docs/PROJECT_STATE.md`
- **pushed status before this document commit**: кодовые изменения синхронизированы с `origin/main`; сам файл состояния еще не был закоммичен
- **local uncommitted changes before this document commit**: `docs/PROJECT_STATE.md`

## 4. High-Level Architecture
- **backend**: FastAPI (Python 3.11) + SQLAlchemy + Alembic. Обрабатывает REST API, WebSockets для уведомлений/чата, авторизацию (JWT) и расчет стоимости поездок.
- **frontend**: Next.js 16 (React 19, App Router) + Tailwind CSS v4 + Zustand. Выполняет запросы к бэкенду.
- **mobile**: Каркас мобильного приложения на Flutter (Dart) с архитектурой Feature-First (Riverpod + GoRouter + Dio).
- **database**: PostgreSQL + PostGIS. На разработке и стейджинге используется Supabase.
- **cache**: Redis в Docker-контейнере (используется для WebSocket-подключений и кэширования лимитов).
- **CI/CD**: GitHub Actions. Настроены автоматические тесты, линтинг и сборка для бэкенда, фронтенда и мобильного приложения.

## 5. Environment Configuration

### Root `.env.example`
Является основным каноничным шаблоном для запуска всего стэка (Docker, бэкенд, фронтенд). Содержит настройки подключения к PostgreSQL, Redis, payment providers, Nvidia API и почтовому серверу SMTP.

### Backend env
Локальный файл `backend/.env` содержит минимальный набор переменных для запуска API отдельно от Docker-контейнеров:
- `DATABASE_URL` (пул-соединение)
- `DIRECT_DATABASE_URL` (прямое соединение для миграций Alembic)
- `REDIS_URL`
- `SECRET_KEY`
- `ENVIRONMENT=development`

### Frontend env
Фронтенд считывает настройки из `frontend/.env.local` (не коммитится). Важно: используется переменная `NEXT_PUBLIC_API_URL` (а не `NEXT_PUBLIC_API_BASE_URL`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```
Для переопределения порта (например, если бэкенд запущен на порту `8010`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8010/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8010
NEXT_PUBLIC_MAP_PROVIDER=auto
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### Mobile Flutter env
Находится в `mobile/yolmates_app/env/dev.json.example`:
```json
{
  "APP_ENV": "dev",
  "API_MODE": "mock",
  "API_BASE_URL": "http://10.0.2.2:8000/api/v1"
}
```

### Files that must never be committed
- Любые `.env` файлы
- `frontend/.env.local`
- `mobile/yolmates_app/env/dev.json`
- Конфиденциальные ключи доступа к payment providers, Supabase и SMTP.

## 6. Backend Status
- **stack**: FastAPI, Python 3.11, Uvicorn, SQLAlchemy 2.0, Alembic, Docker.
- **important folders/files**:
  - `backend/app/main.py` — точка входа FastAPI (жизненный цикл lifespan).
  - `backend/app/core/` — конфигурация, подключение к базам данных (PostgreSQL, Redis), WebSocket-менеджер.
  - `backend/app/domains/` — доменная бизнес-логика (identity, trips, bookings, engagement, payments, ai, admin).
  - `backend/alembic/` — миграции базы данных.
- **startup commands**: 
  - С виртуальным окружением: `cd backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000`
- **health endpoint**: `GET http://localhost:8000/health` проверяет здоровье API, СУБД и Redis.
- **API endpoints**:
  - `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/refresh` — авторизация.
  - `/api/v1/rides/search` — поиск поездок.
  - `/api/v1/bookings/` — создание бронирований.
- **auth**: access-token используется через `Authorization` header или `access_token` cookie; web-сессия восстанавливается через cookie + `GET /users/me`, legacy `localStorage` токены очищаются и не являются текущим source of truth.
- **rides**: Полностью реализована выдача поездок с фильтрацией по городам Азербайджана (Bakı, Gəncə, Lənkəran, Şəki и др.).
- **bookings**: Подсчет свободных мест ведется на стороне бэкенда на основе статусов бронирования (`accepted`, `paid` уменьшают количество мест, отмена возвращает места).
- **known issues**: При отсутствии пакета `firebase_admin` бэкенд предупреждает в логах о переключении на WebSocket-уведомления.

## 7. Database and Seed Data Status
- **DB provider**: Supabase PostgreSQL (с установленным расширением `postgis`).
- **connection**: `DATABASE_URL` (порт 6543, pooler), `DIRECT_DATABASE_URL` (порт 5432, direct).
- **seed command**: `cd backend && .\venv\Scripts\python.exe scripts/seed_dev_data.py`
- **seeded entities**: 12 пользователей (водители, пассажиры, администраторы), транспортные средства, 18 поездок в разных статусах, бронирования, отзывы, чаты и платежи.
- **idempotency**: Механизм сидирования полностью идемпотентен (использует генерацию UUID на основе неймспейса seed для сопоставления записей при повторных запусках).
- **demo credentials**: Все тестовые аккаунты (например, водитель `+994501110001`, пассажир `+994501110002`) используют пароль `StrongPass1!`.
- **production safety**: Скрипт проверяет значение `settings.ENVIRONMENT` и падает с ошибкой, если окружение похоже на production.
- **verification result**: SQL миграции и сидирование успешно выполняются на СУБД Supabase. Запрос `/api/v1/rides/search` возвращает сгенерированные записи.

## 8. Frontend Status
- **stack**: Next.js 16.2.6, React 19, Zustand 5, Tailwind CSS v4, Leaflet Map.
- **package scripts**:
  - `dev` — стандартный запуск.
  - `dev:lowmem` — запускает Next.js с помощью `cross-env` и флага `--webpack`, выделяя 4ГБ памяти, что предотвращает падение OOM на слабых Windows-машинах.
- **API mode**: фронтенд сейчас всегда использует backend API-сервисы; отдельный `NEXT_PUBLIC_DATA_MODE` для web больше не требуется.
- **API env variables**: Считывает `NEXT_PUBLIC_API_URL` и `NEXT_PUBLIC_WS_URL`.
- **pages/routes**:
  - `/` — главная страница.
  - `/auth/login` — вход.
  - `/trips` — страница результатов поиска поездок.
  - `/trips/[id]` — детали поездки.
  - `/driver/create-trip` — создание поездки (с картой и расчетом AI-цены).
- **login flow**: Пользователь логинится по номеру телефона и паролю, backend возвращает `accessToken`, `refreshToken`, `user`, а web-клиент опирается на cookie-based session restore и `GET /users/me`.
- **rides/trips result**: Страница `/trips` должна отображать 12 активных поездок из seed-набора (`ride-01` ... `ride-12`). В карточках отображается расчетное время (estimated duration) на базе OSRM или расстояния.
- **driver onboarding**: Простая страница правил `/driver/apply` для тех, кто хочет стать водителем. В профиле пассажира скрыты блоки призыва стать водителем.
- **pricing**: При создании поездки добавлена кнопка рекомендаций цены (local heuristics) в зависимости от маршрута.
- **wallet**: В Navbar отображается баланс кошелька, подтягивающийся при успешной авторизации.
- **images**: Загруженные аватары локально используют атрибут `unoptimized` для избежания ошибок Next.js Image Optimization 400.
- **known issues**: Нет. Сборка (`npm run build`) и линтинг (`npm run lint`) проходят без ошибок.

## 9. Mobile Flutter Status
- **location**: `mobile/yolmates_app/`
- **structure**:
  - `lib/app/` — темы, роутер GoRouter.
  - `lib/core/` — сетевой клиент Dio, безопасное хранилище Secure Storage, общие виджеты.
  - `lib/features/` — модули приложения (auth, bookings, driver, onboarding, profile, reviews, rides, settings).
  - `lib/shared/` — общие модели данных и мок-данные.
- **dependencies**: `flutter_riverpod`, `go_router`, `dio`, `flutter_secure_storage`, `intl`.
- **routes**: Полный список путей определен в `lib/app/router.dart`. Защищенные роуты закрыты гардами авторизации.
- **API/mock config**: Через параметры `--dart-define` (`APP_ENV`, `API_MODE`, `API_BASE_URL`). По умолчанию используется `API_MODE=mock`.
- **auth foundation**: Контроллер авторизации Riverpod работает со статусами `unknown`, `unauthenticated`, `authenticated`.
- **checks**: На машине агента локальный запуск команд Flutter не выполнялся из-за отсутствия Flutter SDK в PATH. Успешно проверяется в удаленном GitHub Actions.
- **known issues**: Сетевые репозитории Dio описаны как контракты, но большая часть экранов пока работает на мок-данных (требуется интеграция с реальными эндпоинтами авторизации и поиска поездок).

## 10. CI/CD Status
- **workflows**:
  - `ci.yml` — проверка качества бэкенда и фронтенда при каждом пуше/PR.
  - `flutter-mobile.yml` — запуск сборки, линтинга и тестов Flutter-приложения при изменениях в каталоге `mobile/yolmates_app/**`.
- **checks**: Ruff linter, Mypy type checker, Pytest, Alembic upgrade, Docker build, ESLint, Next build, Flutter pub get, Flutter analyze, Flutter test.
- **what is verified**: Синтаксис кода, отсутствие ошибок типизации TypeScript/Dart, прохождение тестов бэкенда и Flutter, успешность миграций БД и сборки Next.js.
- **what is not verified**: Интеграционные тесты со сторонними платежными шлюзами (Payriff/Kapital) и NVIDIA API (используются моки).

## 11. Local Development Commands

### Install dependencies
- **Frontend**:
  ```bash
  npm install
  ```
- **Backend**:
  ```bash
  cd backend
  python -m venv venv
  # Windows:
  .\venv\Scripts\activate
  # Linux:
  source venv/bin/activate
  pip install -r requirements.txt
  ```
- **Mobile**:
  ```bash
  cd mobile/yolmates_app
  flutter pub get
  ```

### Start infrastructure
Запуск локального Redis:
```bash
docker compose up -d redis
```

### Start backend
Запуск FastAPI сервера разработки:
```bash
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Seed database
Заполнение базы данных Supabase демонстрационными записями:
```bash
cd backend
.\venv\Scripts\python.exe scripts/seed_dev_data.py
```

### Start frontend
Запуск фронтенда Next.js в режиме экономного использования памяти (Webpack):
```bash
cd frontend
npm run dev:lowmem
```

### Start Flutter app
Запуск мобильного приложения на эмуляторе Android:
```bash
cd mobile/yolmates_app
flutter run --dart-define-from-file=env/dev.json
```

### Run tests/checks
- **Backend**:
  ```bash
  cd backend
  pytest
  ```
- **Frontend**:
  ```bash
  cd frontend
  npm run lint
  npm run typecheck
  ```
- **Mobile**:
  ```bash
  cd mobile/yolmates_app
  flutter analyze
  flutter test
  ```

## 12. Current Verified Functionality
1. **База данных Supabase**: успешно принимает подключения бэкенда, выполняются все миграции Alembic.
2. **Сид данных**: Скрипт `seed_dev_data.py` успешно создает всех 12 пользователей, транспортные средства и поездки.
3. **Бэкенд API**: Эндпоинты `/health` и `/api/v1/rides/search` полностью работоспособны.
4. **Фронтенд**: Next.js успешно билдится и запускается через скрипт `dev:lowmem`.
5. **Интеграция фронтенд ↔ бэкенд**: Успешно протестирована авторизация тестового пользователя и отображение данных реальных поездок на странице `/trips` в браузере.

## 13. Not Verified / Unknown
- Работа Flutter-приложения на физических устройствах или эмуляторах на хост-машине (из-за отсутствия локального Flutter SDK у агента).

## 14. Risks and Blockers
- **Отсутствие локального Flutter SDK**: Агенты без предустановленного Flutter SDK не могут локально проверить компиляцию мобильного приложения перед коммитом (требуется полагаться на лог выполнения GitHub Actions CI).
- **Смешивание конфигураций**: Нужно следить за тем, чтобы бэкенд-переменные не путались с переменными фронтенда (`NEXT_PUBLIC_API_URL` должен быть строго в `frontend/.env.local`).

## 15. Recommended Next Steps

### Immediate
1. Установить Flutter SDK на локальной машине разработчика/агента для возможности запуска `flutter analyze` и `flutter test` перед коммитом.
2. Убедиться, что CI-тесты на GitHub проходят зелёными после каждого пуша в `main`.
3. Контролировать чистоту коммитов, не допуская попадания локальных конфигов `.env` и `.env.local` в Git.

### MVP Feature Work
1. **Интеграция реальной авторизации в Flutter**: Переписать `AuthRepository` в мобильном приложении, чтобы он делал реальные запросы к `/api/v1/auth/login` и `/api/v1/auth/request-otp` через клиент Dio.
2. **UI экранов входа**: Доработать валидацию полей ввода номера телефона на экранах входа мобильного приложения.
3. **Реальный поиск поездок в Flutter**: Подключить Dio-репозиторий поиска к эндпоинту `/api/v1/rides/search`.
4. **Экран деталей и бронирование в Flutter**: Реализовать вызов `POST /api/v1/bookings/` при нажатии кнопки бронирования места в поездке.
5. **Создание поездки водителем в Flutter**: Разработать визард создания поездки с отправкой запроса `POST /api/v1/rides/`.
6. **Личный кабинет**: Отображение списка бронирований текущего пользователя.

### Later
- Настройка карт Leaflet на мобильном приложении.
- Интеграция реального платежного шлюза на мобильных экранах.
- Настройка отправки Push-уведомлений через FCM (Firebase Cloud Messaging).
- Подготовка продуктового деплоя бэкенда и фронтенда.
- Настройка подписи релизных сборок (.apk / .aab).

## 16. Notes for Future Agents
- **Никогда не используйте переменную `NEXT_PUBLIC_API_BASE_URL`**. Единственное правильное имя для адреса API во фронтенде — `NEXT_PUBLIC_API_URL`.
- **Никогда не коммитьте файлы `.env.local` или `.env`**. Если вы создали локальные файлы для тестов, убедитесь, что они добавлены в `.gitignore`.
- **Не сбрасывайте базу данных Supabase** (не используйте `DROP DATABASE` / `reset_db.py` без согласования с командой). База данных является общей для стейджинга.
- **Скрипт сидирования полностью идемпотентен**. Вы можете запускать его многократно: он обновляет существующие демо-записи, а не плодит дубликаты.
- **Локальный запуск тестов Flutter** требует наличия Flutter SDK. Если он отсутствует, вы обязаны проверить результаты прогона тестов в GitHub Actions после пуша.
- **Разделяйте коммиты**. Изменения конфигурационных файлов окружения и миграций базы данных не должны смешиваться с коммитами бизнес-логики мобильного приложения или фронтенда.
- **Не делайте force push** в ветку `main`.

> Note: после коммита этого файла состояние репозитория должно снова стать clean.
## 17. Conversation Chat Update

- Backend now supports conversation-based chat through `/api/v1/chats`.
- Passenger-driver ride chats are one-to-one by `booking_id`.
- Support conversations are user-owned; any `admin` can list/read/reply to support conversations for the MVP.
- New websocket channel is `/api/v1/chats/ws/{conversation_id}` and authorizes by conversation access before accepting.
- Frontend adds `/chats`, `/chats/[id]`, a support widget, and booking-card ride chat entry.
- Legacy `/api/v1/messages/*` ride chat remains for backward compatibility.
- Limitations: no attachments; admin users are support agents for MVP.
