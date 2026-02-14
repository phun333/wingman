#!/usr/bin/env bun

/**
 * Jobs Dataset Seed Script
 *
 * hiring.cafe'den scrape edilen iş ilanlarını Convex veritabanına yükler.
 *
 * Kullanım:
 *   bun run seed:jobs
 *
 * Dataset:
 *   - dataset/jobs.jsonl (1,826 iş ilanı)
 *
 * Not: Mevcut `jobs` tablosundaki veriler REPLACE edilir.
 *      Eğer append istiyorsanız `--append` flag'i ekleyin:
 *        bunx convex import --table jobs dataset/jobs.jsonl --append
 */

import { execSync } from "child_process";

console.log("🚀 Jobs Dataset Yükleniyor...\n");

try {
  // 1. JSONL dosyasının varlığını kontrol et
  const jsonlFile = Bun.file("dataset/jobs.jsonl");
  const exists = await jsonlFile.exists();

  if (!exists) {
    console.error("❌ dataset/jobs.jsonl dosyası bulunamadı!");
    console.error("   Scraper çıktısını dataset/ klasörüne koyduğunuzdan emin olun.");
    process.exit(1);
  }

  // 2. Satır sayısını hesapla
  const text = await jsonlFile.text();
  const lineCount = text.trim().split("\n").length;
  console.log(`📄 ${lineCount.toLocaleString("tr-TR")} iş ilanı bulundu.\n`);

  // 3. Convex'e import et
  console.log("📤 Convex veritabanına import ediliyor...");

  const isAppend = process.argv.includes("--append");
  const importCmd = isAppend
    ? "bunx convex import --table jobs dataset/jobs.jsonl --append"
    : "bunx convex import --table jobs dataset/jobs.jsonl";

  if (isAppend) {
    console.log("   (--append modu: mevcut verilere ekleniyor)\n");
  } else {
    console.log("   (replace modu: mevcut tablo değiştirilecek)\n");
  }

  execSync(importCmd, { stdio: "inherit" });

  // 4. Başarı mesajı
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Jobs Dataset Başarıyla Yüklendi!

📊 İstatistikler:
   • ${lineCount.toLocaleString("tr-TR")} iş ilanı
   • Kaynak: hiring.cafe scraper

🔍 Kontrol etmek için:
   Convex Dashboard → jobs tablosu
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
} catch (error) {
  console.error("\n❌ Hata oluştu:", error);
  console.error("\n💡 Olası çözümler:");
  console.error("   1. Convex deployment'ınızın çalıştığından emin olun: bunx convex dev");
  console.error("   2. dataset/jobs.jsonl dosyasının mevcut olduğunu kontrol edin");
  console.error("   3. Tablo zaten doluysa ve yine de yüklemek istiyorsanız: bun run seed:jobs -- --append");
  process.exit(1);
}
