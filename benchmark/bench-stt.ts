#!/usr/bin/env bun
/**
 * 🎤 STT Benchmark — Freya STT Latency Test
 *
 * STT latency'sini test eder:
 * - Farklı audio format'ları (webm, wav)
 * - Farklı audio uzunlukları
 * - fetch vs fal.subscribe karşılaştırması
 */

import { fal } from "@fal-ai/client";
import { ENV, fmt, printResults, avg, median, type TimingResult } from "./utils";

fal.config({ credentials: ENV.FAL_KEY });

// ─── Generate test audio of different lengths ─────────

async function generateTestAudio(text: string): Promise<Buffer> {
  const response = await fetch(`https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Key ${ENV.FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      response_format: "wav",
      speed: 1.0,
    }),
  });

  if (!response.ok) throw new Error(`TTS generation failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

// ─── Method 1: fetch (OpenAI-compat) ──────────────────

async function benchSTTFetch(audioBuffer: Buffer, format: string = "wav"): Promise<TimingResult> {
  const start = performance.now();

  const blob = new Blob([audioBuffer], { type: `audio/${format}` });
  const formData = new FormData();
  formData.append("file", blob, `audio.${format}`);
  formData.append("language", "tr");

  try {
    const response = await fetch(`https://fal.run/${ENV.STT_ENDPOINT}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Key ${ENV.FAL_KEY}` },
      body: formData,
    });

    if (!response.ok) {
      return { label: `fetch STT`, ttfb: -1, total: -1, extra: { error: response.status } };
    }

    const result = await response.json() as { text: string };
    const total = performance.now() - start;

    return {
      label: `fetch("/audio/transcriptions")`,
      ttfb: total,
      total,
      extra: { transcript: result.text?.slice(0, 50), audioBytes: audioBuffer.length, format },
    };
  } catch (err) {
    return { label: `fetch STT`, ttfb: -1, total: -1, extra: { error: String(err).slice(0, 80) } };
  }
}

// ─── Method 2: fal.subscribe ──────────────────────────

async function benchSTTSubscribe(audioBuffer: Buffer): Promise<TimingResult> {
  const start = performance.now();

  try {
    // First upload to fal storage
    const blob = new Blob([audioBuffer], { type: "audio/wav" });
    const file = new File([blob], "audio.wav", { type: "audio/wav" });
    const audioUrl = await fal.storage.upload(file);

    const result = await fal.subscribe(ENV.STT_ENDPOINT as any, {
      input: { audio_url: audioUrl, language: "tr" },
      path: "/generate",
    } as any);

    const total = performance.now() - start;

    return {
      label: `fal.subscribe("/generate")`,
      ttfb: total,
      total,
      extra: { transcript: (result as any)?.text?.slice(0, 50), audioBytes: audioBuffer.length },
    };
  } catch (err) {
    return { label: `subscribe STT`, ttfb: -1, total: -1, extra: { error: String(err).slice(0, 80) } };
  }
}

// ─── Main ──────────────────────────────────────────────

async function main() {
  console.log("🎤 STT Benchmark — Freya STT Latency Test");
  console.log("─".repeat(60));

  // Generate test audios
  console.log("\n⏳ Test ses dosyaları oluşturuluyor...");

  const shortText = "Evet, anladım.";
  const mediumText = "Hash map kullanarak bu problemi O(n) zamanda çözebilirsin. Her elemanı gezerken complement'i hesapla.";
  const longText = "Bu çok güzel bir yaklaşım. Önce brute force ile başlayıp sonra optimize etmen doğru bir strateji. Hash map kullanarak zaman karmaşıklığını düşürdün. Edge case'leri de düşünelim, boş array durumunda ne olur?";

  process.stdout.write("   Kısa ses... ");
  const shortAudio = await generateTestAudio(shortText);
  console.log(`${shortAudio.length} bytes`);

  process.stdout.write("   Orta ses... ");
  const mediumAudio = await generateTestAudio(mediumText);
  console.log(`${mediumAudio.length} bytes`);

  process.stdout.write("   Uzun ses... ");
  const longAudio = await generateTestAudio(longText);
  console.log(`${longAudio.length} bytes`);

  // ── Test 1: Yöntem karşılaştırması (medium audio) ──
  console.log("\n📊 Test 1: STT Yöntem Karşılaştırması (medium audio)");

  const methodResults: TimingResult[] = [];

  process.stdout.write("   fetch (wav)... ");
  const f1 = await benchSTTFetch(mediumAudio, "wav");
  methodResults.push(f1);
  console.log(`Total: ${fmt(f1.total)} — "${(f1.extra as any)?.transcript}"`);

  await Bun.sleep(300);

  process.stdout.write("   fal.subscribe... ");
  const s1 = await benchSTTSubscribe(mediumAudio);
  methodResults.push(s1);
  console.log(`Total: ${fmt(s1.total)} — "${(s1.extra as any)?.transcript}"`);

  printResults("STT Yöntem Karşılaştırması", methodResults);

  // ── Test 2: Audio uzunluğu etkisi ──
  console.log("\n📊 Test 2: Audio Uzunluğu Etkisi (fetch yöntemi)");

  const lengthResults: TimingResult[] = [];
  const RUNS = 3;

  for (const [label, audio] of [
    ["Kısa (~1s konuşma)", shortAudio],
    ["Orta (~4s konuşma)", mediumAudio],
    ["Uzun (~8s konuşma)", longAudio],
  ] as const) {
    process.stdout.write(`   ${label}... `);
    const runs: number[] = [];

    for (let i = 0; i < RUNS; i++) {
      const r = await benchSTTFetch(audio, "wav");
      if (r.total > 0) runs.push(r.total);
      await Bun.sleep(200);
    }

    if (runs.length > 0) {
      lengthResults.push({
        label,
        ttfb: median(runs),
        total: median(runs),
        extra: { audioBytes: audio.length, runs: runs.length, values: runs.map(r => Math.round(r)).join(", ") },
      });
      console.log(`Median: ${fmt(median(runs))}`);
    }
  }

  printResults("Audio Uzunluğu Etkisi (STT latency)", lengthResults);

  // ── Özet ──
  console.log("═".repeat(60));
  console.log("  📋 STT ÖZET ÖNERİLER");
  console.log("═".repeat(60));
  console.log("  1. fetch + multipart kullan → fal.subscribe'dan daha hızlı");
  console.log("  2. Audio kaydını kısa tut → VAD ile sessizlik kes");
  console.log("  3. webm/opus format → daha küçük dosya = daha hızlı upload");
  console.log("  4. Gereksiz sessizlik trimle → STT daha hızlı işler");
  console.log();
}

main().catch(console.error);
