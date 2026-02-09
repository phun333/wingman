# fal.ai Client Kurulumu

## Paket Kurulumu

```bash
# Ana paket
bun add @fal-ai/client

# (Opsiyonel) Server proxy — Next.js veya benzeri framework kullanıyorsanız
bun add @fal-ai/server-proxy
```

## Environment Variables

`.env` dosyasına ekle:

```env
# fal.ai API anahtarı (https://fal.ai/dashboard/keys)
FAL_KEY=your-fal-api-key

# Freya Endpoint'leri
TTS_ENDPOINT=freya-mypsdi253hbk/freya-tts
STT_ENDPOINT=freya-mypsdi253hbk/freya-stt
LLM_ENDPOINT=openrouter/router
```

## Client Yapılandırması

### Basit Kullanım (Server-side)

```typescript
import { fal } from "@fal-ai/client";

// FAL_KEY env variable otomatik okunur
// Ekstra config gerekmez!

const result = await fal.subscribe("freya-mypsdi253hbk/freya-tts", {
  input: { input: "Merhaba dünya!" },
  path: "/generate",
});
```

### Explicit Config

```typescript
import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});
```

### Proxy ile (Browser uygulamaları için)

Tarayıcıda API anahtarını ifşa etmemek için proxy kullan:

```typescript
// Server-side: API route oluştur
// apps/api/src/fal-proxy.ts
import { createProxyHandler } from "@fal-ai/server-proxy";

export const falProxy = createProxyHandler({
  credentials: process.env.FAL_KEY,
});

// Client-side: Proxy URL'yi belirt
import { fal } from "@fal-ai/client";

fal.config({
  proxyUrl: "http://localhost:3001/fal-proxy",
});
```

### Custom Client Oluşturma

```typescript
import { createFalClient } from "@fal-ai/client";

const falClient = createFalClient({
  credentials: process.env.FAL_KEY,
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  },
});
```

## Projemize Entegrasyon

`@ffh/env` paketine FAL_KEY eklenebilir:

```typescript
// packages/env/src/index.ts
export const ENV = {
  CONVEX_URL: process.env.CONVEX_URL!,
  FAL_KEY: process.env.FAL_KEY!,
  TTS_ENDPOINT: process.env.TTS_ENDPOINT || "freya-mypsdi253hbk/freya-tts",
  STT_ENDPOINT: process.env.STT_ENDPOINT || "freya-mypsdi253hbk/freya-stt",
  LLM_ENDPOINT: process.env.LLM_ENDPOINT || "openrouter/router",
  PORT_API: Number(process.env.PORT_API || 3001),
  PORT_WEB: Number(process.env.PORT_WEB || 3000),
} as const;
```

## HTTP İle Direkt Kullanım (fal.ai client olmadan)

OpenAI-uyumlu endpoint'ler standart HTTP ile de kullanılabilir:

```typescript
const FAL_KEY = process.env.FAL_KEY!;
const BASE_URL = "https://fal.run/freya-mypsdi253hbk/freya-tts";

const response = await fetch(`${BASE_URL}/audio/speech`, {
  method: "POST",
  headers: {
    "Authorization": `Key ${FAL_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    input: "Merhaba dünya!",
    response_format: "wav",
    speed: 1.0,
  }),
});

const audioBuffer = await response.arrayBuffer();
```
