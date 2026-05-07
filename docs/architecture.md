# Architecture — Yolüstü

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        MA["📱 Mobile App<br/>(Flutter / React Native)"]
        AP["🖥️ Admin Panel<br/>(React Web)"]
    end
    
    subgraph "API Layer"
        API["🔗 Backend API<br/>(Django REST / FastAPI)"]
    end
    
    subgraph "Data Layer"
        DB["🗄️ PostgreSQL"]
    end
    
    MA -->|REST API / JWT| API
    AP -->|REST API / JWT| API
    API -->|ORM| DB
```

## Sprint 0 Prototipi Arxitekturası

Sprint 0-da real backend yoxdur. Prototipi aşağıdakı arxitektura ilə qurulub:

```mermaid
graph LR
    subgraph "Next.js App (Sprint 0)"
        Pages["📄 Pages<br/>(App Router)"]
        Comp["🧩 Components"]
        Store["📦 Zustand Store<br/>(Mock State)"]
        Mock["🗂️ Mock Data"]
    end
    
    Pages --> Comp
    Pages --> Store
    Store --> Mock
```

## Komponent Arxitekturası

```
src/
├── app/              # Next.js App Router pages
│   ├── auth/         # Authentication pages
│   ├── profile/      # Profile pages
│   ├── search/       # Search page
│   ├── trips/        # Trip listing & details
│   ├── bookings/     # Booking management
│   ├── driver/       # Driver dashboard
│   ├── reviews/      # Review creation
│   └── admin/        # Admin panel
├── components/
│   ├── layout/       # MobileShell, BottomNav, TopBar
│   ├── ui/           # Button, Card, Input, Badge, etc.
│   ├── trips/        # TripCard, RouteTimeline, TripFilters
│   ├── bookings/     # BookingCard, BookingRequestCard
│   ├── reviews/      # ReviewCard, ReviewForm
│   ├── profile/      # ProfileHeader
│   └── admin/        # AdminLayout
├── data/             # Mock data
├── types/            # TypeScript interfaces
├── lib/              # Utils, mock API, routes
└── store/            # Zustand global state
```

## Gələcək Texnologiya Yığını

| Komponent | Texnologiya | Səbəb |
|---|---|---|
| **Mobil Tətbiq** | Flutter və ya React Native | Cross-platform, bir codebase |
| **Backend** | Django REST Framework və ya FastAPI | Python ekosistemi, sürətli inkişaf |
| **Verilənlər Bazası** | PostgreSQL | Güclü relational DB |
| **Autentifikasiya** | JWT (JSON Web Tokens) | Stateless, mobil uyğun |
| **Admin Panel** | Django Admin və ya React Admin | Sürətli admin yaratma |
| **API Sənədləri** | Swagger / OpenAPI | Avtomatik sənədləşdirmə |
| **CI/CD** | GitHub Actions | Avtomatik test və deploy |
| **Hosting** | Docker + Cloud (AWS/GCP) | Miqyaslana bilən infrastruktur |

## Data Flow

```mermaid
sequenceDiagram
    participant P as Sərnişin
    participant A as API
    participant D as Sürücü
    
    P->>A: Gediş axtar
    A->>P: Gediş siyahısı
    P->>A: Rezerv sorğusu göndər
    A->>D: Yeni sorğu bildirişi
    D->>A: Sorğunu qəbul et
    A->>P: Rezerv təsdiqləndi
    
    Note over P,D: Gediş tamamlandıqdan sonra
    P->>A: Rəy yaz
    A->>D: Reytinq yeniləndi
```

## Təhlükəsizlik

- JWT token ilə autentifikasiya
- Hər endpoint üçün icazə yoxlaması
- İstifadəçi yalnız öz resurslarını idarə edə bilir
- Admin ayrıca roldur
- Şifrələr hash edilir
