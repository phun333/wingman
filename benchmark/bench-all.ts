#!/usr/bin/env bun
/**
 * 🏎️ Full Benchmark — Bun/TS Runtime
 * Go ile karşılaştırma için aynı testleri Bun ile çalıştırır.
 */

import { ENV, fmt, printResults, avg, median, type TimingResult } from "./utils";
import { fal } from "@fal-ai/client";

fal.config({ credentials: ENV.FAL_KEY });

// ═══════════════════════════════════════════════════════
//  LLM BENCHMARK
// ═══════════════════════════════════════════════════════

const SHORT_PROMPT = "Sen Wingman, Türkçe teknik mülakatçısın. Kısa ve öz cevap ver, 2-3 cümle.";
const USER_MSG = "Hash map ve array arasındaki farkı açıklayabilir misin?";

async function benchLLM(model: string, maxTokens: number = 200): Promise<TimingResult> {
  const messages = [
    { role: "system", content: SHORT_PROMPT },
    { role: "user", content: USER_MSG },
  ];

  const start = performance.now();
  let ttfb = 0;
  let tokens = 0;
  let fullText = "";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": ENV.SITE_URL,
        "X-Title": "Wingman Bun Benchmark",
      },
      body: JSON.stringify({ model, messages, stream: true, max_tokens: maxTokens, temperature: 0.7 }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { label: model, ttfb: -1, total: -1, extra: { error: `${response.status}: ${err.slice(0, 100)}` } };
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No stream");
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (!token) continue;
          tokens++;
          fullText += token;
          if (ttfb === 0) ttfb = performance.now() - start;
        } catch {}
      }
    }
  } catch (err) {
    return { label: model, ttfb: -1, total: -1, extra: { error: String(err).slice(0, 100) } };
  }

  const total = performance.now() - start;
  return {
    label: model,
    ttfb,
    total,
    extra: { tokens, "tok/s": Math.round(tokens / (total / 1000)), respLen: fullText.length },
  };
}

// ═══════════════════════════════════════════════════════
//  TTS BENCHMARK
// ═══════════════════════════════════════════════════════

const MEDIUM_TEXT = "Hash map kullanarak bu problemi O(n) zamanda çözebilirsin. Her elemanı gezerken complement hesapla.";
const SHORT_TTS_TEXT = "Evet, bu iyi bir yaklaşım.";

async function benchTTSFetch(text: string, format: string, speed: number = 1.0): Promise<TimingResult> {
  const start = performance.now();
  try {
    const response = await fetch(`https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Key ${ENV.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text, response_format: format, speed }),
    });
    const ttfb = performance.now() - start;
    if (!response.ok) return { label: `fetch(${format})`, ttfb: -1, total: -1 };
    const buf = await response.arrayBuffer();
    const total = performance.now() - start;
    return {
      label: `BUN fetch [${format}] speed=${speed}`,
      ttfb,
      total,
      extra: { bytes: buf.byteLength, textLen: text.length },
    };
  } catch {
    return { label: `fetch(${format})`, ttfb: -1, total: -1 };
  }
}

async function benchTTSStream(text: string, speed: number = 1.0): Promise<TimingResult> {
  const start = performance.now();
  let ttfb = 0;
  let chunks = 0;

  try {
    const stream = await fal.stream(ENV.TTS_ENDPOINT as any, {
      input: { input: text, speed },
      path: "/stream",
    } as any);

    for await (const event of stream as AsyncIterable<{ audio?: string }>) {
      if (event.audio) {
        if (ttfb === 0) ttfb = performance.now() - start;
        chunks++;
      }
    }
  } catch {
    return { label: "fal.stream", ttfb: -1, total: -1 };
  }

  const total = performance.now() - start;
  return {
    label: `BUN fal.stream speed=${speed}`,
    ttfb,
    total,
    extra: { chunks, textLen: text.length },
  };
}

// ═══════════════════════════════════════════════════════
//  STT BENCHMARK
// ═══════════════════════════════════════════════════════

async function generateTestAudio(text: string): Promise<Buffer> {
  const response = await fetch(`https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Key ${ENV.FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: text, response_format: "wav", speed: 1.0 }),
  });
  if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function benchSTTFetch(audioBuffer: Buffer): Promise<TimingResult> {
  const start = performance.now();
  const blob = new Blob([audioBuffer], { type: "audio/wav" });
  const formData = new FormData();
  formData.append("file", blob, "audio.wav");
  formData.append("language", "tr");

  try {
    const response = await fetch(`https://fal.run/${ENV.STT_ENDPOINT}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Key ${ENV.FAL_KEY}` },
      body: formData,
    });
    if (!response.ok) return { label: "BUN STT fetch", ttfb: -1, total: -1 };
    const result = (await response.json()) as { text: string };
    const total = performance.now() - start;
    return {
      label: "BUN STT fetch",
      ttfb: total,
      total,
      extra: { transcript: result.text?.slice(0, 60), audioBytes: audioBuffer.length },
    };
  } catch {
    return { label: "BUN STT fetch", ttfb: -1, total: -1 };
  }
}

// ═══════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════

