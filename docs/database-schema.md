# Verilənlər Bazası Sxemi — Yolmates

## ER Diaqramı

```mermaid
erDiagram
    users ||--o{ vehicles : "sahiblik edir"
    users ||--o{ rides : "sürür"
    users ||--o{ bookings : "rezerv edir"
    users ||--o{ reviews : "yazır / qəbul edir"
    users ||--o{ device_tokens : "qeydiyyatdan keçir"
    rides ||--o{ bookings : "malikdir"
    rides ||--o{ messages : "ehtiva edir"
    rides ||--o{ reviews : "haqqında"
    bookings ||--o1 payments : "ödənilir"

    users {
        uuid id PK
        varchar phone UK
        varchar first_name
        varchar last_name
        varchar hashed_password
        varchar avatar_url
        varchar language
        varchar role
        varchar city
        text bio
        boolean is_blocked
        boolean is_verified
        varchar verification_status
        varchar document_url
        float rating
        int total_rides
        timestamp created_at
    }

    vehicles {
        uuid id PK
        uuid user_id FK
        varchar brand
        varchar model
        int year
        varchar color
        varchar plate_number
        timestamp created_at
    }

    rides {
        uuid id PK
        uuid driver_id FK
        uuid vehicle_id FK
        geometry origin_location
        varchar origin_city
        geometry destination_location
        varchar destination_city
        text intermediate_cities
        timestamp departure_time
        int total_seats
        int available_seats
        numeric price_per_seat
        varchar status
        text description
        boolean smoking_allowed
        boolean pets_allowed
        boolean music_allowed
        boolean female_only
        timestamp created_at
    }

    bookings {
        uuid id PK
        uuid ride_id FK
        uuid passenger_id FK
        int seats_booked
        numeric total_price
        varchar status
        timestamp created_at
    }

    payments {
        uuid id PK
        uuid booking_id FK
        numeric amount
        varchar status
        varchar transaction_id
        timestamp created_at
        timestamp updated_at
    }

    messages {
        uuid id PK
        uuid ride_id FK
        uuid sender_id FK
        text content
        timestamp created_at
    }

    reviews {
        uuid id PK
        uuid ride_id FK
        uuid author_id FK
        uuid target_id FK
        int rating
        text comment
        timestamp created_at
    }

    device_tokens {
        uuid id PK
        uuid user_id FK
        varchar token UK
        timestamp created_at
    }
```

---

## Cədvəllər və Sütunlar

### 1. users
İstifadəçilərin profilləri, reytinqləri və sənəd verifikasiyası məlumatları.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() |
| phone | VARCHAR(20) | NOT NULL, UNIQUE |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| hashed_password | VARCHAR(255) | |
| avatar_url | VARCHAR(255) | |
| language | VARCHAR(10) | DEFAULT 'az' |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'passenger' |
| city | VARCHAR(100) | |
| bio | TEXT | |
| is_blocked | BOOLEAN | NOT NULL, DEFAULT FALSE |
| is_verified | BOOLEAN | DEFAULT FALSE |
| verification_status| VARCHAR(20) | NOT NULL, DEFAULT 'none' (none, pending, approved, rejected) |
| document_url | VARCHAR(255) | |
| rating | FLOAT | DEFAULT 0.0 |
| total_rides | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 2026-06-09 Payment/Wallet Schema Update

The live schema now extends the old minimal `payments` table and adds wallet-backed ledger accounting.

### payments

Important columns:

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| booking_id | UUID | FK to bookings |
| passenger_id | UUID | FK to users |
| driver_id | UUID | FK to users |
| amount | NUMERIC(12,2) | Gross passenger payment |
| service_fee | NUMERIC(12,2) | Platform fee |
| driver_amount | NUMERIC(12,2) | Amount credited to driver pending balance |
| currency | VARCHAR(3) | Always `AZN` |
| provider | VARCHAR(50) | `mock`, `payriff`, `kapital` |
| provider_payment_id | VARCHAR(255) | Unique provider-side ID |
| provider_checkout_url | VARCHAR(1024) | Checkout URL when provider supports it |
| status | VARCHAR(50) | `pending`, `succeeded`, `failed`, `cancelled`, `refunded` |
| transaction_id | VARCHAR(255) | Unique transaction/session ID |
| idempotency_key | VARCHAR(255) | Unique payment creation key |
| failure_reason | VARCHAR(500) | Optional failure detail |
| metadata | JSON | Provider/raw metadata |
| paid_at | TIMESTAMPTZ | Set on success |
| refunded_at | TIMESTAMPTZ | Set on refund |

Indexes:
- `ix_payments_booking_id`
- unique `ix_payments_provider_payment_id`
- unique `ix_payments_transaction_id`
- unique `ix_payments_idempotency_key`
- partial unique `uq_payments_active_booking` for `pending`/`succeeded` payments per booking

### wallets

