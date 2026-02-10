# 🗺️ Proje Yol Haritası

> AI Mülakat Platformu — Fazlara Ayrılmış Geliştirme Planı

## Bağımlılık Grafiği

```
FAZ 0 ─── Temel Altyapı & Doğrulama
  │
  ├──► FAZ 1 ─── Sesli AI Ajanı (Voice Pipeline)
  │      │
  │      ├──► FAZ 2 ─── Mülakat Oturum Yönetimi
  │      │      │
  │      │      ├──► FAZ 3 ─── Live Coding Modülü
  │      │      │      │
  │      │      │      └──► FAZ 5A ─── Practice Coding
  │      │      │
  │      │      ├──► FAZ 4 ─── System Design (Whiteboard)
  │      │      │
  │      │      ├──► FAZ 5B ─── Phone Screen
  │      │      │
  │      │      └──► FAZ 6 ─── Kişiselleştirme (Job Parse, Resume, Memory)
  │      │             │
  │      │             └──► FAZ 7 ─── Raporlama & Geri Bildirim
  │      │                    │
  │      │                    └──► FAZ 8 ─── Enterprise Panel
  │      │
  │      └──► FAZ 9 ─── Frontend UI
  │
  └──► FAZ 10 ── Production & Optimizasyon
```

## Faz Dosyaları (Bağımlılık Sırasına Göre)

| #  | Dosya | Başlık | Bağımlılık | Öncelik |
|----|-------|--------|------------|---------|
| 0  | [FAZ-00.md](./FAZ-00.md) | Temel Altyapı & Doğrulama | — | 🔴 P0 |
| 1  | [FAZ-01.md](./FAZ-01.md) | Sesli AI Ajanı (Voice Pipeline) | Faz 0 | 🔴 P0 |
| 9  | [FAZ-09.md](./FAZ-09.md) | Frontend UI & Tasarım Sistemi | Faz 0 | 🔴 P0 |
| 2  | [FAZ-02.md](./FAZ-02.md) | Mülakat Oturum Yönetimi | Faz 0, 1 | 🟠 P1 |
| 3  | [FAZ-03.md](./FAZ-03.md) | Live Coding Modülü | Faz 1, 2 | 🟠 P1 |
| 5  | [FAZ-05.md](./FAZ-05.md) | Phone Screen & Practice | Faz 1, 2 | 🟡 P2 |
| 4  | [FAZ-04.md](./FAZ-04.md) | System Design (Whiteboard) | Faz 1, 2 | 🟢 P3 |
| 6  | [FAZ-06.md](./FAZ-06.md) | Kişiselleştirme & Hazırlık | Faz 2 | 🟢 P3 |
| 7  | [FAZ-07.md](./FAZ-07.md) | Raporlama & Geri Bildirim | Faz 2, 3, 6 | 🟡 P2 |
| 8  | [FAZ-08.md](./FAZ-08.md) | Enterprise Panel | Faz 2, 7 | 🔵 P4 |
| 10 | [FAZ-10.md](./FAZ-10.md) | Production & Optimizasyon | Tümü | ⚪ P5 |

## Hackathon MVP Sırası

Minimum viable demo için bu sırayla ilerle:

1. **FAZ-00** → Altyapıyı kur, tüm servislerin ayakta olduğunu doğrula
2. **FAZ-01** → Sesli AI ajanı çalışsın (mikrofon → STT → LLM → TTS → hoparlör)
3. **FAZ-09** → Temel UI: Dashboard + Mülakat odası arayüzü
4. **FAZ-02** → Oturum yönetimi (mülakat kaydedilsin, mesajlar persist olsun)
5. **FAZ-03** → Live Coding modülü (kod editörü + AI analizi)
6. **FAZ-07** → Basit mülakat raporu

## Teknoloji Stack Özeti

| Katman | Teknoloji |
|--------|-----------|
| Runtime | Bun |
| API Framework | Hono + oRPC |
| Database | Convex (real-time) |
| Auth | better-auth + Convex plugin |
| Validation | Zod v4 |
| STT | Freya STT (fal.ai) |
| TTS | Freya TTS (fal.ai) |
| LLM | OpenRouter |
| AI SDK | @fal-ai/client |
| Frontend | TBD (React/Solid) + Tailwind |

## Kurallar

- Her faz dosyası bağımsız okunabilir
- Her task'ta ilgili dosya yolları ve paketler belirtilir
- Kod yazılmaz, sadece ne yapılacağı ve nasıl yapılacağı anlatılır
- Checkbox'lar tamamlandıkça işaretlenir
