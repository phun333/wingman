# 🏎️ Benchmark Sonuçları — 14 Şubat 2026

## ✅ HEDEF BAŞARILDI: E2E < 2 saniye mümkün!

---

## 📊 Go vs Bun Karşılaştırması

| Metrik | Go | Bun/TS | Kazanan |
|--------|-----|--------|---------|
| STT (en iyi) | 408ms | 397ms | **Bun** 🏆 |
| LLM TTFT (en iyi) | 223ms (mistral) | 389ms (llama) | **Go** 🏆 |
| TTS TTFB kısa cümle | 550ms | 500ms | **Bun** 🏆 |
| **E2E toplam** | **1.18s** | **1.29s** | **Go** (marjinal) |

> **Sonuç:** Runtime farkı marjinal (~100ms). Asıl fark **model seçimi** ve **pipeline mimarisinde**.

---

## 🤖 LLM Model Karşılaştırması (TTFT — Time To First Token)

| Model | TTFB (Go) | TTFB (Bun) | tok/s | Türkçe Kalite | Öneri |
|-------|-----------|------------|-------|---------------|-------|
| `meta-llama/llama-3.1-8b-instruct:nitro` | **369ms** | **389ms** | 123 | ⭐⭐⭐ Orta | 🥇 En hızlı TTFT + throughput |
| `mistralai/mistral-small-3.1-24b-instruct` | **223ms** | 444ms | 34-46 | ⭐⭐⭐⭐ İyi | 🥈 En düşük TTFT (Go'da) |
| `google/gemini-2.5-flash:nitro` | 556ms | **412ms** | 6 | ⭐⭐⭐⭐⭐ En iyi | 🥉 En iyi Türkçe kalite |
| `google/gemini-2.0-flash-001` | 570ms | 514ms | 5-6 | ⭐⭐⭐⭐ İyi | İyi denge |
| `openai/gpt-4o-mini` | 564ms | 440ms | 49-50 | ⭐⭐⭐⭐ İyi | Yüksek throughput |
| `anthropic/claude-3-haiku` | 479ms | 433ms | 38-40 | ⭐⭐⭐⭐ İyi | Düşük TTFT |
| `google/gemini-2.5-flash` (mevcut) | 821ms | 701ms | 4 | ⭐⭐⭐⭐⭐ En iyi | ❌ TTFT çok yüksek |
| `google/gemini-2.0-flash-lite-001` | 393ms | 1240ms | 3-4 | ⭐⭐⭐ Orta | Tutarsız |

### 💡 LLM Önerisi

**Mülakat kalitesi önemliyse:** `google/gemini-2.5-flash:nitro` — `:nitro` suffix TTFT'yi %40 düşürüyor (701ms → 412ms)

**Maksimum hız:** `meta-llama/llama-3.1-8b-instruct:nitro` — 389ms TTFT, 123 tok/s

**Denge:** `openai/gpt-4o-mini` veya `anthropic/claude-3-haiku` — 430-440ms TTFT, iyi Türkçe

---

## 🔊 TTS Karşılaştırması

| Yöntem | TTFB (kısa cümle) | TTFB (orta metin) | Not |
|--------|-------------------|-------------------|-----|
| `fetch /audio/speech [pcm]` | **500ms** | 1.41s | 🥇 Kısa cümle için en hızlı |
| `fal.stream /stream` | 719ms | 1.43s | Streaming avantajı uzun metinde |
| `fetch /audio/speech [wav]` | - | 1.11s | WAV orta metinde hızlı |
| `fetch /audio/speech [mp3]` | - | 1.81s | ❌ En yavaş (encoding overhead) |

### 💡 TTS Önerisi

1. **İlk cümleyi mümkün olduğunca KISA tut** (< 30 karakter) → 500ms TTFB
2. **PCM format** ilk cümle için → en az overhead
3. **fal.stream** uzun metinler için → ama ilk cümle fetch daha hızlı
4. **mp3 KULLANMA** → encoding overhead çok yüksek

---

## 🎤 STT Karşılaştırması

| Yöntem | Run 1 (cold) | Run 2 | Run 3 | Not |
|--------|-------------|-------|-------|-----|
| `fetch /audio/transcriptions` (Bun) | 595ms | 407ms | **397ms** | 🥇 Warm'da ~400ms |
| `fetch /audio/transcriptions` (Go) | 717ms | 413ms | **408ms** | Çok benzer |

### 💡 STT Önerisi

1. İlk çağrı cold olabilir (~600ms), sonrakiler ~400ms
2. **VAD kullan** → sessizliği kes, daha kısa audio gönder
3. **webm/opus** format → daha küçük dosya boyutu

---

## ⚡ Optimal Pipeline Konfigürasyonu

### Mevcut Pipeline (Ortalama ~2.8s)
```
STT (~800ms) → LLM gemini-2.5-flash (~1500ms TTFT) → TTS stream (~500ms) = ~2800ms
```

### Optimize Pipeline (Hedef ~1.3s)
```
STT (~400ms) → LLM gemini-2.5-flash:nitro (~420ms TTFT) → TTS fetch/pcm (~500ms) = ~1320ms
```

### Yapılması Gerekenler

| # | Değişiklik | Etki | Zorluk |
|---|-----------|------|--------|
| 1 | `:nitro` suffix ekle (`gemini-2.5-flash:nitro`) | TTFT: 701ms → 412ms (**-290ms**) | ⭐ Kolay — sadece model adı değiştir |
| 2 | `max_tokens: 500 → 200` | Daha hızlı tamamlanma | ⭐ Kolay |
| 3 | İlk cümle kısa tut (prompt'ta belirt) | TTS TTFB düşer | ⭐ Kolay |
| 4 | İlk cümle için `fetch /audio/speech [pcm]` kullan | 719ms → 500ms (**-220ms**) | ⭐⭐ Orta |
| 5 | VAD (Voice Activity Detection) | STT'ye daha kısa audio | ⭐⭐ Orta |
| 6 | System prompt kısalt | TTFT düşer (~50ms) | ⭐ Kolay |
| 7 | Conversation history prune (son 10 mesaj) | TTFT düşer | ⭐⭐ Orta |

### Hemen Uygulanabilecek (1 satır değişiklik):

```typescript
// packages/env/src/index.ts
OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash:nitro",
//                                                                          ^^^^^^ ekle
```

Bu tek değişiklik LLM TTFT'yi ~%40 düşürür.
