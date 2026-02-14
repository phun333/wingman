#!/usr/bin/env bun
/**
 * Batch generate coding data (starterCode + testCases + solutionCode)
 * for all LeetCode problems in the JSONL dataset.
 *
 * Uses OpenRouter API with concurrency control.
 * Results are saved to a JSONL file, then can be uploaded to Convex.
 *
 * Usage:
 *   bun scripts/batch-generate-coding-data.ts              # Generate all
 *   bun scripts/batch-generate-coding-data.ts --limit 50   # First 50
 *   bun scripts/batch-generate-coding-data.ts --skip-existing  # Skip already generated
 *   bun scripts/batch-generate-coding-data.ts --concurrency 5  # 5 parallel requests
 */

import fs from "fs";
import path from "path";

// ─── Config ──────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dir, "..");
const INPUT_FILE = path.join(ROOT, "dataset/leetcode-problems.jsonl");
const OUTPUT_FILE = path.join(ROOT, "dataset/leetcode-coding-data.jsonl");

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

const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY!;
const MODEL = env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

// ─── Args ────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1]! : fallback;
}
const LIMIT = parseInt(getArg("limit", "0")) || Infinity;
const CONCURRENCY = parseInt(getArg("concurrency", "10"));
const SKIP_EXISTING = args.includes("--skip-existing");

// ─── Prompt ──────────────────────────────────────────────

const GENERATION_PROMPT = `You are a coding interview platform assistant. Given a LeetCode problem, generate:

1. **Starter code templates** for JavaScript, Python, and TypeScript
2. **Test cases** extracted from the problem examples + 2-3 edge cases
3. **Solution code** for JavaScript (optimal approach)

RULES:
- Starter code must be a **function** that takes parameters and returns a value
- The function name must match LeetCode's convention (e.g., \`twoSum\`, \`addTwoNumbers\`)
- Use camelCase for JS/TS, snake_case for Python
- Include JSDoc/docstring with param types and return type
- Test case \`input\` must be valid JS expression(s) that can be passed to the function, separated by newlines
- Test case \`expectedOutput\` must be valid JSON
- Mark example test cases as \`isHidden: false\`, edge cases as \`isHidden: true\`
- For array outputs where order doesn't matter, sort them
- Solution should be concise and optimal

IMPORTANT: The test runner works like this:
- For JS/TS: The user's code is evaluated, then the function is called with parsed input args
- Input format: Each line is one argument, parsed via JSON.parse()
- Output: The return value is JSON.stringify'd and compared to expectedOutput

Respond with ONLY valid JSON (no markdown, no code fences):
{
  "starterCode": {
    "javascript": "...",
    "python": "...",
    "typescript": "..."
  },
  "testCases": [
    { "input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]", "isHidden": false },
    ...
  ],
  "solutionCode": {
    "javascript": "..."
  }
}`;

// ─── Types ───────────────────────────────────────────────

interface Problem {
  leetcodeId: number;
  title: string;
  description: string;
  difficulty: string;
  relatedTopics: string[];
}

interface CodingData {
  starterCode: { javascript: string; python: string; typescript: string };
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
  solutionCode?: { javascript?: string; python?: string; typescript?: string };
}

interface OutputRow {
  leetcodeId: number;
  title: string;
  codingData: CodingData;
}

// ─── Load existing results ───────────────────────────────

function loadExistingIds(): Set<number> {
  const ids = new Set<number>();
  if (!fs.existsSync(OUTPUT_FILE)) return ids;
  const lines = fs.readFileSync(OUTPUT_FILE, "utf-8").split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const row = JSON.parse(line) as OutputRow;
      ids.add(row.leetcodeId);
    } catch {}
  }
  return ids;
}

// ─── Generate via OpenRouter ─────────────────────────────

