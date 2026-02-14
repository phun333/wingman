#!/usr/bin/env bun
/**
 * 🔊 TTS Benchmark — Freya TTS Yöntem Karşılaştırması
 *
 * 3 farklı TTS yöntemi test edilir:
 * 1. fal.stream("/stream") — PCM16 streaming (gerçek zamanlı)
 * 2. fetch("/audio/speech") — Tek seferde binary response
 * 3. fal.subscribe("/generate") — Kuyruk → CDN URL
 *
 * + Farklı metin uzunlukları
 * + Speed parametresi etkisi
 */

import { fal } from "@fal-ai/client";
import { ENV, fmt, printResults, avg, median, type TimingResult } from "./utils";

fal.config({ credentials: ENV.FAL_KEY });

// ─── Test cümleleri ────────────────────────────────────

const SHORT_TEXT = "Evet, bu yaklaşım doğru.";
const MEDIUM_TEXT = "Hash map kullanarak bu problemi O(n) zamanda çözebilirsin. Her elemanı gezerken, hedef değerden çıkararak complement'i hesapla.";
const LONG_TEXT = "Bu çok güzel bir yaklaşım. Önce brute force ile başlayıp sonra optimize etmen doğru bir strateji. Hash map kullanarak zaman karmaşıklığını O(n kare)'den O(n)'e düşürdün. Şimdi edge case'leri düşünelim, boş array veya tek elemanlı array durumunda ne olur?";

// ─── Method 1: fal.stream("/stream") ──────────────────

async function benchTTSStream(text: string, speed: number = 1.0): Promise<TimingResult> {
  const start = performance.now();
  let ttfb = 0;
  let chunks = 0;
  let totalBytes = 0;

  try {
    const stream = await fal.stream(ENV.TTS_ENDPOINT as any, {
      input: { input: text, speed },
      path: "/stream",
    } as any);

    for await (const event of stream as AsyncIterable<{ audio?: string; done?: boolean }>) {
      if (event.audio) {
        if (ttfb === 0) ttfb = performance.now() - start;
        chunks++;
        totalBytes += event.audio.length; // base64 length
      }
    }
  } catch (err) {
    return { label: `stream (${text.length} chars)`, ttfb: -1, total: -1, extra: { error: String(err).slice(0, 80) } };
  }

  const total = performance.now() - start;
  return {
    label: `fal.stream("/stream")`,
    ttfb,
    total,
    extra: { chunks, totalBytes, textLen: text.length, speed },
  };
}

// ─── Method 2: fetch("/audio/speech") ─────────────────

