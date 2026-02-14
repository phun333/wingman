#!/usr/bin/env bun

/**
 * LeetCode Dataset Seed Script
 *
 * Bu script LeetCode problemlerini Convex veritabanına yükler.
 *
 * Kullanım:
 *   bun run seed:leetcode
 *
 * Not: Dataset dosyaları zaten repo'da mevcut:
 *   - dataset/leetcode.csv (ham veri)
 *   - dataset/leetcode-problems.jsonl (Convex formatı)
 */

import { execSync } from "child_process";

console.log("🚀 LeetCode Dataset Yükleniyor...\n");

try {
  // 1. JSONL dosyasının varlığını kontrol et
  const jsonlExists = await Bun.file("dataset/leetcode-problems.jsonl").exists();

  if (!jsonlExists) {
    console.log("📄 JSONL dosyası bulunamadı, CSV'den dönüştürülüyor...");
    execSync("bun run dataset/convert-leetcode-csv.ts", { stdio: "inherit" });
  }

  // 2. Convex'e import et
  console.log("\n📤 Convex veritabanına import ediliyor...");
  execSync("bunx convex import --table leetcodeProblems dataset/leetcode-problems.jsonl", {
    stdio: "inherit"
  });

  // 3. Başarı mesajı
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ LeetCode Dataset Başarıyla Yüklendi!

📊 İstatistikler:
   • 1,825 problem
   • Easy: 463
   • Medium: 944
   • Hard: 418
   • 100+ şirket verisi (Amazon, Google, Facebook vb.)

🔍 Kontrol etmek için:
   bunx convex run leetcodeProblems:list "{}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

} catch (error) {
  console.error("\n❌ Hata oluştu:", error);
  console.error("\n💡 Convex deployment'ınızın çalıştığından emin olun:");
  console.error("   bunx convex dev");
  process.exit(1);
}