async function generateCodingData(problem: Problem, retries = 2): Promise<CodingData | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Wingman Batch Generator",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: GENERATION_PROMPT },
            {
              role: "user",
              content: `Problem: ${problem.title}\nTopics: ${problem.relatedTopics.join(", ")}\n\nDescription:\n${problem.description}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 8000,
          response_format: { type: "json_object" },
        }),
      });

      if (response.status === 429) {
        const wait = Math.pow(2, attempt + 1) * 1000;
        console.log(`  ⏳ Rate limited, waiting ${wait / 1000}s...`);
        await sleep(wait);
        continue;
      }

      if (!response.ok) {
        console.error(`  ❌ API error ${response.status}: ${await response.text()}`);
        if (attempt < retries) await sleep(1000);
        continue;
      }

      const data = (await response.json()) as any;
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        console.error(`  ❌ Empty response`);
        continue;
      }

      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      let parsed: CodingData;
      try {
        parsed = JSON.parse(jsonStr) as CodingData;
      } catch {
        // Try to repair truncated JSON — close open strings/arrays/objects
        parsed = JSON.parse(repairJSON(jsonStr)) as CodingData;
      }

      // Validate
      if (!parsed.starterCode?.javascript || !parsed.starterCode?.python || !parsed.starterCode?.typescript) {
        console.error(`  ❌ Invalid starterCode`);
        continue;
      }
      if (!Array.isArray(parsed.testCases) || parsed.testCases.length === 0) {
        console.error(`  ❌ Invalid testCases`);
        continue;
      }

      return parsed;
    } catch (err) {
      console.error(`  ❌ Error: ${err instanceof Error ? err.message : err}`);
      if (attempt < retries) await sleep(1000);
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Try to fix truncated JSON by closing open brackets/strings */
function repairJSON(s: string): string {
  // If it already parses, return as-is
  try { JSON.parse(s); return s; } catch {}

  // Strip trailing incomplete key-value (e.g. `"key": "unterminated...`)
  // Find the last complete value (ending with `}`, `]`, `"`, number, true, false, null)
  let trimmed = s;

  // Close any unterminated string
  let inString = false;
  let escaped = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') inString = !inString;
  }
  if (inString) trimmed += '"';

  // Remove trailing comma after last complete element
  trimmed = trimmed.replace(/,\s*$/, "");

  // Count open brackets and close them
  const stack: string[] = [];
  inString = false;
  escaped = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escaped) { escaped = false; continue; }
    if (ch === "\\") { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  // Close all open brackets in reverse order
  while (stack.length) trimmed += stack.pop();

  return trimmed;
}

// ─── Batch Runner ────────────────────────────────────────

async function main() {
  console.log("📦 Batch Coding Data Generator");
  console.log(`   Model: ${MODEL}`);
  console.log(`   Concurrency: ${CONCURRENCY}`);
  console.log(`   Input: ${INPUT_FILE}`);
  console.log(`   Output: ${OUTPUT_FILE}\n`);

  // Load problems
  const lines = fs.readFileSync(INPUT_FILE, "utf-8").split("\n").filter(Boolean);
  let problems: Problem[] = lines.map((l) => JSON.parse(l));

  // Skip existing
  const existingIds = loadExistingIds();
  if (SKIP_EXISTING && existingIds.size > 0) {
    problems = problems.filter((p) => !existingIds.has(p.leetcodeId));
    console.log(`⏭️  Skipping ${existingIds.size} already generated, ${problems.length} remaining\n`);
  }

  // Apply limit
  if (LIMIT < Infinity) {
    problems = problems.slice(0, LIMIT);
    console.log(`📌 Limited to ${problems.length} problems\n`);
  }

  if (problems.length === 0) {
    console.log("✅ Nothing to generate!");
    return;
  }

  // Open output file for appending
  const outStream = fs.createWriteStream(OUTPUT_FILE, { flags: "a" });

  let done = 0;
  let failed = 0;
  const total = problems.length;
  const startTime = Date.now();

  // Process in batches of CONCURRENCY
  for (let i = 0; i < problems.length; i += CONCURRENCY) {
    const batch = problems.slice(i, i + CONCURRENCY);

    const results = await Promise.all(
      batch.map(async (problem) => {
        const codingData = await generateCodingData(problem);
        if (codingData) {
          const row: OutputRow = {
            leetcodeId: problem.leetcodeId,
            title: problem.title,
            codingData,
          };
          outStream.write(JSON.stringify(row) + "\n");
          done++;
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const rate = (done / ((Date.now() - startTime) / 1000)).toFixed(1);
          console.log(`✅ [${done + failed}/${total}] #${problem.leetcodeId} ${problem.title} (${elapsed}s, ${rate}/s)`);
        } else {
          failed++;
          console.log(`❌ [${done + failed}/${total}] #${problem.leetcodeId} ${problem.title} — FAILED`);
        }
      }),
    );

    // Small delay between batches to avoid rate limits
    if (i + CONCURRENCY < problems.length) {
      await sleep(200);
    }
  }

  outStream.end();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🏁 Done in ${elapsed}s — ✅ ${done} generated, ❌ ${failed} failed`);
  console.log(`📄 Output: ${OUTPUT_FILE}`);
}

main().catch(console.error);
