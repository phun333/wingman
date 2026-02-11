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

---

## 📊 Güncel Durum (10 Şubat 2026)

### Progress Grafiği

```
FAZ 0  ████████████████████ 100%  ✅ Tamamlandı
FAZ 1  ████████████████████ 100%  ✅ Tamamlandı
FAZ 9  ████████████████████ 100%  ✅ Tamamlandı
FAZ 2  ████████████████████ 100%  ✅ Tamamlandı
FAZ 3  ████████████████████ 100%  ✅ Tamamlandı
FAZ 5  ████████████████░░░░  80%  🟡 Kısmi eksikler
FAZ 4  ████░░░░░░░░░░░░░░░░  20%  🟠 Sadece prompt var
FAZ 7  ░░░░░░░░░░░░░░░░░░░░   0%  ❌ Yapılmadı
FAZ 6  ░░░░░░░░░░░░░░░░░░░░   0%  ❌ Yapılmadı
FAZ 8  ░░░░░░░░░░░░░░░░░░░░   0%  ❌ Yapılmadı
FAZ 10 ░░░░░░░░░░░░░░░░░░░░   0%  ❌ Yapılmadı
```

### Detaylı Durum Tablosu

| Faz | Başlık | Durum | Yapılan | Eksik |
|-----|--------|-------|---------|-------|
| **0** | Temel Altyapı | ✅ %100 | Monorepo, ENV, Convex schema, Auth (better-auth), fal.ai/OpenRouter bağlantısı, proxy route'lar, tipler, seed data | — |
| **1** | Voice Pipeline | ✅ %100 | WebSocket `/ws/voice`, STT→LLM→TTS pipeline, streaming LLM+TTS, VAD, interrupt, PCM16 decode, AudioQueuePlayer, volume meter, auto-reconnect | — |
| **9** | Frontend UI | ✅ %100 | Vite+React+Tailwind, dark theme, AppLayout+Sidebar+Topbar, Login/Register, Dashboard, NewInterview wizard, InterviewRoom (voice-only + live-coding), History, auth guard, UI kit (Button/Card/Badge/Input/Toast) | — |
| **2** | Oturum Yönetimi | ✅ %100 | interviews CRUD (create/start/complete), messages persist, Convex'te interviews+messages tabloları, auth middleware, conversation history reload (reconnect), system prompt'lar (4 tür × 3 zorluk), problems tablosu+seed, getUserStats | — |
| **3** | Live Coding | ✅ %100 | Monaco editor, ResizableSplitter, ProblemPanel, TestResultsPanel, sandbox (node:vm JS + subprocess Python), test case runner, code_update/code_result WS mesajları, AI kod analizi, dil seçimi (JS/TS/Python), starter code | — |
| **5** | Phone Screen & Practice | 🟡 %80 | VoiceOnlyRoom (ses arayüzü, orb animasyonu), phone-screen prompt, practice prompt, practice modunda kod editörü, hint butonu+kademeli ipucu sistemi (3 seviye), soft timer | Soru sayacı (Soru 3/5), zaman limiti + AI geçiş, çözüm karşılaştırması (optimal solution diff view) |
| **4** | System Design | 🟠 %20 | system-design prompt, NewInterview'de seçenek mevcut, VoiceOnlyRoom'da çalışıyor (sadece sesli) | tldraw whiteboard canvas, custom shape'ler (Server/DB/Cache/Queue/LB), bileşen palette'i, whiteboard→LLM serialize, whiteboard state persist, design problem seed data |
| **7** | Raporlama | ❌ %0 | — | interviewResults tablosu, LLM ile rapor oluşturma, skor kartı UI, kategori skorları, güçlü/zayıf yön listesi, transkript görüntüleme, recharts grafikler (radar, line chart), istatistik kartları, kümülatif analiz |
| **6** | Kişiselleştirme | ❌ %0 | — | Job posting parse (URL→LLM analiz), resume upload (PDF→metin), kullanıcı profili sayfası, mülakat config detayları (süre limiti, alt seçenekler), userMemory tablosu, AI davranış uyarlaması |
| **8** | Enterprise Panel | ❌ %0 | — | organizations/positions/candidates tabloları, rol yönetimi, pozisyon oluşturma, davet linki akışı, recruiter dashboard, aday listesi+detay, karşılaştırma, funnel chart, dönüşüm oranları |
| **10** | Production | ❌ %0 | — | Sentence-level TTS pipelining, rate limiting, sandbox güvenlik hardening, structured logging, health checks, error tracking, Fly.io/Railway deploy, Vercel/Cloudflare deploy, GitHub Actions CI/CD, code splitting, caching, scaling |

