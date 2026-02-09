/**
 * Freya TTS — Streaming Client (TypeScript)
 *
 * PCM16 chunk'ları ile gerçek zamanlı ses üretimi.
 * Orijinal Python gist'inden uyarlanmıştır.
 *
 * Kullanım:
 *   bun run docs/freya-tts-streaming.ts "Selam, merhaba!"
 *
 * Gereksinimler:
 *   - FAL_KEY env variable
 *   - TTS_ENDPOINT env variable (default: freya-mypsdi253hbk/freya-tts)
 *   - bun add @fal-ai/client
 *
 * @see https://fal.ai/models/freya-mypsdi253hbk/freya-tts/stream
 */

import { fal } from "@fal-ai/client";
import { writeFileSync } from "fs";

// ─── Config ──────────────────────────────────────────────

const TTS_ENDPOINT = process.env.TTS_ENDPOINT || "freya-mypsdi253hbk/freya-tts";
const SAMPLE_RATE = 16_000; // PCM16 at 16kHz

if (!process.env.FAL_KEY) {
  throw new Error("FAL_KEY environment variable is not set.");
}

fal.config({
  credentials: process.env.FAL_KEY,
});

// ─── Types ───────────────────────────────────────────────

interface StreamEvent {
  audio?: string; // base64 encoded PCM16 chunk
  error?: { message: string };
  recoverable?: boolean;
  done?: boolean;
  inference_time_ms?: number;
  audio_duration_sec?: number;
}

interface StreamResult {
  outputPath: string;
  chunkCount: number;
  totalBytes: number;
  actualDurationSec: number;
  elapsedTimeSec: number;
  inferenceTimeMs?: number;
  reportedDurationSec?: number;
  errors: Array<{ message: string }>;
}

// ─── WAV Helper ──────────────────────────────────────────

/**
 * Raw PCM16 byte'larını WAV dosyası olarak kaydeder.
 *
 * WAV header formatı:
 * - RIFF header (44 bytes)
 * - Mono, 16-bit, belirtilen sample rate
 */
function savePcmAsWav(
  pcmBuffer: Buffer,
  outputPath: string,
  sampleRate: number = SAMPLE_RATE
): string {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);

  // RIFF header
  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);

  // fmt sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // sub-chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([header, pcmBuffer]);
  writeFileSync(outputPath, wavBuffer);

  return outputPath;
}

// ─── Stream Speech ───────────────────────────────────────

/**
 * fal.ai üzerinden TTS streaming yapar.
 *
 * Her chunk base64-encoded PCM16 olarak gelir.
 * Tüm chunk'lar birleştirilip WAV dosyası olarak kaydedilir.
 */
async function streamSpeech(
  text: string,
  speed: number = 1.0,
  outputPath: string = "stream_output.wav"
): Promise<StreamResult> {
  console.log(`Streaming: '${text.slice(0, 50)}...' (${text.length} chars)`);
  console.log(`Speed: ${speed}`);
  console.log();

  const audioChunks: Buffer[] = [];
  let chunkCount = 0;
  const errors: Array<{ message: string }> = [];
  let metadata: { inference_time_ms?: number; audio_duration_sec?: number } = {};

  const startTime = performance.now();

  // fal.stream ile gerçek zamanlı streaming
  const stream = await fal.stream(TTS_ENDPOINT, {
    input: { input: text, speed },
    path: "/stream",
  });

  for await (const event of stream as AsyncIterable<StreamEvent>) {
    // Audio chunk geldi
    if (event.audio) {
      chunkCount++;
      const pcmBytes = Buffer.from(event.audio, "base64");
      audioChunks.push(pcmBytes);

      const chunkSamples = pcmBytes.length / 2; // 16-bit = 2 bytes per sample
      const chunkDurationMs = (chunkSamples / SAMPLE_RATE) * 1000;
      console.log(
        `  Chunk ${chunkCount}: ${pcmBytes.length} bytes (${chunkDurationMs.toFixed(0)}ms audio)`
      );
    }

    // Hata geldi
    if (event.error) {
      errors.push(event.error);
      if (event.recoverable) {
        console.log(`  ⚠️  Warning: ${event.error.message} (recoverable)`);
      } else {
        console.error(`  ❌ Error: ${event.error.message}`);
        throw new Error(event.error.message);
      }
    }

    // Stream tamamlandı
    if (event.done) {
      metadata = {
        inference_time_ms: event.inference_time_ms,
        audio_duration_sec: event.audio_duration_sec,
      };
      console.log();
      console.log("✅ Stream complete!");
    }
  }

  const elapsedTime = (performance.now() - startTime) / 1000;

  if (audioChunks.length === 0) {
    throw new Error("No audio chunks received from stream.");
  }

  // Tüm PCM chunk'larını birleştir ve WAV olarak kaydet
  const allPcm = Buffer.concat(audioChunks);
  savePcmAsWav(allPcm, outputPath);

  const totalSamples = allPcm.length / 2;
  const actualDurationSec = totalSamples / SAMPLE_RATE;

  return {
    outputPath,
    chunkCount,
    totalBytes: allPcm.length,
    actualDurationSec: Math.round(actualDurationSec * 1000) / 1000,
    elapsedTimeSec: Math.round(elapsedTime * 1000) / 1000,
    inferenceTimeMs: metadata.inference_time_ms,
    reportedDurationSec: metadata.audio_duration_sec,
    errors,
  };
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const text = process.argv.slice(2).join(" ") || "Selam, merhaba!";

  console.log("=".repeat(60));
  console.log("Freya TTS — Streaming Client");
  console.log("=".repeat(60));
  console.log();

  try {
    const result = await streamSpeech(text, 1.0, "stream_output.wav");

    console.log();
    console.log("=".repeat(60));
    console.log("Results:");
    console.log("=".repeat(60));
    console.log(`  Output file:     ${result.outputPath}`);
    console.log(`  Chunks received: ${result.chunkCount}`);
    console.log(`  Total size:      ${result.totalBytes} bytes`);
    console.log(`  Audio duration:  ${result.actualDurationSec}s`);
    console.log(`  Elapsed time:    ${result.elapsedTimeSec}s`);

    if (result.inferenceTimeMs) {
      console.log(`  Inference time:  ${result.inferenceTimeMs}ms (server-reported)`);
    }

    if (result.errors.length > 0) {
      console.log(`  Warnings:        ${result.errors.length} recoverable errors`);
    }

    const rtf =
      result.actualDurationSec > 0
        ? result.elapsedTimeSec / result.actualDurationSec
        : 0;
    console.log(
      `  Real-time factor: ${rtf.toFixed(2)}x (< 1.0 = faster than real-time)`
    );
  } catch (error) {
    console.error(`Failed to stream speech: ${error}`);
    process.exit(1);
  }
}

main();
