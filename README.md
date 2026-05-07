# 🚗 Yolüstü — Azərbaycan Carpooling Platforması

> Şəhərlərarası gedişləri tap, paylaş, ucuz və rahat səyahət et.

## Layihə Haqqında

**Yolüstü** — Azərbaycan bazarı üçün hazırlanmış carpooling (ortaq gediş) platformasıdır. Tətbiq sərnişinlərə sürücülərlə şəhərlərarası gedişləri paylaşmağa imkan verir.

- Sürücülər gediş elan edir
- Sərnişinlər gediş axtarır və rezerv sorğusu göndərir
- Sürücü sorğunu qəbul və ya rədd edir
- MVP yalnız fərdi maşınlarla carpooling-ə fokuslanır

## Sprint 0 Məqsədi

Sprint 0 layihənin əsasını hazırlayır:
- ✅ Məhsul vizyonu və MVP hüdudları
- ✅ Scrum prosesi və rol bölgüsü
- ✅ Product Backlog və User Story-lər
- ✅ Arxitektura və verilənlər bazası sxemi
- ✅ API kontraktı
- ✅ Mobil-first UI prototipi (clickable)
- ✅ Mock data ilə işləyən bütün ekranlar
- ✅ Admin paneli
- ✅ Sənədləşdirmə

## Texnologiya Yığını (Sprint 0 Prototipi)

| Komponent | Texnologiya |
|---|---|
| Frontend | Next.js 16 + TypeScript |
| Stil | Tailwind CSS v4 |
| State | Zustand |
| İkonlar | Lucide React |
| Data | Mock data (in-memory) |

### Gələcək Tövsiyə Olunan Yığın

| Komponent | Texnologiya |
|---|---|
| Mobil Tətbiq | Flutter və ya React Native |
| Backend | Django REST Framework və ya FastAPI |
| Verilənlər Bazası | PostgreSQL |
| Autentifikasiya | JWT |
| Admin Panel | Django Admin və ya React Admin |
| API Sənədləri | Swagger / OpenAPI |

## Necə İşə Salmaq

```bash
# Bağımlılıqları quraşdırın
npm install

# Development serveri başladın
npm run dev

# Production build
npm run build
```

Tətbiq `http://localhost:3000` ünvanında açılacaq.

## Demo İstifadəçilər

| Rol | Email | Şifrə |
|---|---|---|
| Sürücü | elvin@example.com | istənilən |
| Sərnişin | aysel@example.com | istənilən |
| Sürücü | murad@example.com | istənilən |
| Admin | sanan@example.com | istənilən |

## Qovluq Strukturu

```
yolustu/
├── docs/                    # Sənədləşdirmə
│   ├── sprint-0-report.md
│   ├── product-vision.md
│   ├── mvp-scope.md
│   ├── scrum-roles.md
│   ├── product-backlog.md
│   ├── user-stories.md
│   ├── acceptance-criteria.md
│   ├── architecture.md
│   ├── api-contract.md
│   ├── database-schema.md
│   ├── demo-scenario.md
│   └── risks-and-metrics.md
├── src/
│   ├── app/                 # Next.js səhifələr
│   │   ├── auth/            # Qeydiyyat / Giriş
│   │   ├── profile/         # Profil
│   │   ├── search/          # Axtarış
│   │   ├── trips/           # Gedişlər
│   │   ├── bookings/        # Rezervlər
│   │   ├── driver/          # Sürücü paneli
│   │   ├── reviews/         # Rəylər
│   │   └── admin/           # Admin paneli
│   ├── components/          # UI komponentləri
│   ├── data/                # Mock data
│   ├── types/               # TypeScript tipləri
│   ├── lib/                 # Utillar, mock API
│   └── store/               # Zustand store
└── package.json
```

## İmplementasiya Olunan Ekranlar

1. **Welcome/Onboarding** — `/`
2. **Qeydiyyat** — `/auth/register`
3. **Daxil ol** — `/auth/login`
4. **Profil qurulması** — `/profile/setup`
5. **Profil** — `/profile`
6. **Gediş axtarışı** — `/search`
7. **Gediş siyahısı** — `/trips`
8. **Gediş detalları** — `/trips/[id]`
9. **Rezervlərim** — `/bookings`
10. **Rezerv sorğuları** — `/bookings/requests`
11. **Sürücü paneli** — `/driver`
12. **Gediş yarat** — `/driver/create-trip`
13. **Gedişlərim** — `/driver/my-trips`
14. **Rəy yaz** — `/reviews/create`
15. **Admin panel** — `/admin`
16. **Admin istifadəçilər** — `/admin/users`
17. **Admin gedişlər** — `/admin/trips`
18. **Admin rezervlər** — `/admin/bookings`

## Mock Axınlar

- ✅ Qeydiyyat → Profil qurulması → Axtarış
- ✅ Giriş → Axtarış → Gediş detalları → Rezerv sorğusu
- ✅ Sürücü: Gediş yaratma (5 addım) → Gedişlərim
- ✅ Sürücü: Rezerv sorğularını qəbul/rədd etmə
- ✅ Sərnişin: Rezerv ləğvi
- ✅ Rəy yazma (tamamlanmış gediş üçün)
- ✅ Admin: İstifadəçi bloklama, gediş silmə
- ✅ Rol dəyişdirmə (Sərnişin ↔ Sürücü)

## Sprint 0 Nəticələri

### Daxil olanlar
- İşləyən prototipi olan 18 mobil-first ekran
- Zustand ilə mock state management
- Bütün iş qaydaları (öz gedişinə rezerv qadağası, yer azalması, reytinq yenilənməsi)
- 12+ sənəd
- Tam API kontraktı
- ER diaqramı ilə verilənlər bazası sxemi

### Daxil olmayanlar
- Real backend
- Real autentifikasiya
- Ödəniş sistemi
- GPS / xəritə
- Push bildirişlər
- Sürücü sənəd yoxlanışı

## Sprint 1 Planı

1. Backend layihəsinin qurulması (Django/FastAPI)
2. User/Profile modelləri
3. Qeydiyyat API
4. Login/Logout API
5. JWT autentifikasiya
6. Mobil tətbiq auth ekranlarını backend-ə qoşma
7. Profil API
8. Xəta idarəetməsi
9. Validasiya
10. Auth axınının testi

## Lisenziya

MIT
