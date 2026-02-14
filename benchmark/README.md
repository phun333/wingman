# 🏎️ Benchmark: Interview Pipeline Latency Optimization

## Hedef: Toplam E2E Latency < 2 saniye

Mevcut pipeline:
```
User Ses → [STT] → [LLM] → [TTS] → AI Ses
           ~800ms   ~1500ms   ~500ms   = ~2800ms (ortalama)
```

## 📊 Benchmark Scriptleri

| Script | Açıklama |
|--------|----------|
| `bench-stt.ts` | STT endpoint latency (Freya STT) |
| `bench-llm.ts` | LLM model karşılaştırması (TTFT + throughput) |
| `bench-tts.ts` | TTS yöntem karşılaştırması (stream vs generate vs fetch) |
| `bench-e2e.ts` | Tam pipeline E2E benchmark |
| `bench-parallel.ts` | Paralel/speculative pipeline deneyleri |
| `run-all.ts` | Tüm benchmark'ları çalıştır, sonuçları karşılaştır |

## 🚀 Kullanım

```bash
cd benchmark
bun run bench-stt.ts        # Sadece STT
bun run bench-llm.ts        # Sadece LLM
bun run bench-tts.ts        # Sadece TTS
bun run bench-e2e.ts        # Full E2E
bun run bench-parallel.ts   # Paralel pipeline deneyleri
bun run run-all.ts          # Hepsini çalıştır
```

## 🧪 Test Edilen Optimizasyon Stratejileri

### 1. 🤖 LLM Model Seçimi (En büyük fark burada!)
- `google/gemini-2.5-flash` (mevcut) — iyi ama TTFT yüksek olabilir
- `google/gemini-2.5-flash:nitro` — throughput optimize
- `google/gemini-2.0-flash-001` — daha hafif, daha hızlı TTFT
- `anthropic/claude-3-haiku` — ultra-hızlı, küçük model
- `meta-llama/llama-3.1-8b-instruct:nitro` — küçük + nitro
- `openai/gpt-4o-mini` — hızlı ve ucuz
- `mistralai/mistral-small-3.1-24b-instruct` — iyi denge

### 2. 🎤 STT Optimizasyonları
- Audio chunk boyutunu azalt (daha kısa kayıt)
- VAD (Voice Activity Detection) ile sessizlik tespiti
- Audio format: webm/opus → daha küçük dosya boyutu
- Audio sample rate düşürme (16kHz yeterli)

### 3. 🔊 TTS Optimizasyonları
- `fal.stream("/stream")` — gerçek zamanlı PCM16 streaming (EN HIZLI)
- `fetch("/audio/speech")` — tek seferde binary
- `fal.subscribe("/generate")` — kuyruk + CDN URL
- Speed parametresi: 1.0 → 1.15 (daha hızlı konuşma = daha kısa audio)

### 4. ⚡ Pipeline Optimizasyonları
- **Sentence-level interleaving** (mevcut) — LLM cümle bitince hemen TTS başlat
- **Sub-sentence chunking** — Virgülle bile TTS başlat (riskli ama hızlı)
- **Speculative TTS** — İlk birkaç kelimeyi tahmin edip önceden ses üret
- **Context window pruning** — Conversation history'yi kısalt → daha hızlı LLM
- **System prompt compression** — Prompt'u kısalt → TTFT düşer
- **max_tokens limiti** — 500 → 200 (daha kısa yanıt = daha hızlı)
- **Streaming SSE parsing optimize** — Daha verimli token okuma

### 5. 🌐 Network Optimizasyonları
- **Connection pooling** — HTTP keep-alive
- **DNS pre-resolve** — fal.run ve openrouter.ai için
- `:nitro` suffix — OpenRouter'da en hızlı provider'a yönlendir
- **Regional endpoint** — fal.ai'da en yakın region

### 6. 🧠 Akıllı Kısayollar
- **Greeting cache** — İlk selamlama mesajı önceden üretilmiş ses
- **Common response cache** — Sık yanıtlar için TTS cache
- **Parallel STT+LLM prefetch** — STT bitmeden LLM'e "hazırlan" sinyali

---

## 📈 Hedef Metrikler

| Metrik | Mevcut | Hedef |
|--------|--------|-------|
| STT Latency | ~800ms | < 500ms |
| LLM TTFT | ~1500ms | < 600ms |
| TTS TTFB | ~500ms | < 300ms |
| **Toplam E2E** | **~2800ms** | **< 1400ms** |
| First Audio Byte | ~2500ms | < 1200ms |
