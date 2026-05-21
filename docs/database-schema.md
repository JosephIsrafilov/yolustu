# Verilənlər Bazası Sxemi — Yolüstü

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
        float price_per_seat
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
        float total_price
        varchar status
        timestamp created_at
    }

    payments {
        uuid id PK
        uuid booking_id FK
        float amount
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
| created_at | TIMESTAMP | DEFAULT NOW() |

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
| price_per_seat | FLOAT | NOT NULL |
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
| total_price | FLOAT | |
| status | VARCHAR(20) | DEFAULT 'pending' (pending, accepted, rejected, cancelled, completed) |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### 5. payments
Stripe ödəmə tranzaksiyaları.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| booking_id | UUID | NOT NULL, FOREIGN KEY (bookings.id) |
| amount | FLOAT | NOT NULL |
| status | VARCHAR(50) | DEFAULT 'pending' (pending, completed, failed) |
| transaction_id | VARCHAR(255) | |
| created_at | TIMESTAMP | DEFAULT NOW() |
| updated_at | TIMESTAMP | |

---

### 6. messages
Gediş iştirakçıları (sürücü və təsdiqlənmiş sərnişinlər) arasında WebSocket vasitəsilə göndərilən mesajlar.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| ride_id | UUID | NOT NULL, FOREIGN KEY (rides.id) |
| sender_id | UUID | NOT NULL, FOREIGN KEY (users.id) |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

### 7. reviews
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

### 8. device_tokens
Cihazların FCM/APNs push bildiriş tokenləri.

| Sütun | Tip | Məhdudiyyətlər (Constraints) |
|---|---|---|
| id | UUID | PRIMARY KEY |
| user_id | UUID | NOT NULL, FOREIGN KEY (users.id, ON DELETE CASCADE) |
| token | VARCHAR(255) | NOT NULL, UNIQUE |
| created_at | TIMESTAMP | DEFAULT NOW() |
