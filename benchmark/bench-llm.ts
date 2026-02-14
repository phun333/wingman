#!/usr/bin/env bun
/**
 * 🤖 LLM Benchmark — Model Karşılaştırması
 *
 * En kritik darboğaz: LLM TTFT (Time To First Token)
 * Farklı modeller + :nitro varyantları + prompt boyutu optimizasyonu test edilir.
 */

import { ENV, fmt, printResults, avg, median, type TimingResult } from "./utils";

// ─── Test edilecek modeller ────────────────────────────

const MODELS = [
  // Mevcut
  "google/gemini-2.5-flash",
  // Nitro varyant (en hızlı provider'a yönlendir)
  "google/gemini-2.5-flash:nitro",
  // Daha hafif Gemini
  "google/gemini-2.0-flash-001",
  // Küçük + hızlı modeller
  "google/gemini-2.0-flash-lite-001",
  // GPT-4o Mini
  "openai/gpt-4o-mini",
  // Claude Haiku (ultra-hızlı)
  "anthropic/claude-3-haiku",
  // Llama küçük + nitro
  "meta-llama/llama-3.1-8b-instruct:nitro",
  // Mistral Small
  "mistralai/mistral-small-3.1-24b-instruct",
];

// ─── System prompts (kısa vs uzun) ────────────────────

const SHORT_SYSTEM_PROMPT = `Sen Wingman, Türkçe teknik mülakatçısın. Kısa ve öz cevap ver, 2-3 cümle. Sesli konuşma formatında yaz.`;

const LONG_SYSTEM_PROMPT = `Sen Wingman adında deneyimli bir teknik mülakatçısın. Türkçe konuşuyorsun.
Adayı profesyonel ama samimi bir şekilde karşıla. Sorularını net ve anlaşılır sor.
Cevapları değerlendirirken yapıcı ol. Kısa ve öz konuş — her cevabın 2-3 cümleyi geçmesin.
Bu sesli bir konuşmadır. Liste yapma, madde madde yazma. Doğal ve akıcı konuş.
Her cümleni tamamla, yarıda bırakma. Teknik terimleri Türkçe açıkla.`;

const USER_MESSAGE = "Hash map ve array arasındaki farkı açıklayabilir misin? Hangi durumda hangisini tercih edersin?";

// ─── Single model benchmark ───────────────────────────

async function benchModel(
  model: string,
  systemPrompt: string,
  maxTokens: number,
): Promise<TimingResult & { tokens: number; firstTokenContent: string }> {
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: USER_MESSAGE },
  ];

  const start = performance.now();
  let ttfb = 0;
  let tokens = 0;
  let fullText = "";
  let firstTokenContent = "";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": ENV.SITE_URL,
        "X-Title": "Wingman Benchmark",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        label: model,
        ttfb: -1,
        total: -1,
        tokens: 0,
        firstTokenContent: `ERROR: ${response.status} - ${errorText.slice(0, 100)}`,
      };
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No stream");

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const token = parsed.choices?.[0]?.delta?.content;
          if (!token) continue;

          tokens++;
          fullText += token;

          if (ttfb === 0) {
            ttfb = performance.now() - start;
            firstTokenContent = token;
          }
        } catch {
          // skip
        }
      }
    }
  } catch (err) {
    return {
      label: model,
      ttfb: -1,
      total: -1,
      tokens: 0,
      firstTokenContent: `NETWORK ERROR: ${err}`,
    };
  }

  const total = performance.now() - start;
  const tokPerSec = tokens / (total / 1000);

  return {
    label: model,
    ttfb,
    total,
    tokens,
    firstTokenContent,
    extra: {
      tokens,
      "tok/s": Math.round(tokPerSec),
      responseLength: fullText.length,
    },
  };
}

// ─── Main ──────────────────────────────────────────────

