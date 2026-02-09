/**
 * Freya TTS → STT Pipeline (TypeScript)
 *
 * Tam bir round-trip pipeline:
 *   1. Metin → TTS ile ses üretimi (fal.subscribe)
 *   2. CDN'den audio indirme
 *   3. Audio → STT ile transkripsiyon (fetch ile /audio/transcriptions)
 *
 * Orijinal Python gist'inden uyarlanmıştır.
 *
 * Kullanım:
 *   bun run docs/freya-pipeline.ts "Bugün hava çok güzel!"
 *
 * Gereksinimler:
 *   - FAL_KEY env variable
 *   - TTS_ENDPOINT env variable (default: freya-mypsdi253hbk/freya-tts)
 *   - STT_ENDPOINT env variable (default: freya-mypsdi253hbk/freya-stt)
 *   - bun add @fal-ai/client
 *
 * @see https://fal.ai/models/freya-mypsdi253hbk/freya-tts/generate
 * @see https://fal.ai/models/freya-mypsdi253hbk/freya-stt/audio/transcriptions
 */

import { fal } from "@fal-ai/client";
import { writeFileSync } from "fs";

// ─── Config ──────────────────────────────────────────────

const TTS_ENDPOINT = process.env.TTS_ENDPOINT || "freya-mypsdi253hbk/freya-tts";
const STT_ENDPOINT = process.env.STT_ENDPOINT || "freya-mypsdi253hbk/freya-stt";
const STT_BASE_URL = `https://fal.run/${STT_ENDPOINT}`;
const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  throw new Error("FAL_KEY environment variable is not set.");
}

fal.config({
  credentials: FAL_KEY,
});

// ─── Types ───────────────────────────────────────────────

interface TTSResult {
  audio: {
    url: string;
    content_type?: string;
  };
  inference_time_ms?: number;
  audio_duration_sec?: number;
}

interface STTResult {
  text: string;
  [key: string]: unknown;
}

interface PipelineResult {
  inputText: string;
  language: string;
  tts: {
    audioUrl: string;
    inferenceTimeMs?: number;
    audioDurationSec?: number;
    elapsedTimeSec: number;
  };
  download: {
    sizeBytes: number;
    elapsedTimeSec: number;
    savedTo?: string;
  };
  stt: {
    transcribedText: string;
    elapsedTimeSec: number;
    fullResponse: STTResult;
  };
  totals: {
    totalElapsedSec: number;
    ttsTimeSec: number;
    downloadTimeSec: number;
    sttTimeSec: number;
  };
  comparison: {
    inputText: string;
    outputText: string;
    inputLength: number;
    outputLength: number;
  };
}

// ─── Step 1: TTS — Ses Üretimi ──────────────────────────

/**
 * fal.subscribe ile TTS /generate endpoint'ini kullanarak ses üretir.
 * CDN üzerinden erişilebilir bir audio URL döner.
 */
async function generateSpeech(
  text: string,
  responseFormat: string = "wav",
  speed: number = 1.0
): Promise<TTSResult> {
  console.log(`Generating speech for: '${text.slice(0, 50)}...' (${text.length} chars)`);

  const result = await fal.subscribe(TTS_ENDPOINT, {
    input: {
      input: text,
      response_format: responseFormat,
      speed,
    },
    path: "/generate",
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === "IN_PROGRESS") {
        const logs = (update as any).logs;
        if (logs) {
          for (const log of logs) {
            console.log(`  [TTS] ${log.message}`);
          }
        }
      }
    },
  });

  return result.data as unknown as TTSResult;
}

// ─── Step 2: Audio İndirme ───────────────────────────────

/**
 * CDN URL'sinden audio dosyasını indirir.
 */
async function downloadAudio(url: string): Promise<Buffer> {
  console.log("Downloading audio from CDN...");

  const response = await fetch(url, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(`  Downloaded ${buffer.length} bytes`);

  return buffer;
}

// ─── Step 3: STT — Transkripsiyon ────────────────────────

/**
 * OpenAI-uyumlu /audio/transcriptions endpoint'i ile audio'yu metne çevirir.
 * Multipart form-data ile audio dosyası gönderilir.
 */
async function transcribeAudio(
  audioBytes: Buffer,
  filename: string = "audio.wav",
  language: string = "tr"
): Promise<STTResult> {
  console.log("Transcribing audio...");

  const formData = new FormData();
  const blob = new Blob([audioBytes], { type: "audio/wav" });
  formData.append("file", blob, filename);
  formData.append("language", language);

  const response = await fetch(`${STT_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Transcription failed: ${response.status} — ${errorText}`);
  }

  return (await response.json()) as STTResult;
}

