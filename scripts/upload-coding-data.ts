#!/usr/bin/env bun
/**
 * Upload generated coding data from JSONL to Convex.
 * Reads dataset/leetcode-coding-data.jsonl and upserts into leetcodeCodingData table.
 *
 * Usage:
 *   bun scripts/upload-coding-data.ts                # Upload all
 *   bun scripts/upload-coding-data.ts --limit 50     # First 50
 *   bun scripts/upload-coding-data.ts --dry-run      # Preview without uploading
 */

import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// ─── Config ──────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dir, "..");
const INPUT_FILE = path.join(ROOT, "dataset/leetcode-coding-data.jsonl");

// Load .env
const envText = fs.readFileSync(path.join(ROOT, ".env"), "utf-8");
const env: Record<string, string> = {};
for (const line of envText.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
}

const convex = new ConvexHttpClient(env.CONVEX_URL!);

// ─── Args ────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1]! : fallback;
}
const LIMIT = parseInt(getArg("limit", "0")) || Infinity;
const DRY_RUN = args.includes("--dry-run");
const CONCURRENCY = parseInt(getArg("concurrency", "10"));

// ─── Main ────────────────────────────────────────────────

async function main() {
  console.log("📤 Upload Coding Data to Convex");
  console.log(`   Input: ${INPUT_FILE}`);
  console.log(`   Convex: ${env.CONVEX_URL}`);
  console.log(`   Dry run: ${DRY_RUN}\n`);

  if (!fs.existsSync(INPUT_FILE)) {
    console.error("❌ Input file not found. Run batch-generate-coding-data.ts first.");
    process.exit(1);
  }

  const lines = fs.readFileSync(INPUT_FILE, "utf-8").split("\n").filter(Boolean);
  let rows = lines.map((l) => JSON.parse(l));

  if (LIMIT < Infinity) {
    rows = rows.slice(0, LIMIT);
  }

  console.log(`📦 ${rows.length} rows to upload\n`);

  if (DRY_RUN) {
    for (const row of rows.slice(0, 5)) {
      const cd = row.codingData;
      console.log(`  #${row.leetcodeId} ${row.title}`);
      console.log(`    Tests: ${cd.testCases.length}, Solution: ${cd.solutionCode?.javascript ? "✅" : "❌"}`);
    }
    if (rows.length > 5) console.log(`  ... and ${rows.length - 5} more`);
    console.log("\n🔍 Dry run complete. Remove --dry-run to upload.");
    return;
  }

  let done = 0;
  let failed = 0;
  const startTime = Date.now();

  // Process in batches
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const batch = rows.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (row) => {
        try {
          const cd = row.codingData;

          // Ensure expectedOutput is always a string (Convex schema expects string)
          const testCases = cd.testCases.map((tc: any) => ({
            input: String(tc.input),
            expectedOutput: typeof tc.expectedOutput === "string"
              ? tc.expectedOutput
              : JSON.stringify(tc.expectedOutput),
            isHidden: !!tc.isHidden,
          }));

          await convex.mutation(api.leetcodeCodingData.upsert, {
            leetcodeId: row.leetcodeId,
            starterCode: cd.starterCode,
            testCases,
            solutionCode: cd.solutionCode,
          });

          done++;
          console.log(`✅ [${done + failed}/${rows.length}] #${row.leetcodeId} ${row.title}`);
        } catch (err) {
          failed++;
          console.error(`❌ [${done + failed}/${rows.length}] #${row.leetcodeId} ${row.title}: ${err instanceof Error ? err.message : err}`);
        }
      }),
    );
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🏁 Done in ${elapsed}s — ✅ ${done} uploaded, ❌ ${failed} failed`);
}

main().catch(console.error);
