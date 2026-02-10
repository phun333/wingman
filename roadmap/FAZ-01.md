# Faz 1 — Sesli AI Ajanı (Voice Pipeline)

> **Öncelik:** 🔴 P0  
> **Bağımlılık:** Faz 0 (altyapı doğrulanmış olmalı)  
> **Tahmini süre:** 3-5 gün

## Amaç

Kullanıcının mikrofonuyla konuşup AI'dan sesli cevap alabildiği temel döngüyü kur. Bu, platformun kalbi. Tüm mülakat modülleri (Live Coding, System Design, Phone Screen) bu pipeline üzerine inşa edilecek.

**Hedef akış:**
```
🎙️ Mikrofon → 📝 STT (Freya) → 🧠 LLM (OpenRouter) → 🔊 TTS (Freya) → 🔈 Hoparlör
```

---

## Mimari Kararlar

### WebSocket vs REST

Voice pipeline için **WebSocket** tercih edilmeli:
- Ses verisi sürekli akar (half-duplex ya da full-duplex)
- Söz kesme (interrupt) için anında sinyal gerekli
- REST'te her istek yeni TCP bağlantısı = gereksiz latency

**Hono WebSocket (Bun runtime):**
```typescript
// Hono'da Bun için WebSocket:
import { upgradeWebSocket, websocket } from "hono/bun"

app.get("/ws/voice", upgradeWebSocket((c) => ({
  onOpen(event, ws) { /* ... */ },
  onMessage(event, ws) { /* ses verisi geldi */ },
  onClose() { /* temizle */ },
})))

export default { fetch: app.fetch, websocket }
```

### Ses Formatı

| Yön | Format | Detay |
|-----|--------|-------|
| Browser → API | WebM/Opus veya PCM16 | MediaRecorder varsayılan: WebM/Opus |
| API → Freya STT | WAV veya raw audio | STT multipart form-data bekler |
| Freya TTS → API | PCM16 (streaming) veya WAV | Streaming: base64 PCM16 chunk'lar |
| API → Browser | PCM16 veya WAV | AudioContext ile PCM16 decode |

---

## Görevler

### 1.1 — Ses Yakalama (Browser Tarafı)

Web tarafında mikrofon erişimi ve ses verisini API'ye gönderme.

- [ ] `getUserMedia({ audio: true })` ile mikrofon erişimi
- [ ] `MediaRecorder` veya `AudioWorklet` ile ses kaydı
  - MediaRecorder: Daha basit, WebM/Opus chunk'lar üretir
  - AudioWorklet: Daha düşük latency, raw PCM erişimi (ileri seviye)
- [ ] VAD (Voice Activity Detection) implementasyonu
  - Basit yaklaşım: Volume threshold (RMS energy) ile sessizlik algılama
  - İleri yaklaşım: `@ricky0123/vad-web` veya benzeri WebAssembly VAD
  - Kullanıcı konuşmayı bırakınca ~500ms sonra chunk'ı gönder
- [ ] Ses chunk'larını WebSocket üzerinden API'ye gönderme
- [ ] Mikrofon açma/kapama toggle UI kontrolü
- [ ] Ses seviyesi göstergesi (volume meter) — `AnalyserNode` ile

**Browser API'ları:**
- `navigator.mediaDevices.getUserMedia()`
- `MediaRecorder` API
- `AudioContext` + `AnalyserNode`
- `WebSocket` API

---

### 1.2 — WebSocket Voice Endpoint (API Tarafı)

API'de WebSocket bağlantısı kabul eden voice endpoint.

- [ ] `apps/api/src/index.ts`'ye Hono WebSocket desteği ekle
  - `import { upgradeWebSocket, websocket } from "hono/bun"` 
  - `export default { fetch: app.fetch, websocket }` (Bun için zorunlu)
- [ ] `/ws/voice` WebSocket endpoint'i oluştur
- [ ] WebSocket mesaj protokolü tanımla:

