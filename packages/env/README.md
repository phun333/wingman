# packages/env

Ortam değişkeni yönetim paketidir. `@ffh/env` paket adıyla tüm çalışma alanları tarafından kullanılır. Monorepo kök dizinindeki `.env` dosyasını otomatik olarak bulur ve yükler.

## Görevleri

- Monorepo kök dizinini bularak `.env` dosyasını okuma
- Ortam değişkenlerini ayrıştırarak `process.env`'e ekleme
- Tür güvenli `ENV` nesnesi ile tüm yapılandırma değerlerini merkezi olarak sunma

## Sağladığı Değişkenler

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `CONVEX_URL` | Convex proje URL'si | (zorunlu) |
| `PORT_API` | API sunucu portu | 3001 |
| `PORT_WEB` | Web sunucu portu | 3000 |
| `SITE_URL` | Site URL'si | http://localhost:3000 |
| `FAL_KEY` | fal.ai API anahtarı | (zorunlu) |
| `TTS_ENDPOINT` | Freya TTS uç noktası | freya-mypsdi253hbk/freya-tts |
| `STT_ENDPOINT` | Freya STT uç noktası | freya-mypsdi253hbk/freya-stt |
| `LLM_ENDPOINT` | LLM uç noktası | openrouter/router |
| `OPENROUTER_API_KEY` | OpenRouter API anahtarı | (zorunlu) |
| `OPENROUTER_MODEL` | Kullanılacak LLM modeli | google/gemini-2.5-flash |
| `HYPERBROWSER_API_KEY` | Hyperbrowser API anahtarı | (isteğe bağlı) |
| `CONVEX_HTTP_URL` | Convex HTTP URL'si (üretim kimlik doğrulama vekili) | (isteğe bağlı) |

## Kullanım

```typescript
import { ENV } from "@ffh/env";

console.log(ENV.PORT_API);         // 3001
console.log(ENV.OPENROUTER_MODEL); // "google/gemini-2.5-flash"
```

## Dosya Yapısı

```
src/
  index.ts    Kök dizin bulma, .env ayrıştırma ve ENV nesnesi tanımlama
```