| Column | Type | Notes |
|---|---|---|
| user_id | UUID | PK, FK to users |
| available_balance | NUMERIC(12,2) | Withdrawable/settled balance |
| pending_balance | NUMERIC(12,2) | Driver earnings before ride completion |
| currency | VARCHAR(3) | Always `AZN` |
| created_at | TIMESTAMPTZ | Creation time |
| updated_at | TIMESTAMPTZ | Update time |

### wallet_transactions

Ledger entries are mandatory for every balance mutation.

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| payment_id | UUID | Nullable FK to payments |
| booking_id | UUID | Nullable FK to bookings |
| ride_id | UUID | Nullable FK to rides |
| type | VARCHAR(50) | `passenger_payment`, `platform_fee`, `driver_pending_earning`, `driver_available_earning`, `refund`, `payout`, `adjustment` |
| direction | VARCHAR(10) | `credit` or `debit` |
| amount | NUMERIC(12,2) | Ledger amount |
| currency | VARCHAR(3) | Always `AZN` |
| status | VARCHAR(20) | `pending`, `posted`, `reversed` |
| description | VARCHAR(500) | Human-readable detail |
| idempotency_key | VARCHAR(255) | Unique event key |
| created_at | TIMESTAMPTZ | Creation time |

Indexes:
- `ix_wallet_transactions_user_created`
- unique `ix_wallet_transactions_idempotency_key`

### payout_requests

Scaffold table for later manual/bank/card payouts:

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| amount | NUMERIC(12,2) | Requested payout amount |
| currency | VARCHAR(3) | Always `AZN` |
| status | VARCHAR(20) | `pending`, `approved`, `rejected`, `paid`, `cancelled` |
| method | VARCHAR(50) | Payout method label |
| metadata | JSON | Provider/admin metadata |
| created_at | TIMESTAMPTZ | Creation time |
| processed_at | TIMESTAMPTZ | Processing time |

**İndekslər:**
- `idx_users_phone` ON users (phone) UNIQUE

---

### 2. vehicles
Sürücülərin nəqliyyat vasitələri.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| user_id | UUID | NOT NULL, FOREIGN KEY (users.id) |
| brand | VARCHAR(50) | NOT NULL |
| model | VARCHAR(50) | NOT NULL |
| year | INTEGER | NOT NULL |
| color | VARCHAR(30) | NOT NULL |
| plate_number | VARCHAR(20) | NOT NULL |
| normalized_plate | VARCHAR(20) | NOT NULL; uppercase alphanumeric identity |
| seats_count | INTEGER | NOT NULL, CHECK 1..4 |
| variations | VARCHAR(100) | |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE |
| is_default | BOOLEAN | NOT NULL, DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |

Constraints and indexes:

- `CHECK (year BETWEEN 1886 AND 2100)`
- partial unique index on `normalized_plate WHERE is_active = true`
- partial unique index on `user_id WHERE is_active = true AND is_default = true`
- migration deterministically selects the oldest active vehicle as each
  owner's default

---

### 3. rides
Sürücülər tərəfindən elan edilən gedişlər. Koordinatlar üçün PostGIS Geometry (POINT, SRID 4326) istifadə olunur.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| driver_id | UUID | NOT NULL, FOREIGN KEY (users.id) |
| vehicle_id | UUID | NOT NULL, FOREIGN KEY (vehicles.id) |
| origin_location | GEOMETRY(POINT, 4326)| NOT NULL |
| origin_city | VARCHAR(100) | NOT NULL |
| destination_location| GEOMETRY(POINT, 4326)| NOT NULL |
| destination_city | VARCHAR(100) | NOT NULL |
| intermediate_cities| TEXT | |
| departure_time | TIMESTAMP | NOT NULL |
| total_seats | INTEGER | NOT NULL |
| available_seats | INTEGER | NOT NULL |
| available_spots | JSON | Compatibility projection of currently free seat codes |
| price_per_seat | NUMERIC(12,2) | NOT NULL |
| status | VARCHAR(20) | DEFAULT 'active' (active, cancelled, completed) |
| description | TEXT | |
| smoking_allowed | BOOLEAN | DEFAULT FALSE |
| pets_allowed | BOOLEAN | DEFAULT FALSE |
| music_allowed | BOOLEAN | DEFAULT TRUE |
| female_only | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW() |

**İndekslər:**
- `idx_rides_origin_location` ON rides USING GIST (origin_location)
- `idx_rides_destination_location` ON rides USING GIST (destination_location)

---

