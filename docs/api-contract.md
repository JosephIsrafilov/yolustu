# API Contract — Yolüstü

Bu sənəd gələcək backend API endpointlərinin kontraktını təsvir edir.
Sprint 0-da bu endpointlər implementasiya edilmir, yalnız mock funksiyalarla simulyasiya olunur.

---

## Authentication

### POST /api/auth/register/

**Məqsəd:** Yeni istifadəçi qeydiyyatı

**Request Body:**
```json
{
  "fullName": "Elvin Məmmədov",
  "email": "elvin@example.com",
  "phone": "+994501234567",
  "password": "securepass123"
}
```

**Response (201):**
```json
{
  "id": "u1",
  "fullName": "Elvin Məmmədov",
  "email": "elvin@example.com",
  "token": "jwt_token_here"
}
```

**Validasiya:**
- fullName: tələb olunur, 2-100 simvol
- email: tələb olunur, unikal, düzgün format
- phone: tələb olunur, +994 prefiksi
- password: tələb olunur, ən azı 6 simvol

---

### POST /api/auth/login/

**Məqsəd:** İstifadəçi girişi

**Request Body:**
```json
{
  "email": "elvin@example.com",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "id": "u1",
  "fullName": "Elvin Məmmədov",
  "email": "elvin@example.com",
  "role": "driver",
  "token": "jwt_token_here"
}
```

---

## Profile

### GET /api/profile/

**Məqsəd:** Cari istifadəçinin profilini al

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "u1",
  "fullName": "Elvin Məmmədov",
  "email": "elvin@example.com",
  "phone": "+994501234567",
  "city": "Bakı",
  "bio": "Bakıdan Gəncəyə tez-tez gediş-gəliş edirəm.",
  "rating": 4.8,
  "totalTrips": 34,
  "reviewsCount": 12
}
```

---

### PUT /api/profile/

**Məqsəd:** Profili yenilə

**Request Body:**
```json
{
  "fullName": "Elvin Məmmədov",
  "phone": "+994501234567",
  "city": "Bakı",
  "bio": "Yenilənmiş bio"
}
```

**Response (200):** Yenilənmiş profil obyekti

---

## Trips

### POST /api/trips/

**Məqsəd:** Yeni gediş yarat

**Request Body:**
```json
{
  "departureCity": "Bakı",
  "arrivalCity": "Gəncə",
  "meetingPoint": "28 May metro, çıxış 2",
  "dropoffPoint": "Gəncə avtovağzal",
  "date": "2026-05-12",
  "time": "08:00",
  "seatsTotal": 3,
  "pricePerSeat": 15,
  "carModel": "Toyota Prius",
  "comment": "Rahat maşın, AC var."
}
```

**Response (201):**
```json
{
  "id": "t1",
  "driverId": "u1",
  "departureCity": "Bakı",
  "arrivalCity": "Gəncə",
  "seatsAvailable": 3,
  "status": "active",
  "createdAt": "2026-05-07T06:00:00Z"
}
```

**Validasiya:**
- departureCity, arrivalCity: tələb olunur
- departureCity ≠ arrivalCity
- date: gələcək tarix olmalı
- seatsTotal: 1-4
- pricePerSeat: > 0

---

### GET /api/trips/

**Məqsəd:** Gedişləri axtar

**Query Parameters:**
- `departureCity` — filtrlə
- `arrivalCity` — filtrlə
- `date` — filtrlə
- `maxPrice` — filtrlə
- `minSeats` — filtrlə

**Response (200):**
```json
[
  {
    "id": "t1",
    "departureCity": "Bakı",
    "arrivalCity": "Gəncə",
    "date": "2026-05-12",
    "time": "08:00",
    "seatsAvailable": 2,
    "pricePerSeat": 15,
    "driver": { "id": "u1", "fullName": "Elvin Məmmədov", "rating": 4.8 },
    "carModel": "Toyota Prius",
    "status": "active"
  }
]
```

---

### GET /api/trips/{id}/

**Məqsəd:** Gediş detalları

**Response (200):** Tam Trip obyekti + driver profili + rəylər

---

### PATCH /api/trips/{id}/cancel/

**Məqsəd:** Gedişi ləğv et (yalnız sürücü)

**Response (200):**
```json
{ "id": "t1", "status": "cancelled" }
```

---

## Bookings

### POST /api/bookings/

**Məqsəd:** Rezerv sorğusu göndər

**Request Body:**
```json
{
  "tripId": "t1",
  "seatsRequested": 1
}
```

**Validasiya:**
- Istifadəçi öz gedişinə sorğu göndərə bilmir
- Kifayət qədər boş yer olmalıdır
- Eyni gedişə təkrar sorğu göndərilmir

**Response (201):**
```json
{ "id": "b1", "tripId": "t1", "status": "pending" }
```

---

### PATCH /api/bookings/{id}/accept/

**Məqsəd:** Sorğunu qəbul et (yalnız sürücü)

**Davranış:** Boş yer sayı azalır

---

### PATCH /api/bookings/{id}/reject/

**Məqsəd:** Sorğunu rədd et (yalnız sürücü)

---

### PATCH /api/bookings/{id}/cancel/

**Məqsəd:** Rezervi ləğv et (sərnişin)

**Davranış:** Əgər əvvəl qəbul edilmişsə, boş yer geri qaytarılır

---

## Reviews

### POST /api/reviews/

**Məqsəd:** Rəy yaz

**Request Body:**
```json
{
  "tripId": "t1",
  "targetUserId": "u1",
  "rating": 5,
  "comment": "Çox rahat gediş idi!"
}
```

**Validasiya:**
- Yalnız tamamlanmış gediş üçün
- Rating: 1-5
- Eyni gediş üçün təkrar rəy yoxdur

---

## Admin

### GET /api/admin/users/
İstifadəçilər siyahısı (admin only)

### PATCH /api/admin/users/{id}/block/
İstifadəçini blokla/bloku aç

### GET /api/admin/trips/
Bütün gedişlər siyahısı (admin only)

### DELETE /api/admin/trips/{id}/
Uyğunsuz gedişi sil

### GET /api/admin/bookings/
Bütün rezervlər siyahısı (admin only)