async function main() {
  console.log("🤖 LLM Benchmark — Model Karşılaştırması");
  console.log("─".repeat(60));

  const RUNS = 2; // Her model için 2 run (ilk çağrı cold olabilir)

  // ── Test 1: Model karşılaştırması (kısa prompt, max_tokens=200) ──
  console.log("\n📊 Test 1: Model TTFT Karşılaştırması (short prompt, max_tokens=200)");
  console.log(`   Her model ${RUNS}x çalıştırılacak...\n`);

  const modelResults: TimingResult[] = [];

  for (const model of MODELS) {
    process.stdout.write(`   Testing ${model}... `);
    const runs: { ttfb: number; total: number; tokens: number }[] = [];

    for (let i = 0; i < RUNS; i++) {
      const r = await benchModel(model, SHORT_SYSTEM_PROMPT, 200);
      if (r.ttfb > 0) {
        runs.push({ ttfb: r.ttfb, total: r.total, tokens: r.tokens });
      }
      if (i === 0 && r.ttfb < 0) {
        console.log(`❌ ${r.firstTokenContent}`);
        break;
      }
    }

    if (runs.length > 0) {
      const result: TimingResult = {
        label: model,
        ttfb: median(runs.map((r) => r.ttfb)),
        total: median(runs.map((r) => r.total)),
        extra: {
          tokens: Math.round(avg(runs.map((r) => r.tokens))),
          "tok/s": Math.round(avg(runs.map((r) => r.tokens)) / (avg(runs.map((r) => r.total)) / 1000)),
          runs: runs.length,
        },
      };
      modelResults.push(result);
      console.log(`TTFB: ${fmt(result.ttfb)}, Total: ${fmt(result.total)}`);
    }

    // Rate limit koruması
    await Bun.sleep(500);
  }

  printResults("Model TTFT Karşılaştırması (short prompt, 200 tokens)", modelResults);

  // ── Test 2: Prompt boyutu etkisi (en hızlı model ile) ──
  const fastestModel = modelResults.sort((a, b) => a.ttfb - b.ttfb)[0];
  if (!fastestModel) {
    console.log("❌ Hiçbir model çalışmadı!");
    return;
  }

  console.log(`\n📊 Test 2: Prompt Boyutu Etkisi (${fastestModel.label})`);

  const promptResults: TimingResult[] = [];

  // Kısa prompt
  process.stdout.write("   Short prompt... ");
  const shortR = await benchModel(fastestModel.label, SHORT_SYSTEM_PROMPT, 200);
  if (shortR.ttfb > 0) {
    promptResults.push({ label: "Short System Prompt (120 char)", ttfb: shortR.ttfb, total: shortR.total });
    console.log(`TTFB: ${fmt(shortR.ttfb)}`);
  }

  await Bun.sleep(300);

  // Uzun prompt
  process.stdout.write("   Long prompt... ");
  const longR = await benchModel(fastestModel.label, LONG_SYSTEM_PROMPT, 200);
  if (longR.ttfb > 0) {
    promptResults.push({ label: "Long System Prompt (450 char)", ttfb: longR.ttfb, total: longR.total });
    console.log(`TTFB: ${fmt(longR.ttfb)}`);
  }

  await Bun.sleep(300);

  // Çok uzun prompt (gerçek senaryoyu simüle et)
  const VERY_LONG_PROMPT = LONG_SYSTEM_PROMPT + `\n\n[Mülakata atanan problem]
Başlık: Two Sum
Zorluk: Easy
Açıklama: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
İlgili Konular: Array, Hash Table
Beklenen Zaman Karmaşıklığı: O(n)

[Aday Özgeçmiş]
İsim: Test User
Pozisyon: Frontend Developer
Deneyim: 3 yıl
Yetenekler: React, TypeScript, Node.js, Python

--- MÜLAKAT TALİMATLARI ---
Bu bir teknik mülakat sorusudur. Sen mülakatçısın, aday bu problemi çözmeye çalışacak.
1. Problemi doğal bir dille açıkla.
2. Adayın yaklaşımını sor, direkt çözüm verme.
3. Test sonuçlarını değerlendir.`;

  process.stdout.write("   Very long prompt (real scenario)... ");
  const veryLongR = await benchModel(fastestModel.label, VERY_LONG_PROMPT, 200);
  if (veryLongR.ttfb > 0) {
    promptResults.push({ label: "Very Long Prompt (real scenario, ~900 char)", ttfb: veryLongR.ttfb, total: veryLongR.total });
    console.log(`TTFB: ${fmt(veryLongR.ttfb)}`);
  }

  printResults("Prompt Boyutu Etkisi", promptResults);

  // ── Test 3: max_tokens etkisi ──
  console.log(`\n📊 Test 3: max_tokens Etkisi (${fastestModel.label})`);

  const tokenResults: TimingResult[] = [];

  for (const maxTok of [100, 200, 300, 500]) {
    process.stdout.write(`   max_tokens=${maxTok}... `);
    const r = await benchModel(fastestModel.label, SHORT_SYSTEM_PROMPT, maxTok);
    if (r.ttfb > 0) {
      tokenResults.push({
        label: `max_tokens=${maxTok}`,
        ttfb: r.ttfb,
        total: r.total,
        extra: { tokens: r.tokens },
      });
      console.log(`TTFB: ${fmt(r.ttfb)}, Total: ${fmt(r.total)}, Tokens: ${r.tokens}`);
    }
    await Bun.sleep(300);
  }

  printResults("max_tokens Etkisi", tokenResults);

  // ── Özet ──
  console.log("\n" + "═".repeat(60));
  console.log("  📋 ÖZET ÖNERİLER");
  console.log("═".repeat(60));

  const best = modelResults[0];
  if (best) {
    console.log(`  1. Model: ${best.label} (TTFB: ${fmt(best.ttfb)})`);
  }
  console.log(`  2. :nitro suffix kullan → en hızlı provider'a yönlendir`);
  console.log(`  3. System prompt'u kısa tut → TTFB'yi düşürür`);
  console.log(`  4. max_tokens=150-200 yeterli → gereksiz token üretme`);
  console.log();
}

main().catch(console.error);
