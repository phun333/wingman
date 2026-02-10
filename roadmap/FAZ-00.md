# Faz 0 — Temel Altyapı & Doğrulama

> **Öncelik:** 🔴 P0  
> **Bağımlılık:** Yok (başlangıç noktası)  
> **Tahmini süre:** 1 gün

## Amaç

Mevcut monorepo iskeletini sağlamlaştır. Tüm servislerin (API, Web, Convex, fal.ai, OpenRouter) ayağa kalktığını ve birbirleriyle konuşabildiğini doğrula. Bundan sonraki tüm fazlar bu altyapıya bağımlıdır.

---

## Mevcut Durum

| Bileşen | Paket | Durum |
|---------|-------|-------|
| API Sunucusu | `apps/api` — Hono + oRPC, port 3001 | ✅ İskelet var |
| Web Sunucusu | `apps/web` — Bun.serve, port 3000 | ✅ İskelet var |
| Veritabanı | `convex/` — Convex + better-auth | ✅ Schema + CRUD + Auth var |
| Env Yönetimi | `packages/env` — Root .env okuma | ✅ CONVEX_URL, PORT_API, PORT_WEB var |
| Shared Tipler | `packages/types` — ApiResponse tipi | ✅ Minimal |
| DB Client | `packages/db` — ConvexHttpClient | ✅ Çalışıyor |
| Testler | `tests/auth.test.ts` — Auth + CRUD testleri | ✅ Kapsamlı |

---

## Görevler

### 0.1 — `packages/env` Genişletme

`packages/env/src/index.ts` dosyasında şu anda sadece `CONVEX_URL`, `PORT_API`, `PORT_WEB` var. fal.ai ve OpenRouter için gerekli key'ler eklenmeli.

- [ ] `FAL_KEY` ekle (zorunlu, fal.ai API anahtarı)
- [ ] `TTS_ENDPOINT` ekle (varsayılan: `freya-mypsdi253hbk/freya-tts`)
- [ ] `STT_ENDPOINT` ekle (varsayılan: `freya-mypsdi253hbk/freya-stt`)
- [ ] `LLM_ENDPOINT` ekle (varsayılan: `openrouter/router`)
- [ ] `OPENROUTER_API_KEY` ekle (zorunlu, OpenRouter API anahtarı)
- [ ] `SITE_URL` ekle (better-auth için gerekli, varsayılan: `http://localhost:3000`)
- [ ] `.env.example` dosyasını tüm yeni key'lerle güncelle

**Dosyalar:**
- `packages/env/src/index.ts`
- `.env.example`
- `.env` (gitignore'da, local)

---

### 0.2 — fal.ai Bağlantı Doğrulama

docs klasöründeki hazır script'leri kullanarak Freya servislerinin çalıştığını doğrula.

- [ ] `@fal-ai/client` paketini `apps/api`'ye ekle: `bun add @fal-ai/client --filter @ffh/api`
- [ ] `docs/freya-pipeline.ts` çalıştır: TTS→STT round-trip başarılı mı?
- [ ] `docs/freya-tts-streaming.ts` çalıştır: Streaming TTS PCM16 chunk alıyor mu?
- [ ] `docs/freya-tts-openai-compat.ts` çalıştır: OpenAI-compat endpoint WAV dönüyor mu?
- [ ] `docs/freya-livekit.ts` çalıştır: OpenAI SDK üzerinden TTS/STT çalışıyor mu?
- [ ] Tüm testlerde latency'i logla (baseline ölçüm)

**Referans dosyalar:**
- `docs/freya-pipeline.ts` — TTS→STT full pipeline
- `docs/freya-tts-streaming.ts` — PCM16 streaming
- `docs/freya-tts-openai-compat.ts` — /audio/speech endpoint
- `docs/freya-livekit.ts` — OpenAI-compat client'lar
- `docs/endpoints.md` — Tüm endpoint referansı
- `docs/setup.md` — Client config

---

### 0.3 — OpenRouter LLM Bağlantısı

OpenRouter üzerinden LLM'e erişimi doğrula.

- [ ] `OPENROUTER_API_KEY`'i `.env`'e ekle
- [ ] OpenRouter'a basit bir chat completion isteği gönder (test script)
- [ ] Streaming response desteğini doğrula (token token cevap)
- [ ] Kullanılacak model ID'lerini belirle ve `packages/env`'e ekle (ör: `google/gemini-2.5-flash`)
- [ ] Hata durumlarını test et: Geçersiz key, rate limit, timeout

**API Formatı (OpenRouter — OpenAI-compat):**
```
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer <OPENROUTER_API_KEY>
Content-Type: application/json

{
  "model": "google/gemini-2.5-flash",
  "messages": [{"role": "user", "content": "Merhaba"}],
  "stream": true
}
```

---

### 0.4 — API Proxy Endpoint'leri

Browser'dan fal.ai key'ini sızdırmamak için API tarafında proxy oluştur.

- [ ] `apps/api/src/router.ts`'ye fal.ai TTS proxy route'u ekle
- [ ] `apps/api/src/router.ts`'ye fal.ai STT proxy route'u ekle
- [ ] `apps/api/src/router.ts`'ye OpenRouter LLM proxy route'u ekle
- [ ] Proxy'lerin doğru header'ları (`Authorization: Key ...`) eklediğini doğrula
- [ ] Her proxy'de rate limiting düşün (ileride Faz 10'da detaylı)

