#!/usr/bin/env bun
/**
 * HTML Presentation → PDF converter (yüksek çözünürlük screenshot)
 *
 * Kullanım:
 *   bun presentation/to-pdf.ts                          # Tüm HTML dosyalarını çevir
 *   bun presentation/to-pdf.ts presentation.html        # Tek dosya
 */

import puppeteer from "puppeteer";
import { readdir } from "node:fs/promises";
import { resolve, basename, join } from "node:path";

const PRESENTATION_DIR = import.meta.dir;
const VIEWPORT = { width: 1920, height: 1080 };
const SCALE = 3; // 3x retina → 5760x3240 screenshot

async function convertToPdf(htmlFile: string) {
  const filePath = resolve(PRESENTATION_DIR, htmlFile);
  const pdfName = basename(htmlFile, ".html") + ".pdf";
  const pdfPath = join(PRESENTATION_DIR, pdfName);

  console.log(`\n📄 ${htmlFile} → ${pdfName}`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ ...VIEWPORT, deviceScaleFactor: SCALE });

  await page.goto(`file://${filePath}`, { waitUntil: "networkidle0", timeout: 30_000 });

  // Font'ların yüklenmesini bekle
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 2000));

  // Animasyonları kaldır + nav gizle + slide sayısını al
  const totalSlides = await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
      }
      .nav-dots, .slide-counter, .key-hint, .progress-track, .progress-bar {
        display: none !important;
      }
      body::before { display: none !important; }
    `;
    document.head.appendChild(style);
    return document.querySelectorAll("[data-slide]").length;
  });

  console.log(`   📊 ${totalSlides} slayt — ${SCALE}x çözünürlük (${VIEWPORT.width * SCALE}×${VIEWPORT.height * SCALE})`);

  const slideBuffers: Buffer[] = [];

  for (let i = 0; i < totalSlides; i++) {
    await page.evaluate((idx: number) => {
      document.querySelectorAll("[data-slide]").forEach((slide, j) => {
        const el = slide as HTMLElement;
        el.classList.remove("active", "exit-up");
        el.style.transition = "none";
        el.style.animation = "none";

        if (j === idx) {
          el.classList.add("active");
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.style.pointerEvents = "auto";
          el.querySelectorAll(".reveal").forEach((r) => {
            const rev = r as HTMLElement;
            rev.style.opacity = "1";
            rev.style.transform = "none";
            rev.style.animation = "none";
          });
        } else {
          el.style.opacity = "0";
          el.style.transform = "translateY(30px)";
          el.style.pointerEvents = "none";
        }
      });
    }, i);

    await new Promise((r) => setTimeout(r, 300));

    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
    });

    slideBuffers.push(Buffer.from(screenshot));
    process.stdout.write(`   ✅ Slayt ${i + 1}/${totalSlides}\r`);
  }

  console.log(`   ✅ Tüm slaytlar yakalandı            `);

  // Screenshot'ları PDF'e birleştir
  const pdfPage = await browser.newPage();

  const imagesHtml = slideBuffers
    .map((buf) => {
      const b64 = buf.toString("base64");
      return `<div class="page"><img src="data:image/png;base64,${b64}" /></div>`;
    })
    .join("\n");

  await pdfPage.setContent(
    `<!DOCTYPE html>
    <html><head><style>
      * { margin: 0; padding: 0; }
      @page { size: 1920px 1080px; margin: 0; }
      .page { width: 1920px; height: 1080px; page-break-after: always; overflow: hidden; }
      .page:last-child { page-break-after: auto; }
      .page img { width: 1920px; height: 1080px; display: block; }
    </style></head>
    <body>${imagesHtml}</body></html>`,
    { waitUntil: "load", timeout: 120_000 },
  );

  await pdfPage.pdf({
    path: pdfPath,
    width: "1920px",
    height: "1080px",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log(`   📦 PDF kaydedildi: ${pdfPath}`);
  await browser.close();
}

// ── Main ──────────────────────────────────────────

const args = process.argv.slice(2);

let htmlFiles: string[];
if (args.length > 0) {
  htmlFiles = args;
} else {
  const files = await readdir(PRESENTATION_DIR);
  htmlFiles = files.filter((f) => f.endsWith(".html"));
}

if (htmlFiles.length === 0) {
  console.log("❌ HTML dosyası bulunamadı.");
  process.exit(1);
}

console.log(`🚀 ${htmlFiles.length} dosya PDF'e çevrilecek...`);
for (const file of htmlFiles) {
  await convertToPdf(file);
}
console.log("\n✨ Tamamlandı!");
