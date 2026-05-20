# YolUstu — Архитектурные решения (приложение к дипломной работе)

---

## 1. Выбор архитектурного стиля: Modular Monolith → Microservices

Для MVP выбран подход **Modular Monolith** (модульный монолит) — единое FastAPI-приложение, разделённое на изолированные модули по бизнес-доменам. Это даёт:
- Простоту деплоя (один Docker-контейнер)
- Низкие инфраструктурные затраты на старте
- Возможность выделить модули в микросервисы при росте нагрузки

```
backend/app/
├── core/              # Shared: config, security, database, exceptions
├── domains/           # Бизнес-логика (модули)
│   ├── identity/      # Аутентификация, SMS OTP, JWT, Пользователи
│   ├── trips/         # Поездки (Rides), Транспорт (Vehicles), геопоиск
│   ├── bookings/      # Бронирование
│   ├── engagement/    # Сообщения (Chat), Отзывы (Reviews)
│   └── admin/         # Администрирование
└── main.py            # Точка входа API
```

> Каждый домен инкапсулирует свои models, repositories, services и schemas (DTOs).

---

## 2. Аутентификация: поток SMS OTP + JWT

```mermaid
sequenceDiagram
    actor P as Пользователь
    participant App as Mobile / Web
    participant API as FastAPI API
    participant Redis as Redis
    participant SMS as lsim.az

    P->>App: Вводит номер телефона
    App->>API: POST /api/v1/auth/request-otp {phone}
    API->>API: Генерирует 6-значный OTP
    API->>Redis: Сохраняет OTP (TTL 5 мин)
    API->>SMS: Отправляет SMS с кодом
    SMS-->>P: SMS: "Ваш код: 123456"
    P->>App: Вводит OTP
    App->>API: POST /api/v1/auth/verify-otp {phone, otp}
    API->>Redis: Проверяет OTP
    Redis-->>API: OK / Expired
    API->>API: Создаёт/находит пользователя
    API->>API: Генерирует JWT access (1 час) + refresh (30 дней)
    API-->>App: {access_token, refresh_token, user}
```

**Механизм обновления токена:**
- Access token живёт 1 час
- Refresh token живёт 30 дней, хранится в Redis
- При обновлении старый refresh token инвалидируется (rotation)
- При подозрительной активности — все refresh tokens пользователя аннулируются

---

## 3. Геопоиск маршрутов (PostGIS)

Ключевая архитектурная задача — найти поездки, маршрут которых проходит «по пути» пассажира.

### Алгоритм поиска

```mermaid
flowchart TD
    A["Пассажир вводит:\nТочка А → Точка Б"] --> B["Геокодирование\nGoogle Maps Geocoding API"]
    B --> C["PostGIS запрос:\nST_DWithin по origin + destination"]
    C --> D["Фильтрация:\n- Дата/время\n- Свободные места\n- Статус = active"]
    D --> E["Ранжирование:\n- Расстояние до маршрута\n- Рейтинг водителя\n- Цена"]
    E --> F["Результат:\nСписок релевантных поездок"]
```

**SQL-запрос (через SQLAlchemy + GeoAlchemy2):**
```python
query = db.query(Ride).filter(
    Ride.status == "active",
    func.ST_DWithin(Ride.origin_location, origin_geom, radius),
    func.ST_DWithin(Ride.destination_location, dest_geom, radius)
).order_by(func.ST_Distance(Ride.origin_location, origin_geom) + func.ST_Distance(Ride.destination_location, dest_geom))
```

**Индексы:**
```sql
CREATE INDEX idx_rides_origin_geo ON rides USING GIST (origin_location);
CREATE INDEX idx_rides_dest_geo ON rides USING GIST (destination_location);
CREATE INDEX idx_rides_departure ON rides (departure_time) WHERE status = 'active';
```

---

## 4. Поток бронирования (Booking Flow)

```mermaid
stateDiagram-v2
    [*] --> pending : Пассажир бронирует
    pending --> confirmed : Водитель подтверждает
    pending --> rejected : Водитель отклоняет
    pending --> cancelled : Пассажир отменяет
    confirmed --> paid : Оплата прошла
    confirmed --> cancelled : Отмена до оплаты
    paid --> completed : Поездка завершена
    paid --> refunded : Отмена после оплаты
    completed --> reviewed : Отзыв оставлен
    rejected --> [*]
    cancelled --> [*]
    refunded --> [*]
    reviewed --> [*]
```

---

## 5. Платёжная архитектура

```mermaid
sequenceDiagram
    actor P as Пассажир
    participant App as Приложение
    participant API as FastAPI API
    participant DB as PostgreSQL
    participant Pay as Payriff API

    P->>App: Нажимает "Оплатить"
    App->>API: POST /api/v1/payments/create {bookingId}
    API->>DB: Создаёт запись Payment (status=pending)
    API->>Pay: Создаёт платёжную сессию
    Pay-->>API: {paymentUrl, transactionId}
    API-->>App: {paymentUrl}
    App->>Pay: Redirect → платёжная страница
    P->>Pay: Вводит данные карты
    Pay->>API: Webhook: payment_success / payment_failed
    API->>DB: Обновляет Payment status
    API->>DB: Обновляет Booking status → paid
    API->>App: Push-уведомление: "Оплата прошла"
```

---

## 6. Real-Time архитектура (чат + уведомления)

```mermaid
graph LR
    subgraph Clients["Клиенты"]
        A["Mobile App"]
        B["Web App"]
    end

    subgraph WS["WebSocket Layer"]
        C["FastAPI WebSocket"]
    end

    subgraph PubSub["Pub/Sub"]
        D["Redis Pub/Sub"]
    end

    subgraph Storage["Хранение"]
        E["PostgreSQL\n(messages)"]
    end

    subgraph Push["Push Service"]
        F["FCM / APNs"]
    end

    A <--> C
    B <--> C
    C <--> D
    C --> E
    C --> F
```

---

## 7. Кэширование

| Что кэшируется | Хранилище | TTL | Стратегия инвалидации |
|---|---|---|---|
| Сессии / Refresh tokens | Redis | 30 дней | Удаление при logout |
| OTP коды | Redis | 5 мин | Auto-expire |
| Популярные маршруты | Redis | 1 час | Invalidate при новой поездке |
| Профили пользователей | Redis | 15 мин | Invalidate при обновлении |

---

## 8. Обработка ошибок и устойчивость

### Centralized Error Handling

Все необработанные исключения перехватываются глобальным обработчиком и возвращаются в формате:
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NO_SEATS",
    "message": "Нет свободных мест",
    "timestamp": "2026-05-06T12:00:00Z"
  }
}
```

---

## 9. Безопасность

| Аспект | Реализация |
|---|---|
| **Аутентификация** | JWT (HS256), access + refresh token rotation |
| **Авторизация** | RBAC: user, driver, admin. FastAPI Depends |
| **HTTPS** | Обязательный TLS (Let's Encrypt / Nginx) |
| **Rate Limiting** | Redis-based rate limiting |
| **Input Validation** | Pydantic v2 |
| **SQL Injection** | SQLAlchemy — параметризованные запросы |

---

## 10. Observability (наблюдаемость)

| Инструмент | Назначение |
|---|---|
| **Logging** | Structured JSON logging |
| **Sentry** | Error tracking & performance |
| **Prometheus** | API Metrics |

---

## 11. API Design (REST)

### Версионирование
Все эндпоинты под префиксом `/api/v1/`.

### Формат ответов
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 142
  }
}
```