async function main() {
  console.log("🏎️  Bun/TS Benchmark — Runtime Karşılaştırması");
  console.log("─".repeat(60));
  console.log("   Bun fetch + fal.ai SDK\n");

  // ─── LLM ─────────────────────────────────────────────
  console.log("🤖 LLM Model Karşılaştırması");

  const models = [
    "google/gemini-2.5-flash",
    "google/gemini-2.5-flash:nitro",
    "google/gemini-2.0-flash-001",
    "google/gemini-2.0-flash-lite-001",
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
    "meta-llama/llama-3.1-8b-instruct:nitro",
    "mistralai/mistral-small-3.1-24b-instruct",
  ];

  const llmResults: TimingResult[] = [];
  for (const model of models) {
    process.stdout.write(`   ${model} ... `);
    const r = await benchLLM(model);
    if (r.ttfb > 0) {
      console.log(`TTFB: ${fmt(r.ttfb)}, Total: ${fmt(r.total)}, ${r.extra?.["tok/s"]} tok/s`);
      llmResults.push(r);
    } else {
      console.log(`❌ ${r.extra?.error || "failed"}`);
    }
    await Bun.sleep(500);
  }
  printResults("BUN — LLM TTFT Karşılaştırması", llmResults);

  // ─── TTS ─────────────────────────────────────────────
  console.log("🔊 TTS Karşılaştırması");

  const ttsResults: TimingResult[] = [];

  // fetch variants
  for (const format of ["pcm", "wav", "mp3"]) {
    process.stdout.write(`   fetch ${format} ... `);
    const r = await benchTTSFetch(MEDIUM_TEXT, format);
    if (r.ttfb > 0) {
      console.log(`TTFB: ${fmt(r.ttfb)}, Total: ${fmt(r.total)}`);
      ttsResults.push(r);
    } else {
      console.log("❌");
    }
    await Bun.sleep(300);
  }

  // fal.stream
  process.stdout.write("   fal.stream ... ");
  const streamR = await benchTTSStream(MEDIUM_TEXT);
  if (streamR.ttfb > 0) {
    console.log(`TTFB: ${fmt(streamR.ttfb)}, Total: ${fmt(streamR.total)}`);
    ttsResults.push(streamR);
  } else {
    console.log("❌");
  }
  await Bun.sleep(300);

  // Short sentence (pipeline first sentence)
  process.stdout.write("   fetch pcm kısa cümle ... ");
  const shortR = await benchTTSFetch(SHORT_TTS_TEXT, "pcm");
  shortR.label = "BUN fetch [pcm] kısa cümle";
  if (shortR.ttfb > 0) {
    console.log(`TTFB: ${fmt(shortR.ttfb)}, Total: ${fmt(shortR.total)}`);
    ttsResults.push(shortR);
  } else {
    console.log("❌");
  }
  await Bun.sleep(300);

  // fal.stream short sentence
  process.stdout.write("   fal.stream kısa cümle ... ");
  const streamShort = await benchTTSStream(SHORT_TTS_TEXT);
  streamShort.label = "BUN fal.stream kısa cümle";
  if (streamShort.ttfb > 0) {
    console.log(`TTFB: ${fmt(streamShort.ttfb)}, Total: ${fmt(streamShort.total)}`);
    ttsResults.push(streamShort);
  } else {
    console.log("❌");
  }

  printResults("BUN — TTS Karşılaştırması", ttsResults);

  // ─── STT ─────────────────────────────────────────────
  console.log("🎤 STT Karşılaştırması");

  process.stdout.write("   Test audio oluşturuluyor... ");
  const audioData = await generateTestAudio("Ben bu problemi şöyle çözmeyi düşünüyorum.");
  console.log(`${audioData.length} bytes`);

  const sttResults: TimingResult[] = [];
  for (let i = 0; i < 3; i++) {
    process.stdout.write(`   Run ${i + 1} ... `);
    const r = await benchSTTFetch(audioData);
    if (r.ttfb > 0) {
      console.log(`Total: ${fmt(r.total)} — "${r.extra?.transcript}"`);
      sttResults.push(r);
    } else {
      console.log("❌");
    }
    await Bun.sleep(300);
  }
  printResults("BUN — STT Latency", sttResults);

  // ─── ÖZET ────────────────────────────────────────────
  console.log("═".repeat(60));
  console.log("  ⚡ E2E TAHMİN (En iyi sonuçlarla)");
  console.log("═".repeat(60));

  if (llmResults.length > 0 && sttResults.length > 0 && ttsResults.length > 0) {
    const bestLLM = llmResults.sort((a, b) => a.ttfb - b.ttfb)[0]!;
    const bestSTT = sttResults.sort((a, b) => a.total - b.total)[0]!;
    const bestTTS = ttsResults.sort((a, b) => a.ttfb - b.ttfb)[0]!;

    const e2e = bestSTT.total + bestLLM.ttfb + bestTTS.ttfb;

    console.log(`  STT:       ${fmt(bestSTT.total).padStart(7)}  (${bestSTT.label})`);
    console.log(`  LLM TTFT:  ${fmt(bestLLM.ttfb).padStart(7)}  (${bestLLM.label})`);
    console.log(`  TTS TTFB:  ${fmt(bestTTS.ttfb).padStart(7)}  (${bestTTS.label})`);
    console.log("─".repeat(60));
    console.log(`  TOPLAM:    ${fmt(e2e).padStart(7)}`);

    if (e2e < 2000) {
      console.log("  ✅ 2 SANİYENİN ALTINDA!");
    } else {
      console.log(`  ❌ 2s hedefine ${fmt(e2e - 2000)} uzak`);
    }
  }
  console.log("═".repeat(60));
}

main().catch(console.error);