### 4. bookings
Sərnişinlərin gedişlərə göndərdikləri rezervasiya sorğuları.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| ride_id | UUID | NOT NULL, FOREIGN KEY (rides.id) |
| passenger_id | UUID | NOT NULL, FOREIGN KEY (users.id) |
| seats_booked | INTEGER | NOT NULL |
| selected_spots | JSON | Compatibility projection of allocated seat codes |
| total_price | NUMERIC(12,2) | |
| status | VARCHAR(20) | DEFAULT 'pending' (pending, accepted, paid, boarded, no_show, rejected, cancelled, expired, completed) |
| payment_deadline | TIMESTAMP | Pending hold/payment expiry |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### 5. ride_seats
Authoritative seat inventory snapshot for each ride.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| ride_id | UUID | NOT NULL, FOREIGN KEY (rides.id), ON DELETE CASCADE |
| spot | VARCHAR(20) | NOT NULL |
| is_enabled | BOOLEAN | NOT NULL, DEFAULT TRUE |
| created_at | TIMESTAMP | DEFAULT NOW() |

Unique constraint: `(ride_id, spot)`.

### 6. booking_seats
Exact seat allocations. Released rows remain as history.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| booking_id | UUID | NOT NULL, FOREIGN KEY (bookings.id), ON DELETE CASCADE |
| ride_seat_id | UUID | NOT NULL, FOREIGN KEY (ride_seats.id), ON DELETE CASCADE |
| released_at | TIMESTAMP | NULL while active |
| created_at | TIMESTAMP | DEFAULT NOW() |

Partial unique index on `ride_seat_id WHERE released_at IS NULL` prevents
double-booking the same seat.

---

### 7. payments
Booking-lə bağlı ödəniş tranzaksiyaları və provider metadata.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| booking_id | UUID | NOT NULL, FOREIGN KEY (bookings.id) |
| amount | NUMERIC(12,2) | NOT NULL |
| status | VARCHAR(50) | DEFAULT 'pending' (pending, succeeded, failed, cancelled, refunded) |
| transaction_id | VARCHAR(255) | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

---

### 8. messages
Gediş iştirakçıları (sürücü və təsdiqlənmiş sərnişinlər) arasında WebSocket vasitəsilə göndərilən mesajlar.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| ride_id | UUID | NOT NULL, FOREIGN KEY (rides.id) |
| sender_id | UUID | NOT NULL, FOREIGN KEY (users.id) |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### 9. reviews
Tamamlanmış gedişlərdən sonra sürücü və sərnişinlərin bir-birinə yazdıqları rəylər.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| ride_id | UUID | NOT NULL, FOREIGN KEY (rides.id) |
| author_id | UUID | NOT NULL, FOREIGN KEY (users.id) |
| target_id | UUID | NOT NULL, FOREIGN KEY (users.id) |
| rating | INTEGER | NOT NULL, CHECK (rating BETWEEN 1 AND 5) |
| comment | TEXT | |
| created_at | TIMESTAMP | DEFAULT NOW() |

**Məhdudiyyət (Unique Constraint):**
- Müəllif eyni gediş üçün yalnız bir rəy yaza bilər: `UNIQUE (ride_id, author_id)`
- İstifadəçi özünə rəy yaza bilməz: `CHECK (author_id != target_id)`

---

### 10. device_tokens
Cihazların FCM/APNs push bildiriş tokenləri.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| user_id | UUID | NOT NULL, FOREIGN KEY (users.id, ON DELETE CASCADE) |
| token | VARCHAR(255) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### 11. vehicle_documents

Phase 3 addition. Stores driver vehicle document uploads for admin review.

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| vehicle_id | UUID | NOT NULL, FK vehicles.id ON DELETE CASCADE |
| document_type | VARCHAR(50) | NOT NULL, CHECK IN ('registration','insurance','inspection') |
| storage_key | VARCHAR(500) | NOT NULL |
| mime_type | VARCHAR(100) | NOT NULL |
| size_bytes | INTEGER | NOT NULL |
| sha256 | VARCHAR(64) | NOT NULL |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' |
| processing_status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' |
| expires_at | TIMESTAMPTZ | NULL |
| ai_recommendation | VARCHAR(20) | NULL ('approve','needs_review','reject') |
| ai_confidence | NUMERIC(4,3) | NULL |
| ai_issues | JSON | NULL |
| ai_metadata | JSON | NULL |
| reviewed_by | UUID | NULL, FK users.id |
| reviewed_at | TIMESTAMPTZ | NULL |
| rejection_reason | TEXT | NULL |
| version | INTEGER | NOT NULL, DEFAULT 1 |
| is_current | BOOLEAN | NOT NULL, DEFAULT TRUE |
| created_at | TIMESTAMPTZ | DEFAULT now() |

Indexes:

- `ix_vehicle_documents_vehicle_id` ON vehicle_documents(vehicle_id)
- `uq_vehicle_documents_current` UNIQUE (vehicle_id, document_type) WHERE is_current = true

Rules:

- Uploading a new doc retires the previous `is_current` doc of the same type
- `version` increments on every admin decision; returns 409 if `expected_version` mismatches (optimistic lock)
- `sync_vehicle_verification_status()` recomputes `vehicles.verification_status` after each decision
- `POST /rides/` returns 403 if `vehicles.verification_status != 'approved'`
