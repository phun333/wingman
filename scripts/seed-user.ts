#!/usr/bin/env bun

/**
 * Seed User Script — Demo kullanıcı oluşturur
 *
 * Kullanım:
 *   bun run seed:user
 *
 * Ne yapar:
 *   1. Convex'te user + tüm ilişkili verileri oluşturur (interviews, results, resume, memory, vb.)
 *   2. better-auth üzerinden email/password ile register eder
 *   3. Convex user kaydını auth ID ile bağlar
 *
 * Sonuç:
 *   📧 Email: mehmet@selvet.com
 *   🔑 Şifre: mehmet123
 */

import { execSync } from "child_process";

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const CONVEX_HTTP_URL = process.env.CONVEX_HTTP_URL || "";

// Convex HTTP endpoint'ini belirle (local dev → 3211, production → .convex.site)
function getAuthBaseUrl(): string {
  // 1. Explicit CONVEX_HTTP_URL varsa onu kullan
  if (CONVEX_HTTP_URL) return CONVEX_HTTP_URL;

  // 2. Local dev: proxy üzerinden (vite 3000 → convex 3211)
  return SITE_URL;
}

const AUTH_BASE = getAuthBaseUrl();

console.log("🌱 Mehmet Ali Selvet seed başlıyor...\n");

// ─── Step 1: Convex seed mutation çalıştır ───────────────

console.log("📦 Step 1/3 — Convex verileri oluşturuluyor...");

let seedOutput: string;
try {
  seedOutput = execSync("bunx convex run seedUser:seedMehmet", {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
} catch (err: any) {
  // Convex run çıktısını stderr'den de al
  const stderr = err.stderr?.toString() ?? "";
  const stdout = err.stdout?.toString() ?? "";
  const combined = stdout + stderr;

  // "skipped" kontrolü
  if (combined.includes('"skipped"') || combined.includes("zaten mevcut")) {
    console.log("  ⚠️  Mehmet zaten Convex'te mevcut, yeni veri eklenmedi.\n");
    seedOutput = combined;
  } else {
    console.error("❌ Convex seed başarısız:");
    console.error(combined);
    process.exit(1);
  }
}

// userId'yi parse et
const userIdMatch = seedOutput.match(/"userId":\s*"([^"]+)"/);
if (!userIdMatch) {
  // Zaten varsa tekrar çekelim
  console.log("  → userId parse edilemedi, Convex'ten sorguluyoruz...");
}

console.log("  ✅ Convex verileri hazır.\n");

// ─── Step 2: better-auth ile register ────────────────────

console.log("🔐 Step 2/3 — Auth hesabı oluşturuluyor...");
console.log(`  → Auth URL: ${AUTH_BASE}/api/auth/sign-up/email`);

let authUserId: string | null = null;

try {
  const res = await fetch(`${AUTH_BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "mehmet@selvet.com",
      password: "mehmet123",
      name: "Mehmet Ali Selvet",
    }),
  });

  if (res.ok) {
    const data = (await res.json()) as { user?: { id: string } };
    authUserId = data.user?.id ?? null;
    console.log(`  ✅ Auth hesabı oluşturuldu (authId: ${authUserId})\n`);
  } else {
    const body = await res.text();
    // Kullanıcı zaten kayıtlıysa hata dön, ama sorun değil
    if (res.status === 422 || body.includes("already") || body.includes("exists") || body.includes("User already exists")) {
      console.log("  ⚠️  Auth hesabı zaten mevcut, atlanıyor.\n");

      // Mevcut kullanıcıyla sign-in deneyelim, authId'yi alalım
      const signInRes = await fetch(`${AUTH_BASE}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "mehmet@selvet.com",
          password: "mehmet123",
        }),
      });

      if (signInRes.ok) {
        const signInData = (await signInRes.json()) as { user?: { id: string } };
        authUserId = signInData.user?.id ?? null;
        console.log(`  → Mevcut auth hesabından authId alındı: ${authUserId}\n`);
      }
    } else {
      console.error(`  ❌ Auth register başarısız (${res.status}): ${body}`);
      console.error("  → Dev server'ın çalıştığından emin ol (bun run dev)");
      process.exit(1);
    }
  }
} catch (err: any) {
  console.error(`  ❌ Auth endpoint'e bağlanılamadı: ${err.message}`);
  console.error(`  → ${AUTH_BASE} adresinde dev server çalışıyor mu?`);
  console.error("  → 'bun run dev' ile sunucuyu başlat ve tekrar dene.");
  process.exit(1);
}

// ─── Step 3: Convex user'ı authId ile bağla ──────────────

if (authUserId) {
  console.log("🔗 Step 3/3 — User ↔ Auth bağlantısı kuruluyor...");

  try {
    // Convex user'ı bul
    const getUserOutput = execSync(
      `bunx convex run users:getByEmail '{"email":"mehmet@selvet.com"}'`,
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );

    const convexIdMatch = getUserOutput.match(/"_id":\s*"([^"]+)"/);
    const existingAuthIdMatch = getUserOutput.match(/"authId":\s*"([^"]+)"/);

    if (convexIdMatch) {
      const convexUserId = convexIdMatch[1];

      if (existingAuthIdMatch && existingAuthIdMatch[1] === authUserId) {
        console.log("  ⚠️  AuthId zaten bağlı, atlanıyor.\n");
      } else {
        // authId'yi güncelle
        execSync(
          `bunx convex run users:update '{"id":"${convexUserId}","authId":"${authUserId}"}'`,
          { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
        );
        console.log(`  ✅ User (${convexUserId}) ↔ Auth (${authUserId}) bağlandı.\n`);
      }
    } else {
      console.error("  ❌ Convex user bulunamadı!");
    }
  } catch (err: any) {
    console.error("  ❌ User ↔ Auth bağlantısı kurulamadı:", err.message);
  }
} else {
  console.log("⏭️  Step 3/3 — AuthId bulunamadı, bağlantı atlanıyor.\n");
  console.log("  → Kullanıcı ilk login'de otomatik bağlanacaktır.");
}

// ─── Sonuç ───────────────────────────────────────────────

console.log("═══════════════════════════════════════════════");
console.log("🎉 Seed tamamlandı!");
console.log("");
console.log("  📧 Email:  mehmet@selvet.com");
console.log("  🔑 Şifre:  mehmet123");
console.log("  👤 İsim:   Mehmet Ali Selvet");
console.log("");
console.log("  Oluşturulan veriler:");
console.log("    • 14 mülakat (13 evaluated + 1 abandoned)");
console.log("    • 13 sonuç raporu (skor grafiği + radar chart)");
console.log("    • 29 mesaj (gerçekçi konuşma geçmişi)");
console.log("    • 1 CV (detaylı Türkçe özgeçmiş)");
console.log("    • 1 CV analizi (topic proficiency, difficulty dist.)");
console.log("    • 1 iş ilanı (Google — Senior SWE)");
console.log("    • 1 mülakat yol haritası (Google hazırlık planı)");
console.log("    • 8 performans hafızası kaydı");
console.log("    • 1 kullanıcı profili (ilgi alanları, hedefler)");
console.log("    • Streak heatmap verisi (45 günlük aktivite)");
console.log("═══════════════════════════════════════════════");
