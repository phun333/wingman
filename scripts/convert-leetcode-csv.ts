/**
 * LeetCode CSV → Convex JSONL dönüştürücü
 *
 * Kullanım:
 *   bun run scripts/convert-leetcode-csv.ts
 *
 * Çıktı:
 *   dataset/leetcode-problems.jsonl  →  `bunx convex import` ile yüklenir
 */

import { parse } from "csv-parse/sync";

const csvContent = await Bun.file("dataset/leetcode.csv").text();

const records: Record<string, string>[] = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true,
});

console.log(`📄 CSV'den ${records.length} kayıt okundu`);

const now = Date.now();
let skipped = 0;
const problems: Record<string, unknown>[] = [];

for (const row of records) {
  const rawDifficulty = row.difficulty?.trim().toLowerCase();
  if (!rawDifficulty || !["easy", "medium", "hard"].includes(rawDifficulty)) {
    skipped++;
    continue;
  }

  const id = Number.parseInt(row.id ?? "", 10);
  if (!id || !row.title?.trim() || !row.description?.trim()) {
    skipped++;
    continue;
  }

  const companies = row.companies
    ? row.companies
        .split(",")
        .map((c: string) => c.trim())
        .filter(Boolean)
    : [];

  const relatedTopics = row.related_topics
    ? row.related_topics
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

  problems.push({
    leetcodeId: id,
    title: row.title.trim(),
    description: row.description.trim(),
    difficulty: rawDifficulty as "easy" | "medium" | "hard",
    isPremium: row.is_premium === "1",
    acceptanceRate: Number.parseFloat(row.acceptance_rate ?? "0") || 0,
    frequency: Number.parseFloat(row.frequency ?? "0") || 0,
    url:
      row.url?.trim() ||
      `https://leetcode.com/problems/${row.title
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")}`,
    solutionLink: row.solution_link?.trim() || undefined,
    discussCount: Number.parseInt(row.discuss_count ?? "0", 10) || 0,
    accepted: row.accepted?.trim() || "0",
    submissions: row.submissions?.trim() || "0",
    companies,
    relatedTopics,
    likes: Number.parseInt(row.likes ?? "0", 10) || 0,
    dislikes: Number.parseInt(row.dislikes ?? "0", 10) || 0,
    rating: Number.parseInt(row.rating ?? "0", 10) || 0,
    askedByFaang: row.asked_by_faang === "1",
    similarQuestions: row.similar_questions?.trim() || undefined,
    createdAt: now,
  });
}

// Difficulty dağılımı
const counts = { easy: 0, medium: 0, hard: 0 };
for (const p of problems) {
  counts[p.difficulty as keyof typeof counts]++;
}

console.log(`✅ ${problems.length} problem dönüştürüldü (${skipped} atlandı)`);
console.log(
  `📊 Easy: ${counts.easy} | Medium: ${counts.medium} | Hard: ${counts.hard}`,
);

// Unique companies
const allCompanies = new Set<string>();
for (const p of problems) {
  for (const c of p.companies as string[]) {
    allCompanies.add(c);
  }
}
console.log(`🏢 ${allCompanies.size} unique şirket`);

// JSONL olarak yaz
const jsonlLines = problems.map((p) => JSON.stringify(p)).join("\n");
await Bun.write("dataset/leetcode-problems.jsonl", `${jsonlLines}\n`);
console.log(`💾 dataset/leetcode-problems.jsonl yazıldı`);

// İlk 3 satırı göster
console.log("\n📝 Örnekler:");
for (const p of problems.slice(0, 3)) {
  const prob = p as { leetcodeId: number; title: string; difficulty: string; companies: string[] };
  console.log(
    `  #${prob.leetcodeId} ${prob.title} [${prob.difficulty}] — ${prob.companies.length} şirket`,
  );
}

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Convex'e import etmek için:

  bunx convex import --table leetcodeProblems dataset/leetcode-problems.jsonl
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