```typescript
// Client → Server mesajları
type ClientMessage =
  | { type: "audio_chunk"; data: string }       // base64 audio
  | { type: "start_listening" }
  | { type: "stop_listening" }
  | { type: "interrupt" }                        // AI'ı kes
  | { type: "config"; settings: SessionConfig }

// Server → Client mesajları
type ServerMessage =
  | { type: "transcript"; text: string; final: boolean }
  | { type: "ai_text"; text: string; done: boolean }
  | { type: "ai_audio"; data: string }           // base64 PCM16
  | { type: "ai_audio_done" }
  | { type: "state_change"; state: VoicePipelineState }
  | { type: "error"; message: string }
```

- [ ] Her bağlantı için session state yönetimi
- [ ] Bağlantı kopma durumunda cleanup

**Dosyalar:**
- `apps/api/src/index.ts` — WebSocket export ekle
- `apps/api/src/ws/voice.ts` — Yeni dosya, voice WebSocket handler
- `packages/types/src/index.ts` — WebSocket mesaj tipleri

---

### 1.3 — STT Pipeline (Ses → Metin)

API tarafında gelen ses verisini Freya STT'ye göndererek metin alma.

- [ ] Gelen audio chunk'ları birleştirme (buffer)
- [ ] VAD sinyali ile tamamlanan konuşmayı STT'ye gönderme
- [ ] Freya STT'ye multipart form-data ile istek:

```typescript
// docs/freya-pipeline.ts referansı:
const formData = new FormData();
const blob = new Blob([audioBuffer], { type: "audio/wav" });
formData.append("file", blob, "audio.wav");
formData.append("language", "tr");

const response = await fetch(
  `https://fal.run/${STT_ENDPOINT}/audio/transcriptions`,
  {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}` },
    body: formData,
  }
);
const result = await response.json(); // { text: "..." }
```

- [ ] WebM/Opus → WAV dönüşümü (gerekirse, ffmpeg-wasm veya Bun native)
- [ ] Transkript sonucunu WebSocket üzerinden client'a gönderme
- [ ] Dil parametresi: Varsayılan `"tr"`, config ile değiştirilebilir
- [ ] Hata yönetimi: STT fail ederse client'a error mesajı

**Referans:** `docs/freya-pipeline.ts` → `transcribeAudio()` fonksiyonu

---

### 1.4 — LLM İşleme (Metin → AI Cevap)

Kullanıcının transkriptini LLM'e gönderip AI cevabı alma.

- [ ] OpenRouter chat completion entegrasyonu (OpenAI-compat API)
- [ ] System prompt ile AI mülakatçı persona tanımlama
- [ ] Conversation history yönetimi — mesaj dizisi (messages array)
- [ ] **Streaming response**: Token token cevap alma

```typescript
// OpenRouter streaming örneği:
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-2.5-flash",
    messages: conversationHistory,
    stream: true,
  }),
});

// SSE stream okuma
const reader = response.body.getReader();
const decoder = new TextDecoder();
// ... chunk chunk oku, parse et
```

- [ ] Her token geldiğinde WebSocket'e `ai_text` mesajı gönder
- [ ] Cümle bazlı chunking: Noktalama işaretlerinde TTS'e göndermeye başla
- [ ] AbortController ile devam eden isteği iptal edebilme (interrupt için)

---

### 1.5 — TTS Pipeline (AI Cevap → Ses)

LLM cevabını Freya TTS'e gönderip ses üretme.

- [ ] **Streaming TTS** tercih et (düşük latency):

```typescript
// docs/freya-tts-streaming.ts referansı:
const stream = await fal.stream(TTS_ENDPOINT, {
  input: { input: text, speed: 1.0 },
  path: "/stream",
});

for await (const event of stream) {
  if (event.audio) {
    const pcmBytes = Buffer.from(event.audio, "base64");
    // WebSocket üzerinden client'a gönder
    ws.send(JSON.stringify({ type: "ai_audio", data: event.audio }));
  }
  if (event.done) {
    ws.send(JSON.stringify({ type: "ai_audio_done" }));
  }
}
```

- [ ] Cümle bazlı TTS: LLM'den cümle tamamlandığında hemen TTS'e gönder
- [ ] PCM16 chunk'ları WebSocket üzerinden client'a ilet
- [ ] Fallback: Streaming başarısız olursa `/audio/speech` ile tam WAV üret
- [ ] TTS parametreleri: `speed` (1.0 varsayılan), `response_format`

