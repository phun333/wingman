/**
 * Freya TTS — OpenAI-Compatible Client (TypeScript)
 *
 * OpenAI TTS API ile uyumlu `/audio/speech` endpoint'ini kullanır.
 * fal.ai client yerine direkt HTTP istekleri gönderir.
 * Orijinal Python gist'inden uyarlanmıştır.
 *
 * Kullanım:
 *   bun run docs/freya-tts-openai-compat.ts "Selam, merhaba!"
 *
 * Gereksinimler:
 *   - FAL_KEY env variable
 *   - TTS_ENDPOINT env variable (default: freya-mypsdi253hbk/freya-tts)
 *
 * @see https://fal.ai/models/freya-mypsdi253hbk/freya-tts/audio/speech
 */

import { writeFileSync } from "fs";

// ─── Config ──────────────────────────────────────────────

const TTS_ENDPOINT = process.env.TTS_ENDPOINT || "freya-mypsdi253hbk/freya-tts";
const BASE_URL = `https://fal.run/${TTS_ENDPOINT}`;
const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  console.error("FAL_KEY environment variable is not set.");
  process.exit(1);
}

// ─── Types ───────────────────────────────────────────────

interface ModelInfo {
  id: string;
  [key: string]: unknown;
}

interface ModelsResponse {
  data: ModelInfo[];
}

type AudioFormat = "mp3" | "opus" | "aac" | "flac" | "wav" | "pcm";

// ─── API Functions ───────────────────────────────────────

/**
 * Kullanılabilir TTS modellerini listeler.
 */
async function listModels(): Promise<ModelInfo[]> {
  const url = `${BASE_URL}/models`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Models request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as ModelsResponse;
  return data.data ?? [];
}

/**
 * OpenAI-uyumlu /audio/speech endpoint'i ile ses üretir.
 *
 * Binary audio response döner — direkt dosyaya yazılabilir.
 * Response header'larında inference süresi ve audio süresi bilgileri bulunur.
 */
async function generateSpeech(
  text: string,
  responseFormat: AudioFormat = "wav",
  speed: number = 1.0,
  outputPath?: string
): Promise<string> {
  const url = `${BASE_URL}/audio/speech`;

  const payload = {
    input: text,
    response_format: responseFormat,
    speed,
  };

  console.log(`Generating speech for: '${text.slice(0, 50)}...' (${text.length} chars)`);
  console.log(`Format: ${responseFormat}, Speed: ${speed}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Speech generation failed: ${response.status} — ${errorText}`);
  }

  // Timing bilgilerini header'lardan al
  const inferenceTime = response.headers.get("X-Inference-Time-Ms") ?? "N/A";
  const audioDuration = response.headers.get("X-Audio-Duration-Sec") ?? "N/A";

  console.log(`Inference time: ${inferenceTime}ms`);
  console.log(`Audio duration: ${audioDuration}s`);

  // Dosyaya kaydet
  const ext = responseFormat !== "pcm" ? responseFormat : "raw";
  const finalPath = outputPath ?? `openai_output.${ext}`;

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  writeFileSync(finalPath, buffer);

  console.log(`Saved to: ${finalPath} (${buffer.length} bytes)`);
  return finalPath;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const text = process.argv.slice(2).join(" ") || "Selam, merhaba!";

  console.log("=".repeat(60));
  console.log("Freya TTS — OpenAI-Compatible Client");
  console.log("=".repeat(60));
  console.log();

  // Modelleri listele
  console.log("Fetching available models...");
  try {
    const models = await listModels();
    console.log(`Available models: [${models.map((m) => m.id).join(", ")}]`);
  } catch (error) {
    console.log(`⚠️  Could not fetch models: ${error}`);
  }
  console.log();

  // Ses üret
  console.log("Generating speech...");
  try {
    const outputFile = await generateSpeech(text, "wav", 1.0);
    console.log();
    console.log(`✅ Success! Audio saved to: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Error generating speech: ${error}`);
    process.exit(1);
  }
}

main();
