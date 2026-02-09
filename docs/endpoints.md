# Freya API Endpoint Referansı

## Base URL

```
https://fal.run/
```

Tüm endpoint'ler `fal.run` üzerinden erişilir. `@fal-ai/client` kullanırken sadece endpoint ID yeterlidir.

---

## 🗣️ Text-to-Speech (TTS)

**Endpoint ID:** `freya-mypsdi253hbk/freya-tts`

| Path | Yöntem | Açıklama |
|------|--------|----------|
| `/` | POST | Base TTS endpoint |
| `/generate` | POST | Ses üretimi (CDN URL döner) |
| `/stream` | POST | Gerçek zamanlı PCM16 streaming |
| `/audio/speech` | POST | OpenAI-uyumlu ses üretimi (binary response) |
| `/models` | POST | Kullanılabilir TTS modellerini listele |

### `/generate` — Ses Üretimi

Metin gönder, CDN üzerinden audio URL al.

```typescript
// Request
{
  input: string;        // Ses üretilecek metin
  response_format?: string; // "wav" | "mp3" | "opus" | "aac" | "flac" | "pcm"
  speed?: number;       // 0.25 - 4.0 (default: 1.0)
}

// Response
{
  audio: {
    url: string;        // CDN audio URL
    content_type: string;
  };
  inference_time_ms: number;
  audio_duration_sec: number;
}
```

### `/stream` — Streaming TTS

Gerçek zamanlı PCM16 chunk'ları alır. Düşük latency için idealdir.

```typescript
// Request
{
  input: string;        // Ses üretilecek metin
  speed?: number;       // 0.25 - 4.0
}

// Stream Events
{
  audio?: string;       // Base64 encoded PCM16 chunk
  error?: {
    message: string;
  };
  recoverable?: boolean;
  done?: boolean;
  inference_time_ms?: number;
  audio_duration_sec?: number;
}
```

### `/audio/speech` — OpenAI-Compatible

OpenAI TTS API ile birebir uyumlu. Direkt binary audio response döner.

```typescript
// Request
{
  input: string;
  response_format?: string; // "wav" | "mp3" | "opus" | "aac" | "flac" | "pcm"
  speed?: number;
}

// Response: Binary audio data
// Headers:
//   X-Inference-Time-Ms: number
//   X-Audio-Duration-Sec: number
```

### `/models` — Model Listesi

```typescript
// Response
{
  data: Array<{
    id: string;
    // ...model metadata
  }>;
}
```

---

## 🎤 Speech-to-Text (STT)

**Endpoint ID:** `freya-mypsdi253hbk/freya-stt`

| Path | Yöntem | Açıklama |
|------|--------|----------|
| `/` | POST | Base STT endpoint |
| `/generate` | POST | Ses dosyasından metin üretimi |
| `/audio/transcriptions` | POST | OpenAI-uyumlu transcription |
| `/models` | POST | Kullanılabilir STT modellerini listele |

### `/audio/transcriptions` — OpenAI-Compatible

OpenAI Whisper API ile uyumlu. Multipart form-data ile audio dosyası gönderilir.

```typescript
// Request (multipart/form-data)
{
  file: File;           // Audio dosyası
  language?: string;    // "tr", "en", vb.
}

// Response
{
  text: string;         // Transkript edilmiş metin
}
```

---

## 🤖 LLM (OpenRouter)

**Endpoint ID:** `openrouter/router`

OpenRouter üzerinden çeşitli LLM'lere erişim sağlar.

| Path | Yöntem | Açıklama |
|------|--------|----------|
| `/` | POST | Router endpoint |

---

## 🔐 Authentication

Tüm isteklerde `Authorization` header'ı gereklidir:

```
Authorization: Key <FAL_KEY>
```

`@fal-ai/client` kullanırken otomatik olarak `FAL_KEY` environment variable'ından okunur.

---

## 📡 fal.ai İstek Modları

| Mod | Fonksiyon | Açıklama |
|-----|-----------|----------|
| Direct Run | `fal.run()` | Senkron çalıştırma, sonucu bekler |
| Queue/Subscribe | `fal.subscribe()` | Kuyruğa gönderir, tamamlanınca sonuç döner |
| Stream | `fal.stream()` | Gerçek zamanlı streaming, chunk chunk data |

### Endpoint ID + Path Kullanımı

```typescript
// fal.subscribe ile path belirtme
fal.subscribe("freya-mypsdi253hbk/freya-tts", {
  input: { ... },
  path: "/generate"  // Endpoint path'i
});

// fal.stream ile
fal.stream("freya-mypsdi253hbk/freya-tts", {
  input: { ... },
  path: "/stream"
});
```
