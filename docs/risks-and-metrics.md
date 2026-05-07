# Risks and Metrics — Yolüstü

## Risklər

| # | Risk | Ehtimal | Təsir | Mitigasiya |
|---|---|---|---|---|
| R-01 | Mobil tətbiq inkişafı gözləniləndən çox vaxt alır | Yüksək | Yüksək | UI-ı sadə saxlamaq, MVP hüdudlarını qorumaq |
| R-02 | Backend/mobil inteqrasiya problemləri | Orta | Yüksək | API-ı erkən müəyyən etmək, mock API ilə işləmək |
| R-03 | Rezerv logikasının mürəkkəbliyi | Orta | Orta | Sadə statuslar istifadə etmək (5 status) |
| R-04 | Çox çox xüsusiyyət əlavə edilməsi | Yüksək | Yüksək | MVP hüdudlarını qorumaq, scope creep-dən qaçmaq |
| R-05 | Müdafiə əvvəl bug-lar | Orta | Yüksək | Son sprinti QA üçün ayırmaq |
| R-06 | Zəif sənədləşdirmə | Aşağı | Orta | Hər sprintdə sənədləri yeniləmək |
| R-07 | Performans problemləri | Aşağı | Orta | Sadə sorğular, indekslər, pagination |
| R-08 | UX/UI narahatlığı | Orta | Orta | Tez-tez istifadəçi rəyi almaq |

## Mitigasiya Strategiyaları

### Vaxt İdarəetməsi
- UI-ı sadə və təmiz saxlamaq
- Əvvəlcə əsas axınları tamamlamaq
- Estetika əvəzinə funksionallığa fokuslanmaq (lakin minimum keyfiyyəti qorumaq)

### Texniki Risklər
- API kontraktını erkən yazmaq (Sprint 0-da edildi)
- Mock data ilə frontend inkişafını backend-dən asılı olmadan aparmaq
- TypeScript ilə tip təhlükəsizliyini təmin etmək

### Proses Riskləri
- MVP scope-unu qorumaq — "nice-to-have" xüsusiyyətləri ayırmaq
- Hər sprint sonunda retrospective keçirmək
- Son sprinti test və bug-fix üçün ayırmaq
- Sənədləşdirməni hər sprintdə yeniləmək

## Uğur Metrikləri

| Metrik | Hədəf | Ölçmə Metodu |
|---|---|---|
| Tamamlanmış user story-lər | ≥ 80% | Sprint review-da sayılır |
| Sprint məqsədlərinin yerinə yetirilməsi | ≥ 90% | Hər sprint sonunda yoxlanılır |
| Kritik bug-ların həll edilməsi | 100% | Bug tracker-da izlənilir |
| İşləyən tam mobil user flow | Var | Demo ssenarisi ilə yoxlanılır |
| Rəhbər rəyi | Müsbət | Sprint review-da alınır |
| Tam Scrum sənədləşdirmə | Var | Docs/ qovluğu yoxlanılır |
| Stabil demo | Kritik xətasız | Demo ssenarisi ilə test edilir |

## Sprint-lər Üzrə Risklərin İzlənməsi

| Sprint | Əsas Risk | Status |
|---|---|---|
| Sprint 0 | Prototipin vaxtında tamamlanması | ✅ Həll edildi |
| Sprint 1 | Backend qurulması | ⏳ Gözlənilir |
| Sprint 2 | Gediş CRUD mürəkkəbliyi | ⏳ Gözlənilir |
| Sprint 3 | Rezerv logikası | ⏳ Gözlənilir |
| Sprint 4 | Rəy + Admin + QA | ⏳ Gözlənilir |
| Sprint 5 | Final demo hazırlığı | ⏳ Gözlənilir |