**oRPC route kalıbı:**
```typescript
// os.route({ method: "POST", path: "/proxy/tts", summary: "..." })
//   .input(z.object({ ... }))
//   .handler(async ({ input }) => { ... fetch fal.ai ... })
```

**Dosyalar:**
- `apps/api/src/router.ts`

---

### 0.5 — Auth Akışı Doğrulama

Mevcut better-auth + Convex auth'un uçtan uca çalıştığını doğrula.

- [ ] `tests/auth.test.ts` başarıyla geçiyor mu? (`bun test tests/auth.test.ts`)
- [ ] Register → Login → Session → Convex JWT akışı sorunsuz mu?
- [ ] `convex/users.ts` → `me` query'si authenticated user dönüyor mu?
- [ ] API route'larında auth middleware eklemeye hazır mı? (oRPC context ile)

**Mevcut dosyalar:**
- `convex/auth.ts` — `createAuth()`, `authComponent`, `getCurrentUser`
- `convex/auth.config.ts` — better-auth provider config
- `convex/http.ts` — Auth HTTP route'ları
- `convex/users.ts` — CRUD + `me` query
- `tests/auth.test.ts` — Kapsamlı test suite

---

### 0.6 — `packages/types` Genişletme

Projenin ilerleyen fazlarında kullanılacak temel tipleri tanımla.

- [ ] `InterviewType` enum: `"live-coding" | "system-design" | "phone-screen" | "practice"`
- [ ] `InterviewStatus` enum: `"created" | "in-progress" | "completed" | "evaluated"`
- [ ] `Difficulty` enum: `"easy" | "medium" | "hard"`
- [ ] `MessageRole` enum: `"user" | "assistant" | "system"`
- [ ] `VoicePipelineState` enum: `"idle" | "listening" | "processing" | "speaking"`
- [ ] `ApiResponse<T>` tipini koru (mevcut)

**Dosya:**
- `packages/types/src/index.ts`

---

### 0.7 — Geliştirme Ortamı Scriptleri

`package.json` root script'lerini genişlet.

- [ ] `bun run dev` → API + Web + Convex aynı anda başlamalı
- [ ] `bun run dev:convex` → `bunx convex dev` script'i ekle
- [ ] `bun run test` → Tüm testleri çalıştır
- [ ] `bun run typecheck` → `tsgo --noEmit` tüm workspace'ler

**Dosya:**
- `package.json` (root)

---

## Tamamlanma Kriterleri

1. `bun run dev` ile API (3001), Web (3000), Convex aynı anda ayağa kalkıyor
2. `bun test` ile auth testleri geçiyor
3. fal.ai TTS/STT round-trip başarılı (docs script'leri ile)
4. OpenRouter'a chat completion başarılı
5. `packages/env` tüm gerekli key'leri export ediyor
6. `packages/types` temel enum'lar tanımlı
7. API proxy endpoint'leri fal.ai ve OpenRouter'a istek geçirebiliyor
