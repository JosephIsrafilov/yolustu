# Historical note: this document is kept for project history. For current implementation status, use docs/PROJECT_STATE.md and docs/INDEX.md.

# Risks and Metrics — Yolmates

## Risklər

| # | Risk | Ehtimal | Təsir | Mitigasiya |
|---|---|---|---|---|
| R-01 | Mobil tətbiq inkişafı gözləniləndən çox vaxt alır | Yüksək | Yüksək | UI-ı sadə saxlamaq, Next.js ilə responsiv mobil interfeys hazırlamaq |
| R-02 | Backend/mobil inteqrasiya problemləri | Orta | Yüksək | API-ı erkən müəyyən etmək, əvvəlcədən hazırlanmış API kontraktına əsasən yazmaq |
| R-03 | Rezerv logikasının mürəkkəbliyi | Orta | Orta | Sadə statuslar istifadə etmək, idempotent payment callbacks ilə avtomatlaşdırmaq |
| R-04 | Çox çox xüsusiyyət əlavə edilməsi | Yüksək | Yüksək | MVP hüdudlarını qorumaq, scope creep-dən qaçmaq |
| R-05 | Müdafiə əvvəl bug-lar | Orta | Yüksək | Son sprinti QA və re-refactor üçün ayırmaq, React 19 typings və map z-index məsələlərini tam həll etmək |
| R-06 | Zəif sənədləşdirmə | Aşağı | Orta | Hər sprintdə və hər mühüm dəyişiklikdə sənədləri yeniləmək |
| R-07 | Performans problemləri | Aşağı | Orta | SQL sorğuları, geo-indekslər, Redis keş mexanizmləri |
| R-08 | UX/UI narahatlığı | Orta | Orta | İnteraktiv xəritələr və İİ köməkçisi ilə gediş yaratmanı sadələşdirmək |

---

## Mitigasiya Strategiyaları

### Vaxt İdarəetməsi
- Veb tətbiq interfeysini mobil ölçülər üçün tam responsiv etmək (Next.js + Tailwind)
- P0 əsas istifadəçi axınlarını tam işlək vəziyyətə gətirmək
- React 19-da qarşıya çıxan ref və timeout xətalarını anında aradan qaldırmaq

### Texniki Risklər
- API kontraktlarını ciddi şəkildə Pydantic sxemləri səviyyəsində qorumaq
- PostgreSQL + PostGIS inteqrasiyasını local olaraq Docker container-də test etmək
- TypeScript ilə statik tip təhlükəsizliyini təmin etmək

### Proses Riskləri
- Son mərhələdə refaktorinq və QA sınaqları həyata keçirmək
- Verilənlər bazası sxemi və API kontraktları sənədlərini kod dəyişikliklərinə paralel olaraq yeniləmək

---

## Uğur Metrikləri

| Metrik | Hədəf | Ölçmə Metodu |
|---|---|---|
| Tamamlanmış user story-lər | 100% | Sprint review-da sayılır |
| Sprint məqsədlərinin yerinə yetirilməsi | 100% | Hər sprint sonunda yoxlanılır |
| Kritik bug-ların həll edilməsi | 100% | Manual və avtomatlaşdırılmış testlərlə yoxlanılır |
| İşləyən tam mobil user flow | Var | Demo ssenarisi ilə yoxlanılır |
| Tam Scrum sənədləşdirmə | Var | Docs/ qovluğu yoxlanılır |
| Stabil demo | Kritik xətasız | Demo ssenarisi ilə test edilir |

---

## Sprint-lər Üzrə Risklərin İzlənməsi

| Sprint | Əsas Risk | Status |
|---|---|---|
| Sprint 0 | Prototipin vaxtında tamamlanması | ✅ Həll edildi |
| Sprint 1 | Backend qurulması, DB sxemi və auth | ✅ Həll edildi |
| Sprint 2 | Gediş CRUD mürəkkəbliyi, PostGIS axtarış | ✅ Həll edildi |
| Sprint 3 | Rezerv logikası və WebSockets real-time çat | ✅ Həll edildi |
| Sprint 4 | Provider abstraction ödənişləri və İİ Smart Pricing | ✅ Həll edildi |
| Sprint 5 | React 19 / Leaflet z-index bugları və sənədləşmə | ✅ Həll edildi |