async function benchTTSFetch(text: string, speed: number = 1.0, format: string = "pcm"): Promise<TimingResult> {
  const start = performance.now();
  let ttfb = 0;

  try {
    const response = await fetch(`https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Key ${ENV.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text, response_format: format, speed }),
    });

    // TTFB = headers received
    ttfb = performance.now() - start;

    if (!response.ok) {
      return { label: `fetch (${format})`, ttfb: -1, total: -1, extra: { error: response.status } };
    }

    const buf = await response.arrayBuffer();
    const total = performance.now() - start;

    return {
      label: `fetch("/audio/speech") [${format}]`,
      ttfb,
      total,
      extra: { bytes: buf.byteLength, textLen: text.length, format, speed },
    };
  } catch (err) {
    return { label: `fetch (${format})`, ttfb: -1, total: -1, extra: { error: String(err).slice(0, 80) } };
  }
}

// ─── Method 3: fal.subscribe("/generate") ─────────────

async function benchTTSSubscribe(text: string, speed: number = 1.0): Promise<TimingResult> {
  const start = performance.now();

  try {
    const result = await fal.subscribe(ENV.TTS_ENDPOINT as any, {
      input: { input: text, response_format: "wav", speed },
      path: "/generate",
    } as any);

    const total = performance.now() - start;
    return {
      label: `fal.subscribe("/generate")`,
      ttfb: total, // Subscribe doesn't stream, so TTFB ≈ total
      total,
      extra: { textLen: text.length, speed, hasAudioUrl: !!(result as any)?.audio_url },
    };
  } catch (err) {
    return { label: `subscribe`, ttfb: -1, total: -1, extra: { error: String(err).slice(0, 80) } };
  }
}

// ─── Main ──────────────────────────────────────────────

async function main() {
  console.log("🔊 TTS Benchmark — Freya TTS Yöntem Karşılaştırması");
  console.log("─".repeat(60));

  // ── Test 1: Yöntem karşılaştırması (medium text) ──
  console.log("\n📊 Test 1: TTS Yöntem Karşılaştırması (medium text)");

  const methodResults: TimingResult[] = [];

  process.stdout.write("   fal.stream... ");
  const stream1 = await benchTTSStream(MEDIUM_TEXT);
  methodResults.push(stream1);
  console.log(`TTFB: ${fmt(stream1.ttfb)}, Total: ${fmt(stream1.total)}`);

  await Bun.sleep(300);

  process.stdout.write("   fetch (pcm)... ");
  const fetch1 = await benchTTSFetch(MEDIUM_TEXT, 1.0, "pcm");
  methodResults.push(fetch1);
  console.log(`TTFB: ${fmt(fetch1.ttfb)}, Total: ${fmt(fetch1.total)}`);

  await Bun.sleep(300);

  process.stdout.write("   fetch (wav)... ");
  const fetchWav = await benchTTSFetch(MEDIUM_TEXT, 1.0, "wav");
  methodResults.push(fetchWav);
  console.log(`TTFB: ${fmt(fetchWav.ttfb)}, Total: ${fmt(fetchWav.total)}`);

  await Bun.sleep(300);

  process.stdout.write("   fetch (mp3)... ");
  const fetchMp3 = await benchTTSFetch(MEDIUM_TEXT, 1.0, "mp3");
  methodResults.push(fetchMp3);
  console.log(`TTFB: ${fmt(fetchMp3.ttfb)}, Total: ${fmt(fetchMp3.total)}`);

  await Bun.sleep(300);

  process.stdout.write("   fal.subscribe... ");
  const sub1 = await benchTTSSubscribe(MEDIUM_TEXT);
  methodResults.push(sub1);
  console.log(`TTFB: ${fmt(sub1.ttfb)}, Total: ${fmt(sub1.total)}`);

  printResults("TTS Yöntem Karşılaştırması (TTFB = ilk ses)", methodResults);

  // ── Test 2: Metin uzunluğu etkisi (stream yöntemi ile) ──
  console.log("\n📊 Test 2: Metin Uzunluğu Etkisi (fal.stream)");

  const lengthResults: TimingResult[] = [];

  for (const [label, text] of [
    ["Kısa (24 char)", SHORT_TEXT],
    ["Orta (130 char)", MEDIUM_TEXT],
    ["Uzun (280 char)", LONG_TEXT],
  ] as const) {
    process.stdout.write(`   ${label}... `);
    const r = await benchTTSStream(text);
    r.label = label;
    lengthResults.push(r);
    console.log(`TTFB: ${fmt(r.ttfb)}, Total: ${fmt(r.total)}`);
    await Bun.sleep(300);
  }

  printResults("Metin Uzunluğu Etkisi (fal.stream TTFB)", lengthResults);

  // ── Test 3: Speed parametresi etkisi ──
  console.log("\n📊 Test 3: Speed Parametresi Etkisi (fal.stream, medium text)");

  const speedResults: TimingResult[] = [];

  for (const speed of [0.8, 1.0, 1.15, 1.3, 1.5]) {
    process.stdout.write(`   speed=${speed}... `);
    const r = await benchTTSStream(MEDIUM_TEXT, speed);
    r.label = `speed=${speed}`;
    speedResults.push(r);
    console.log(`TTFB: ${fmt(r.ttfb)}, Total: ${fmt(r.total)}`);
    await Bun.sleep(300);
  }

  printResults("Speed Parametresi Etkisi", speedResults);

  // ── Test 4: İlk cümle hızı (pipeline'daki gerçek senaryo) ──
  console.log("\n📊 Test 4: İlk Cümle TTFB (pipeline gerçek senaryo)");
  console.log("   LLM ilk cümleyi ~600ms'de üretir, TTS ne kadar hızlı başlar?\n");

  const firstSentenceResults: TimingResult[] = [];
  const firstSentence = "Evet, bu iyi bir yaklaşım."; // ~25 char, tipik ilk cümle

  // 3 kez dene, medyan al
  const streamRuns: number[] = [];
  const fetchRuns: number[] = [];

  for (let i = 0; i < 3; i++) {
    const s = await benchTTSStream(firstSentence);
    if (s.ttfb > 0) streamRuns.push(s.ttfb);
    await Bun.sleep(200);

    const f = await benchTTSFetch(firstSentence, 1.0, "pcm");
    if (f.ttfb > 0) fetchRuns.push(f.ttfb);
    await Bun.sleep(200);
  }

  if (streamRuns.length > 0) {
    firstSentenceResults.push({
      label: 'fal.stream (ilk cümle)',
      ttfb: median(streamRuns),
      total: median(streamRuns),
      extra: { runs: streamRuns.length, values: streamRuns.map(r => Math.round(r)).join(", ") },
    });
  }

  if (fetchRuns.length > 0) {
    firstSentenceResults.push({
      label: 'fetch/pcm (ilk cümle)',
      ttfb: median(fetchRuns),
      total: median(fetchRuns),
      extra: { runs: fetchRuns.length, values: fetchRuns.map(r => Math.round(r)).join(", ") },
    });
  }

  printResults("İlk Cümle TTFB (en kritik metrik)", firstSentenceResults);

  // ── Özet ──
  console.log("═".repeat(60));
  console.log("  📋 TTS ÖZET ÖNERİLER");
  console.log("═".repeat(60));
  console.log("  1. fal.stream kullan → İlk ses chunk'ı en hızlı gelir");
  console.log("  2. İlk cümleyi kısa tut → TTFB düşer");
  console.log("  3. speed=1.1-1.2 → Daha hızlı konuşma, daha kısa bekleme");
  console.log("  4. PCM format → En az encoding overhead");
  console.log();
}

main().catch(console.error);
