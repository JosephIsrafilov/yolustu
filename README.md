# 🚗 YolUstu (Yol Üstü)

> Carpooling platform for Azerbaijan — easy search and offer of rides between cities.

## About

**YolUstu** is a centralized carpooling platform for Azerbaijan. It solves the problem of chaotic ride-searching through WhatsApp groups and Telegram by providing a convenient service with identity verification, ratings, and online payments.

## Tech Stack

| Component | Technology |
|---|---|
| **Backend** | Node.js + NestJS (Modular Monolith) |
| **Database** | PostgreSQL + PostGIS |
| **Cache** | Redis |
| **Web** | Next.js (React) |
| **Mobile** | React Native |
| **Maps** | Google Maps API |
| **Payments** | Payriff / Kapital Bank |
| **SMS** | lsim.az |
| **CI/CD** | GitHub Actions |
| **Infrastructure** | Docker + Docker Compose |

## Architecture

Modular Monolith — a single NestJS application split into isolated modules:

```
src/
├── modules/
│   ├── auth/          # Authentication, SMS OTP, JWT
│   ├── users/         # Profiles, KYC verification
│   ├── rides/         # Rides, geo-search
│   ├── bookings/      # Booking
│   ├── payments/      # Payriff integration
│   ├── chat/          # WebSocket chat
│   ├── notifications/ # Push, SMS
│   └── reviews/       # Ratings and reviews
├── common/            # Shared: guards, pipes, filters, DTOs
├── config/            # Configuration (env, database)
└── main.ts
```

## Key Features (MVP)

- 🔍 Ride search by route, date, and time (PostGIS geo-search)
- 📱 Registration via SMS OTP
- 💳 Online booking and payment
- ⭐ Ratings and reviews
- 💬 Real-time chat (WebSocket)
- 🔔 Push notifications

## Documentation

- [📋 Project Plan](./yolustu_plan.md)
- [🏗️ Architecture](./yolustu_architecture.md)

## Getting Started (dev)

```bash
# Install dependencies
npm install

# Start in dev mode
docker compose up -d   # PostgreSQL, Redis
npm run dev
```

## License

MIT