// ─── Pipeline ────────────────────────────────────────────

/**
 * Tam TTS → STT pipeline'ını çalıştırır.
 */
async function runPipeline(
  text: string,
  saveAudio: boolean = true
): Promise<PipelineResult> {
  const totalStart = performance.now();

  // Step 1: TTS
  console.log();
  console.log("Step 1: Text-to-Speech");
  console.log("-".repeat(40));

  const ttsStart = performance.now();
  const ttsResult = await generateSpeech(text, "wav", 1.0);
  const ttsElapsed = (performance.now() - ttsStart) / 1000;

  const audioUrl = ttsResult.audio.url;
  console.log(`  Audio URL: ${audioUrl.slice(0, 60)}...`);
  console.log(`  Inference: ${ttsResult.inference_time_ms ?? "N/A"}ms`);
  console.log(`  Duration:  ${ttsResult.audio_duration_sec ?? "N/A"}s`);

  // Step 2: Download
  console.log();
  console.log("Step 2: Download Audio");
  console.log("-".repeat(40));

  const downloadStart = performance.now();
  const audioBytes = await downloadAudio(audioUrl);
  const downloadElapsed = (performance.now() - downloadStart) / 1000;

  let savedTo: string | undefined;
  if (saveAudio) {
    savedTo = "pipeline_audio.wav";
    writeFileSync(savedTo, audioBytes);
    console.log(`  Saved to: ${savedTo}`);
  }

  // Step 3: STT
  console.log();
  console.log("Step 3: Speech-to-Text");
  console.log("-".repeat(40));

  const sttStart = performance.now();
  const sttResult = await transcribeAudio(audioBytes, "audio.wav", "tr");
  const sttElapsed = (performance.now() - sttStart) / 1000;

  const transcribedText = sttResult.text ?? "";
  console.log(`  Transcribed: '${transcribedText}'`);

  const totalElapsed = (performance.now() - totalStart) / 1000;

  return {
    inputText: text,
    language: "tr",
    tts: {
      audioUrl,
      inferenceTimeMs: ttsResult.inference_time_ms,
      audioDurationSec: ttsResult.audio_duration_sec,
      elapsedTimeSec: round(ttsElapsed),
    },
    download: {
      sizeBytes: audioBytes.length,
      elapsedTimeSec: round(downloadElapsed),
      savedTo,
    },
    stt: {
      transcribedText,
      elapsedTimeSec: round(sttElapsed),
      fullResponse: sttResult,
    },
    totals: {
      totalElapsedSec: round(totalElapsed),
      ttsTimeSec: round(ttsElapsed),
      downloadTimeSec: round(downloadElapsed),
      sttTimeSec: round(sttElapsed),
    },
    comparison: {
      inputText: text,
      outputText: transcribedText,
      inputLength: text.length,
      outputLength: transcribedText.length,
    },
  };
}

function round(n: number, decimals = 3): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const noSave = args.includes("--no-save");
  const text =
    args.filter((a) => a !== "--no-save").join(" ") || "Selam, merhaba!";

  console.log("=".repeat(60));
  console.log("Freya TTS → STT Pipeline");
  console.log("=".repeat(60));

  try {
    const results = await runPipeline(text, !noSave);

    console.log();
    console.log("=".repeat(60));
    console.log("Pipeline Results");
    console.log("=".repeat(60));
    console.log();

    console.log("Timing:");
    console.log(`  TTS generation:  ${results.totals.ttsTimeSec}s`);
    console.log(`  Audio download:  ${results.totals.downloadTimeSec}s`);
    console.log(`  STT transcribe:  ${results.totals.sttTimeSec}s`);
    console.log(`  Total pipeline:  ${results.totals.totalElapsedSec}s`);
    console.log();

    console.log("Round-trip comparison:");
    console.log(`  Input:  '${results.comparison.inputText}'`);
    console.log(`  Output: '${results.comparison.outputText}'`);

    if (results.download.savedTo) {
      console.log();
      console.log(`Audio saved to: ${results.download.savedTo}`);
    }
  } catch (error) {
    console.error(`❌ Pipeline error: ${error}`);
    process.exit(1);
  }
}

main();
