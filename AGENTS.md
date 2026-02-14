# AGENTS.md — AI Agent Talimatları

Bu dosya, bu repo üzerinde çalışan AI agent'ları (Claude, Copilot, Cursor, vb.) için talimatlar içerir.

# Important
- DO NOT EVER OPEN DEV SERVER FOR ANYTHING. IT IS ALREADY OPENED AND RUNNING LOCALLY. IF YOU OPEN ANOTHER ONE, YOU WILL CAUSE CONFLICTS AND ERRORS.

# Tool Preferences

- Use `rg` (ripgrep) instead of `grep` for searching files and text.
- Use `tsgo` (typescript/native-preview) instead of `tsc` for TypeScript type checking.
- Use `oxlint` instead of `eslint` for linting.
- Use `bun` as the package manager and runtime instead of `npm`, `yarn`, `pnpm`, or `node`.
- Use `bun run typecheck` in root for typecheck. Always.

## 🏗️ Proje Özeti

**Freya Fal Hackathon** — Türkçe sesli AI uygulaması. Freya (fal.ai) STT/TTS modelleri + OpenRouter LLM kullanır.

**Monorepo yapısı** (Bun workspaces):
- `apps/api` — Hono + oRPC REST API
- `apps/web` — Bun web sunucusu
- `packages/types` — Paylaşılan tipler (`@ffh/types`)
- `packages/env` — Env yönetimi (`@ffh/env`)
- `packages/db` — Convex client (`@ffh/db`)
- `packages/tsconfig` — TS config'ler (`@ffh/tsconfig`)
- `convex/` — Backend (Convex + better-auth)
- `docs/` — Freya/fal.ai entegrasyon dökümantasyonu

---

## ⚙️ Araç Tercihleri

| İşlem | Kullan | KULLANMA |
|-------|--------|----------|
| Type checking | `tsgo --noEmit` | `tsc` |
| Linting | `oxlint` | `eslint` |
| Metin arama | `rg` (ripgrep) | `grep` |
| Package manager | `bun` | `npm`, `yarn`, `pnpm` |
| Runtime | `bun` | `node` |

---

## 📦 Dependency Ekleme

```bash
# Root'a
bun add <package>

# Belirli workspace'e
bun add <package> --filter @ffh/api
bun add <package> --filter @ffh/web

# Dev dependency
bun add -d <package>
```

---

## 📁 Dosya Yapısı Kuralları

1. **Yeni API endpoint'i** → `apps/api/src/router.ts` içine oRPC route ekle
2. **Yeni shared tip** → `packages/types/src/index.ts` içine ekle
3. **Yeni env variable** → `.env`, `.env.example`, ve `packages/env/src/index.ts` güncelle
4. **Yeni Convex tablo** → `convex/schema.ts` + ilgili query/mutation dosyası
5. **fal.ai entegrasyonu** → `docs/` klasöründeki örneklere bak, `@fal-ai/client` kullan
6. **Öneri sistemi** → `apps/api/src/services/recommendation.ts` (scoring) + `convex/resumeAnalysis.ts` (DB)

---

## 🔌 fal.ai / Freya Entegrasyonu

### Temel Kavramlar

- **fal.ai** = Serverless AI inference platformu
- **Freya** = fal.ai üzerindeki Türkçe STT/TTS modeli
- **@fal-ai/client** = TypeScript SDK (`fal.run`, `fal.subscribe`, `fal.stream`)

### Endpoint'ler

```
TTS Endpoint ID: freya-mypsdi253hbk/freya-tts
  /generate          → CDN URL ile ses üretimi (fal.subscribe)
  /stream            → PCM16 gerçek zamanlı streaming (fal.stream)
  /audio/speech      → OpenAI-compat binary response (fetch)
  /models            → Model listesi

STT Endpoint ID: freya-mypsdi253hbk/freya-stt
  /audio/transcriptions → OpenAI-compat transcription (multipart fetch)
  /generate             → fal.subscribe ile transcription
  /models               → Model listesi

LLM Endpoint ID: openrouter/router
```

### fal.ai SDK Kullanım Modları

```typescript
import { fal } from "@fal-ai/client";

// 1. Subscribe — Kuyruğa gönderir, tamamlanınca sonuç döner
const result = await fal.subscribe("freya-mypsdi253hbk/freya-tts", {
  input: { input: "Merhaba!", response_format: "wav" },
  path: "/generate",
});

// 2. Stream — Gerçek zamanlı chunk chunk data
const stream = await fal.stream("freya-mypsdi253hbk/freya-tts", {
  input: { input: "Merhaba!", speed: 1.0 },
  path: "/stream",
});
for await (const event of stream) { /* ... */ }

// 3. Run — Senkron çalıştırma
const result = await fal.run("endpoint-id", { input: { ... } });
```

