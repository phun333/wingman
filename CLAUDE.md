# CLAUDE.md — Freya Fal Hackathon

# Important
- DO NOT EVER OPEN DEV SERVER FOR ANYTHING. IT IS ALREADY OPENED AND RUNNING LOCALLY. IF YOU OPEN ANOTHER ONE, YOU WILL CAUSE CONFLICTS AND ERRORS.

# Tool Preferences

- Use `rg` (ripgrep) instead of `grep` for searching files and text.
- Use `tsgo` (typescript/native-preview) instead of `tsc` for TypeScript type checking.
- Use `oxlint` instead of `eslint` for linting.
- Use `bun` as the package manager and runtime instead of `npm`, `yarn`, `pnpm`, or `node`.

## Proje Tanımı

Bu proje, **Freya** (fal.ai üzerinde çalışan Türkçe STT/TTS modeli) ve **fal.ai** platformunu kullanarak bir hackathon uygulaması geliştirmektedir. Sesli AI asistan / konuşma tabanlı uygulama olarak tasarlanmıştır.

## Mimari

Bun monorepo (workspaces) yapısı:

```
freya-fal-hackathon/
├── apps/
│   ├── api/          → Hono + oRPC API sunucusu (port 3001)
│   └── web/          → Bun web sunucusu (port 3000)
├── packages/
│   ├── types/        → Paylaşılan TypeScript tipleri (@ffh/types)
│   ├── env/          → Environment değişkenleri (@ffh/env)
│   ├── db/           → Convex HTTP client (@ffh/db)
│   └── tsconfig/     → Paylaşılan TS config'leri (@ffh/tsconfig)
├── convex/           → Convex backend (schema, auth, users)
├── docs/             → Freya/fal.ai entegrasyon dökümantasyonu ve örnekler
├── tests/            → Test dosyaları
└── .env              → Environment variables
```

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Runtime | **Bun** |
| API Framework | **Hono** + **oRPC** |
| Database | **Convex** |
| Auth | **better-auth** (Convex plugin) |
| Validation | **Zod v4** |
| API Docs | **Scalar** (OpenAPI) |
| AI Platform | **fal.ai** (Freya STT/TTS) |
| Type Checking | **tsgo** (typescript/native-preview) |
| Linting | **oxlint** |

## Önemli Komutlar

```bash
# Geliştirme
bun run dev              # Tüm uygulamaları başlat
bun run dev:web          # Sadece web
bun run dev:api          # Sadece API

# Build
bun run build            # Tüm workspace'leri build et

# Type check
bun run typecheck        # tsgo ile type check (tüm workspace'ler)

# Tek bir workspace
bun run --filter @ffh/api dev
bun run --filter @ffh/web dev
```

## Environment Variables

`.env` dosyası monorepo root'unda:

```env
# Zorunlu
CONVEX_URL=https://your-deployment.convex.cloud

# API Portları
PORT_API=3001
PORT_WEB=3000

# fal.ai (Freya entegrasyonu için)
FAL_KEY=your-fal-api-key
TTS_ENDPOINT=freya-mypsdi253hbk/freya-tts
STT_ENDPOINT=freya-mypsdi253hbk/freya-stt
LLM_ENDPOINT=openrouter/router
```

## Freya / fal.ai Endpoint'leri

### Text-to-Speech (TTS)
- **Streaming:** `freya-mypsdi253hbk/freya-tts` + path `/stream`
- **Generate (CDN URL):** `freya-mypsdi253hbk/freya-tts` + path `/generate`
- **OpenAI-compat:** `https://fal.run/freya-mypsdi253hbk/freya-tts/audio/speech`
- **Models:** `freya-mypsdi253hbk/freya-tts` + path `/models`

### Speech-to-Text (STT)
- **Transcriptions (OpenAI-compat):** `https://fal.run/freya-mypsdi253hbk/freya-stt/audio/transcriptions`
- **Generate:** `freya-mypsdi253hbk/freya-stt` + path `/generate`
- **Models:** `freya-mypsdi253hbk/freya-stt` + path `/models`

### LLM
- **OpenRouter:** `openrouter/router`

Detaylı dökümantasyon: `docs/endpoints.md`

## fal.ai Client Kullanımı

```typescript
import { fal } from "@fal-ai/client";

// Config (FAL_KEY env'den otomatik okunur)
fal.config({ credentials: process.env.FAL_KEY });

// 3 farklı mod:
// 1. fal.subscribe() — Kuyruğa gönder, sonucu bekle (batch işlemler için)
// 2. fal.stream()    — Gerçek zamanlı streaming (düşük latency)
// 3. fal.run()       — Direkt çalıştırma

// TTS örneği
const result = await fal.subscribe("freya-mypsdi253hbk/freya-tts", {
  input: { input: "Merhaba!", response_format: "wav", speed: 1.0 },
  path: "/generate",
});
```

## Kod Kuralları

- **Package manager:** Bun (bun.lock, bunfig.toml)
- **Import style:** ES modules (`import`/`export`)
- **Path aliases:** Workspace packages `@ffh/*` olarak import edilir
- **Type checking:** `tsgo --noEmit` (her workspace'in kendi tsconfig'i var)
- **Linting:** `oxlint` (eslint değil)
- **Search:** `rg` (ripgrep) kullan, `grep` değil
- **Env loading:** `@ffh/env` paketi otomatik yükler (root .env dosyasından)

## API Yapısı (oRPC)

```typescript
// Router tanımı: apps/api/src/router.ts
import { os } from "@orpc/server";
import { z } from "zod";

export const myEndpoint = os
  .route({ method: "POST", path: "/my-endpoint", summary: "..." })
  .input(z.object({ ... }))
  .handler(async ({ input }) => { ... });
```

API endpoint'leri `http://localhost:3001/rpc/` altında, Scalar dökümantasyonu `http://localhost:3001/docs` adresinde.

## Convex Schema

```typescript
// convex/schema.ts
users: defineTable({
  email: v.string(),
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
}).index("by_email", ["email"])
```

Auth: `better-auth` ile email/password (Convex plugin).

## Docs Klasörü

`docs/` klasöründe Freya/fal.ai entegrasyon örnekleri var:

| Dosya | Açıklama |
|-------|----------|
| `freya-tts-streaming.ts` | PCM16 streaming TTS |
| `freya-tts-openai-compat.ts` | OpenAI-uyumlu HTTP TTS |
| `freya-pipeline.ts` | TTS→STT round-trip |
| `freya-livekit.ts` | LiveKit + OpenAI SDK entegrasyonu |
| `endpoints.md` | Tüm endpoint referansı |
| `setup.md` | Client kurulumu |

Bu dosyalar **referans/dökümantasyon** amaçlıdır, doğrudan uygulamaya entegre değildir.
