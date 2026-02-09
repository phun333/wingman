/**
 * Freya + LiveKit — OpenAI-Compatible STT/TTS Entegrasyonu (TypeScript)
 *
 * LiveKit'in OpenAI uyumlu STT ve TTS plugin'leri ile Freya endpoint'lerini
 * kullanmak için yapılandırma örneği.
 *
 * Orijinal Python gist'inden uyarlanmıştır.
 *
 * Gereksinimler:
 *   - bun add openai @livekit/agents-plugin-openai (veya ilgili LiveKit SDK)
 *   - FAL_KEY env variable
 *   - TTS_ENDPOINT env variable
 *   - STT_ENDPOINT env variable
 *
 * NOT: Bu dosya doğrudan çalıştırılabilir bir script değil,
 *      LiveKit entegrasyonu için referans/config örneğidir.
 *
 * @see https://fal.ai/models/freya-mypsdi253hbk/freya-stt
 * @see https://fal.ai/models/freya-mypsdi253hbk/freya-tts
 */

import OpenAI from "openai";

// ─── Config ──────────────────────────────────────────────

const FAL_KEY = process.env.FAL_KEY;
const TTS_ENDPOINT = process.env.TTS_ENDPOINT || "freya-mypsdi253hbk/freya-tts";
const STT_ENDPOINT = process.env.STT_ENDPOINT || "freya-mypsdi253hbk/freya-stt";

if (!FAL_KEY) {
  throw new Error("FAL_KEY environment variable is not set.");
}

const headers = {
  Authorization: `Key ${FAL_KEY}`,
};

// ─── STT Client ──────────────────────────────────────────

/**
 * Freya STT için OpenAI-uyumlu client.
 *
 * LiveKit'in openai STT plugin'i bu client'ı kullanabilir.
 * Base URL olarak fal.ai STT endpoint'i belirtilir.
 */
const sttClient = new OpenAI({
  apiKey: "stub", // fal.ai Authorization header kullanır, bu alan zorunlu olduğu için stub
  baseURL: `https://fal.run/${STT_ENDPOINT}`,
  defaultHeaders: headers,
});

// ─── TTS Client ──────────────────────────────────────────

/**
 * Freya TTS için OpenAI-uyumlu client.
 *
 * LiveKit'in openai TTS plugin'i bu client'ı kullanabilir.
 * Base URL olarak fal.ai TTS endpoint'i belirtilir.
 */
const ttsClient = new OpenAI({
  apiKey: "stub", // fal.ai Authorization header kullanır
  baseURL: `https://fal.run/${TTS_ENDPOINT}`,
  defaultHeaders: headers,
});

// ─── LiveKit Entegrasyonu (Kavramsal) ────────────────────

/**
 * LiveKit Agent'larında kullanım örneği:
 *
 * ```typescript
 * import { openai } from "@livekit/agents-plugin-openai";
 *
 * // STT plugin
 * const stt = new openai.STT({
 *   client: sttClient,
 *   model: "freya-stt-v1",
 * });
 *
 * // TTS plugin
 * const tts = new openai.TTS({
 *   client: ttsClient,
 *   model: "freya-tts-v1",
 * });
 * ```
 */

// ─── Standalone Kullanım Örnekleri ───────────────────────

/**
 * OpenAI SDK ile doğrudan TTS kullanımı.
 * LiveKit olmadan da çalışır.
 */
async function ttsExample() {
  console.log("TTS Example — OpenAI SDK ile Freya TTS");
  console.log("-".repeat(40));

  const response = await ttsClient.audio.speech.create({
    model: "freya-tts-v1",
    input: "Merhaba, bu bir test!",
    voice: "alloy", // Freya'nın desteklediği voice
    response_format: "wav",
    speed: 1.0,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  console.log(`✅ Generated ${buffer.length} bytes of audio`);

  // Dosyaya kaydet
  const { writeFileSync } = await import("fs");
  writeFileSync("livekit_tts_output.wav", buffer);
  console.log("Saved to: livekit_tts_output.wav");
}

/**
 * OpenAI SDK ile doğrudan STT kullanımı.
 * LiveKit olmadan da çalışır.
 */
async function sttExample() {
  console.log();
  console.log("STT Example — OpenAI SDK ile Freya STT");
  console.log("-".repeat(40));

  const { readFileSync } = await import("fs");
  const { existsSync } = await import("fs");

  const audioFile = "livekit_tts_output.wav";
  if (!existsSync(audioFile)) {
    console.log("⚠️  Audio file not found. Run ttsExample first.");
    return;
  }

  const audioBuffer = readFileSync(audioFile);
  const file = new File([audioBuffer], "audio.wav", { type: "audio/wav" });

  const transcription = await sttClient.audio.transcriptions.create({
    model: "freya-stt-v1",
    file,
    language: "tr",
  });

  console.log(`✅ Transcription: "${transcription.text}"`);
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("Freya + LiveKit — OpenAI-Compatible Integration");
  console.log("=".repeat(60));
  console.log();

  console.log("Clients configured:");
  console.log(`  STT: https://fal.run/${STT_ENDPOINT}`);
  console.log(`  TTS: https://fal.run/${TTS_ENDPOINT}`);
  console.log();

  await ttsExample();
  await sttExample();
}

main();

// ─── Exports ─────────────────────────────────────────────

export { sttClient, ttsClient };