### OpenAI-Compat Kullanım (fetch ile)

```typescript
// TTS — Binary audio response
const audio = await fetch("https://fal.run/freya-mypsdi253hbk/freya-tts/audio/speech", {
  method: "POST",
  headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
  body: JSON.stringify({ input: "Merhaba!", response_format: "wav" }),
});

// STT — Multipart form-data
const formData = new FormData();
formData.append("file", audioBlob, "audio.wav");
formData.append("language", "tr");
const transcript = await fetch("https://fal.run/freya-mypsdi253hbk/freya-stt/audio/transcriptions", {
  method: "POST",
  headers: { Authorization: `Key ${FAL_KEY}` },
  body: formData,
});
```

### OpenAI SDK ile (LiveKit uyumlu)

```typescript
import OpenAI from "openai";

const ttsClient = new OpenAI({
  apiKey: "stub",
  baseURL: `https://fal.run/freya-mypsdi253hbk/freya-tts`,
  defaultHeaders: { Authorization: `Key ${FAL_KEY}` },
});

const sttClient = new OpenAI({
  apiKey: "stub",
  baseURL: `https://fal.run/freya-mypsdi253hbk/freya-stt`,
  defaultHeaders: { Authorization: `Key ${FAL_KEY}` },
});
```

---

## 🧩 API Route Ekleme (oRPC)

```typescript
// apps/api/src/router.ts
import { os } from "@orpc/server";
import { z } from "zod";

export const myRoute = os
  .route({ method: "POST", path: "/my-route", summary: "Açıklama" })
  .input(z.object({ text: z.string() }))
  .handler(async ({ input }) => {
    // Business logic
    return { result: "..." };
  });

// Router objesine ekle
export const router = {
  // ... mevcut route'lar
  myRoute,
};
```

API'ye `http://localhost:3001/rpc/myRoute` olarak erişilir.
Scalar dökümantasyonu: `http://localhost:3001/docs`

---

## 🗄️ Convex Schema Değişikliği

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({ /* ... */ }).index("by_email", ["email"]),
  // Yeni tablo:
  conversations: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
```

Her tablo için ayrı bir dosya oluştur (ör. `convex/conversations.ts`) ve `query`/`mutation` tanımla.

---

## 🔐 Authentication

- **better-auth** + Convex plugin
- Email/password auth aktif
- `convex/auth.ts` → `createAuth()` fonksiyonu
- `convex/users.ts` → `me` query'si auth user döner

---

## 📝 Kod Stili

- **ES Modules** (import/export, require kullanma)
- **TypeScript strict mode**
- Workspace paketleri `@ffh/*` olarak import et
- Zod v4 kullan (v3 değil)
- `type` keyword'ünü type-only import'lar için kullan: `import type { X } from "..."`
- Async/await tercih et (Promise chaining değil)
- Error handling: `try/catch` ile, hataları yukarı fırlat veya logla

---

## 🧪 Test

```bash
bun test                      # Tüm testler
bun test tests/auth.test.ts   # Belirli test
```

Test dosyaları `tests/` klasöründe.

---

## 📖 Dökümantasyon Referansı

Detaylı Freya/fal.ai entegrasyon örnekleri için `docs/` klasörüne bak:

- `docs/README.md` — Genel bakış
- `docs/endpoints.md` — Tüm endpoint referansı
- `docs/setup.md` — Client kurulumu
- `docs/freya-tts-streaming.ts` — Streaming TTS örneği
- `docs/freya-tts-openai-compat.ts` — OpenAI-compat TTS örneği
- `docs/freya-pipeline.ts` — TTS→STT pipeline
- `docs/freya-livekit.ts` — LiveKit entegrasyonu

---

## ⚠️ Önemli Notlar

1. **FAL_KEY'i asla commit'leme** — `.env` dosyası `.gitignore`'da
2. **Convex deploy** — `bunx convex dev` ile local geliştirme, `bunx convex deploy` ile production
3. **Freya endpoint'leri private** — `freya-mypsdi253hbk/*` endpoint ID'leri hackathon için özel
4. **PCM16 format** — Streaming TTS raw PCM16 döner (16-bit signed, mono, 16kHz), WAV'a çevirmek için header eklenmeli
5. **OpenAI uyumluluk** — Hem TTS hem STT endpoint'leri OpenAI API formatını destekler, bu sayede OpenAI SDK ve LiveKit ile doğrudan kullanılabilir
