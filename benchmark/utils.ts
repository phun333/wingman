// Shared utilities for benchmark scripts

import path from "path";
import fs from "fs";

// Load .env from monorepo root
function loadEnv() {
  const root = path.resolve(import.meta.dir, "..");
  const envPath = path.join(root, ".env");
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, "utf-8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

loadEnv();

export const ENV = {
  FAL_KEY: process.env.FAL_KEY!,
  TTS_ENDPOINT: process.env.TTS_ENDPOINT || "freya-mypsdi253hbk/freya-tts",
  STT_ENDPOINT: process.env.STT_ENDPOINT || "freya-mypsdi253hbk/freya-stt",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash",
  SITE_URL: process.env.SITE_URL || "http://localhost:3000",
};

// ─── Timing helper ─────────────────────────────────────

export interface TimingResult {
  label: string;
  ttfb: number;       // Time to first byte/token (ms)
  total: number;      // Total time (ms)
  extra?: Record<string, any>;
}

export function fmt(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function printResults(title: string, results: TimingResult[]) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);

  // Sort by total ascending
  const sorted = [...results].sort((a, b) => a.total - b.total);

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i]!;
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "  ";
    const bar = "█".repeat(Math.min(40, Math.round(r.total / 50)));
    console.log(`${medal} ${r.label.padEnd(45)} TTFB: ${fmt(r.ttfb).padStart(7)} | Total: ${fmt(r.total).padStart(7)}`);
    console.log(`   ${bar}`);
    if (r.extra) {
      const extras = Object.entries(r.extra).map(([k, v]) => `${k}=${v}`).join(", ");
      console.log(`   └─ ${extras}`);
    }
  }

  console.log(`${"─".repeat(60)}`);
  if (sorted[0]) {
    console.log(`  🏆 EN HIZLI: ${sorted[0].label} (${fmt(sorted[0].total)})`);
  }
  console.log();
}

// ─── Test audio generation (short Turkish sentence) ────

export async function generateTestAudio(): Promise<Buffer> {
  // Generate a short TTS audio to use as STT test input
  const response = await fetch(
    `https://fal.run/${ENV.TTS_ENDPOINT}/audio/speech`,
    {
      method: "POST",
      headers: {
        Authorization: `Key ${ENV.FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: "Merhaba, ben bu problemi şöyle çözmeyi düşünüyorum. Önce bir hash map kullanarak elemanları saklayabiliriz.",
        response_format: "wav",
        speed: 1.0,
      }),
    },
  );

  if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
  const buf = await response.arrayBuffer();
  return Buffer.from(buf);
}

// ─── Average helper ────────────────────────────────────

export function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}