### Mevcut Dosya Haritası

```
apps/api/src/
├── index.ts                    ← Hono + WS server entrypoint
├── router.ts                   ← API route'lar (users, proxy TTS/STT/LLM)
├── sandbox.ts                  ← Kod çalıştırma (node:vm + Python subprocess)
├── middleware/auth.ts           ← better-auth session doğrulama
├── routes/
│   ├── interviews.ts           ← CRUD + start/complete/messages
│   ├── problems.ts             ← list/random/getById
│   └── code.ts                 ← POST /execute (sandbox)
├── prompts/
│   ├── index.ts                ← getSystemPrompt() router
│   ├── live-coding.ts          ← ✅
│   ├── system-design.ts        ← ✅
│   ├── phone-screen.ts         ← ✅
│   └── practice.ts             ← ✅
└── ws/voice.ts                 ← VoiceSession (STT→LLM→TTS pipeline)

apps/web/src/
├── App.tsx                     ← Router (login/register/dashboard/interview)
├── main.tsx                    ← React entrypoint
├── lib/
│   ├── api.ts                  ← fetch wrapper (interviews/problems/code)
│   ├── audio.ts                ← PCM16 decode, AudioQueuePlayer, volume meter
│   ├── auth.tsx                ← useAuth() hook + AuthProvider
│   └── useVoice.ts             ← WebSocket hook (VAD, auto-reconnect, hint)
├── pages/
│   ├── DashboardPage.tsx       ← Hoşgeldin + hızlı başlat + son mülakatlar
│   ├── NewInterviewPage.tsx    ← Tür/zorluk/soru sayısı seçimi
│   ├── InterviewRoomPage.tsx   ← Voice-only + Live Coding layout
│   ├── HistoryPage.tsx         ← Geçmiş mülakatlar
│   ├── LoginPage.tsx           ← Email/password login
│   └── RegisterPage.tsx        ← Email/password register
└── components/
    ├── ui/                     ← Button, Card, Badge, Input, Toast
    ├── layout/                 ← AppLayout, Sidebar, Topbar
    └── interview/              ← VoiceBar, CodeEditor, ProblemPanel,
                                   TestResultsPanel, ResizableSplitter

convex/
├── schema.ts                   ← users, interviews, messages, problems
├── users.ts                    ← CRUD + list + getById
├── interviews.ts               ← create/start/complete/saveCode/setProblem/stats
├── messages.ts                 ← add/listByInterview/getRecent
├── problems.ts                 ← create/list/getById/getRandom
├── auth.ts                     ← better-auth createAuth()
├── http.ts                     ← HTTP routes (auth endpoints)
└── seed.ts                     ← Problem seed data
```

### Önerilen Sıralama (Tümünü Tamamlama)

```
Şimdi  ──► FAZ 7   Raporlama (en etkili, demo için kritik)
       ──► FAZ 5   Kalan eksikler (soru sayacı, zaman limiti, çözüm diff)
       ──► FAZ 4   System Design whiteboard (tldraw)
       ──► FAZ 6   Kişiselleştirme (job parse, resume, memory)
       ──► FAZ 8   Enterprise panel
       ──► FAZ 10  Production & deploy
```