**Referans:** `docs/freya-tts-streaming.ts` → `streamSpeech()` fonksiyonu

---

### 1.6 — Ses Oynatma (Browser Tarafı)

API'den gelen PCM16 chunk'ları browser'da oynatma.

- [ ] `AudioContext` oluştur (user gesture sonrası, autoplay policy)
- [ ] PCM16 base64 chunk'ları decode et → `Float32Array`
- [ ] `AudioBuffer` oluşturup `AudioBufferSourceNode` ile oynat
- [ ] Chunk queue sistemi: Chunk'lar sırayla ve kesintisiz oynatılmalı
- [ ] Playback durumunu takip et: Oynatılıyor / Bitti
- [ ] Ses seviyesi kontrolü (gain node)

```typescript
// PCM16 → Float32Array dönüşümü:
function decodePCM16(base64: string): Float32Array {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) {
    float32[i] = pcm16[i] / 32768; // Normalize to [-1, 1]
  }
  return float32;
}
```

---

### 1.7 — Söz Kesme (Interruptibility)

Kullanıcı konuşmaya başladığında AI'ı anında durdurma.

- [ ] VAD algıladığında client'tan `{ type: "interrupt" }` mesajı gönder
- [ ] API tarafında interrupt sinyali geldiğinde:
  1. Aktif LLM stream'ini iptal et (`AbortController.abort()`)
  2. Aktif TTS stream'ini iptal et
  3. Client'a `{ type: "ai_audio_done" }` gönder (oynatmayı durdur)
  4. State'i `LISTENING`'e geçir
- [ ] Client tarafında interrupt olduğunda:
  1. Audio queue'yu temizle
  2. Mevcut playback'i durdur
  3. Mikrofonu aktif et (zaten aktifse devam)

---

### 1.8 — State Machine

Voice pipeline'ın tüm state geçişlerini yönet.

```
                ┌──────────┐
     ┌─────────►│   IDLE   │◄────────────┐
     │          └─────┬────┘             │
     │                │ kullanıcı konuşmaya başladı
     │          ┌─────▼────┐             │
     │     ┌───►│LISTENING │─── interrupt ┘
     │     │    └─────┬────┘
     │     │          │ VAD: konuşma bitti
     │     │    ┌─────▼──────┐
     │     │    │ PROCESSING │ (STT + LLM)
     │     │    └─────┬──────┘
     │     │          │ LLM cevap vermeye başladı
     │     │    ┌─────▼────┐
     │     └────│ SPEAKING  │ ← interrupt → LISTENING
     │          └─────┬────┘
     │                │ TTS bitti
     └────────────────┘
```

- [ ] State enum'u `packages/types`'ta tanımla (Faz 0.6'da yapıldı)
- [ ] Her state değişikliğinde client'a `state_change` mesajı gönder
- [ ] State'e göre UI güncellemesi (Faz 9'da implemente edilecek)
- [ ] Geçersiz state geçişlerini engelle (guard'lar)

---

### 1.9 — Uçtan Uca Test

Tüm pipeline'ın birlikte çalıştığını doğrula.

- [ ] Manuel test: Mikrofon → STT → LLM → TTS → Hoparlör tam döngü
- [ ] Latency ölçümü (her adım):
  - STT süresi: Ses gönderiminden transkript almaya
  - LLM first token: Transkript gönderiminden ilk token'a
  - TTS first chunk: LLM cümle tamamından ilk PCM chunk'a
  - Toplam round-trip: Kullanıcı susmasından ilk AI sesine
- [ ] Hata senaryoları test:
  - Mikrofon erişimi reddedilirse
  - WebSocket bağlantısı koparsa
  - STT/LLM/TTS timeout olursa
  - Birden fazla hızlı interrupt

---

## Tamamlanma Kriterleri

1. Kullanıcı mikrofona konuşuyor, AI sesli cevap veriyor
2. AI konuşurken araya girilebiliyor (interrupt çalışıyor)
3. Toplam round-trip latency < 3 saniye (hedef < 1.5s)
4. Konuşma Türkçe yapılabiliyor
5. WebSocket bağlantı kopmasında graceful recovery
6. State machine tüm geçişlerde doğru çalışıyor
