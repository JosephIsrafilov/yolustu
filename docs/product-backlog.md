# Product Backlog — Yolmates

## Epics

### Epic 1: Mobile Authentication
| # | User Story | Prioritet | Status | Sprint |
|---|---|---|---|---|
| US-01 | İstifadəçi qeydiyyatı (Phone, Ad, Soyad) | Yüksək | ✅ Tamamlandı | Sprint 1 |
| US-02 | İstifadəçi girişi (Phone OTP, JWT tokens) | Yüksək | ✅ Tamamlandı | Sprint 1 |

### Epic 2: User Profile
| # | User Story | Prioritet | Status | Sprint |
|---|---|---|---|---|
| US-03 | Profil yaradılması, yenilənməsi və sənəd yükləmə | Yüksək | ✅ Tamamlandı | Sprint 1 |

### Epic 3: Driver Trip Management
| # | User Story | Prioritet | Status | Sprint |
|---|---|---|---|---|
| US-04 | Sürücü gediş yaradır (İİ qiymət, Leaflet xəritə) | Yüksək | ✅ Tamamlandı | Sprint 2, 4 |
| US-05 | Sürücü gedişi ləğv edir / tamamlayır | Orta | ✅ Tamamlandı | Sprint 2, 5 |

### Epic 4: Passenger Search
| # | User Story | Prioritet | Status | Sprint |
|---|---|---|---|---|
| US-06 | Sərnişin gediş axtarır (PostGIS radius/şəhər axtarışı) | Yüksək | ✅ Tamamlandı | Sprint 2 |
| US-07 | Sərnişin gediş detallarını və sürücü rəylərini görür | Yüksək | ✅ Tamamlandı | Sprint 2 |

### Epic 5: Booking & Payment System
| # | User Story | Prioritet | Status | Sprint |
|---|---|---|---|---|
| US-08 | Sərnişin rezerv sorğusu göndərir və Stripe ödənişi edir | Yüksək | ✅ Tamamlandı | Sprint 3, 4 |
| US-09 | Sürücü sorğunu qəbul/rədd edir (Stripe təsdiqli) | Yüksək | ✅ Tamamlandı | Sprint 3, 4 |
| US-10 | Sərnişin rezervi ləğv edir (yerlər geri qaytarılır) | Orta | ✅ Tamamlandı | Sprint 3 |

### Epic 6: Rating & Reviews
| # | User Story | Prioritet | Status | Sprint |
|---|---|---|---|---|
| US-11 | İstifadəçi tamamlanmış gedişə görə rəy/reytinq yazır | Orta | ✅ Tamamlandı | Sprint 4 |

### Epic 7: Admin Panel
| # | User Story | Prioritet | Status | Sprint |
|---|---|---|---|---|
| US-12 | Admin istifadəçi/gediş/rezerv moderasiya edir | Orta | ✅ Tamamlandı | Sprint 4 |

### Epic 8: Mobile UI/UX & Web Compatibility
| # | Tapşırıq | Prioritet | Status | Sprint |
|---|---|---|---|---|
| T-01 | Design system və mobil responsiv interfeys yaradılması | Yüksək | ✅ Tamamlandı | Sprint 0 |
| T-02 | React 19 typings və TimePicker debounced refaktorinqi | Yüksək | ✅ Tamamlandı | Sprint 5 |
| T-03 | Leaflet map container z-index və koordinat sinxronizasiyası | Yüksək | ✅ Tamamlandı | Sprint 5 |

### Epic 9: Testing & Documentation
| # | Tapşırıq | Prioritet | Status | Sprint |
|---|---|---|---|---|
| T-04 | Backend unit testləri (`pytest` ilə) | Orta | ✅ Tamamlandı | Sprint 2+ |
| T-05 | Frontend typecheck və linter (`tsc`, `eslint`) | Orta | ✅ Tamamlandı | Sprint 5 |
| T-06 | API kontraktları və verilənlər bazası sənədləşməsi | Yüksək | ✅ Tamamlandı | Sprint 5 |

---

## Backlog Prioritet Qaydaları

1. **Yüksək** — MVP üçün mütləq lazım, ilk sprintlərdə
2. **Orta** — MVP-yə daxil, amma sonraki sprintlərə təxirə salına bilər
3. **Aşağı** — Nice-to-have, son mərhələlərdə əlavə edilə bilər

---

## Sprint Planlaması (Bütün Sprint-lər uğurla yekunlaşıb)

| Sprint | Fokus | Status |
|---|---|---|
| Sprint 0 | Kliklənə bilən Next.js frontend prototipi | ✅ Tamamlandı |
| Sprint 1 | FastAPI + PostgreSQL/Redis backend, telefon OTP auth, profillər | ✅ Tamamlandı |
| Sprint 2 | Gediş və nəqliyyat vasitələri CRUD, PostGIS coğrafi axtarış | ✅ Tamamlandı |
| Sprint 3 | Rezervasiya (Booking) sistemi, real-time WebSocket qrup çatı | ✅ Tamamlandı |
| Sprint 4 | Stripe Sandbox ödənişləri, NVIDIA NIM İİ qiymət tövsiyələri | ✅ Tamamlandı |
| Sprint 5 | React 19 typings, Leaflet maps z-index bug-fix, sənədlərin yenilənməsi | ✅ Tamamlandı |
