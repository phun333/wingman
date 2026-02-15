import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdir } from "fs/promises";
import { join } from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = join(import.meta.dir, "../screenshots");
const LOGIN_EMAIL = "a@a.com";
const LOGIN_PASSWORD = "123123123";

// ── helpers ──────────────────────────────────────────────────────────────────

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

/**
 * For pages using AppLayout (sidebar + main with overflow-y-auto),
 * we need to:
 * 1. Find the scrollable <main> element
 * 2. Scroll it step-by-step to trigger animations
 * 3. Temporarily make it full-height so fullPage captures everything
 */
async function prepareAppLayoutForFullScreenshot(page: Page) {
  // First scroll the main area step by step to trigger all lazy content
  await page.evaluate(async () => {
    const main = document.querySelector("main");
    if (!main) return;

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const step = Math.floor(main.clientHeight * 0.7);
    let prev = -1;

    while (main.scrollHeight !== prev) {
      prev = main.scrollHeight;
      for (let y = 0; y < prev; y += step) {
        main.scrollTo(0, y);
        await delay(200);
      }
      main.scrollTo(0, main.scrollHeight);
      await delay(500);
    }
    await delay(1000);
    main.scrollTo(0, 0);
    await delay(300);

    // Now expand the layout so everything is visible at once
    // Remove overflow constraints
    const wrapper = main.parentElement; // the flex container
    const root = wrapper?.parentElement; // h-screen overflow-hidden

    if (root) {
      root.style.height = "auto";
      root.style.overflow = "visible";
    }
    if (wrapper) {
      wrapper.style.height = "auto";
      wrapper.style.overflow = "visible";
    }
    main.style.overflow = "visible";
    main.style.height = "auto";

    // Also fix sidebar to not stretch full new height
    const sidebar = document.querySelector("aside, [class*='sidebar'], nav")?.closest("[class*='complementary']") as HTMLElement | null;
    const sidebarParent = sidebar?.parentElement as HTMLElement | null;
    if (sidebarParent) {
      sidebarParent.style.position = "sticky";
      sidebarParent.style.top = "0";
      sidebarParent.style.height = "100vh";
      sidebarParent.style.overflow = "hidden";
    }

    // Fix sticky/fixed elements
    document.querySelectorAll("*").forEach((el) => {
      const style = getComputedStyle(el);
      if (style.position === "fixed") {
        (el as HTMLElement).style.position = "absolute";
      }
    });
  });
}

/** For public pages (landing etc.) - scroll body to trigger animations, then fix sticky */
async function preparePublicPageForFullScreenshot(page: Page) {
  await page.evaluate(async () => {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const step = Math.floor(window.innerHeight * 0.7);
    let prev = -1;

    while (document.documentElement.scrollHeight !== prev) {
      prev = document.documentElement.scrollHeight;
      for (let y = 0; y < prev; y += step) {
        window.scrollTo(0, y);
        await delay(200);
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await delay(500);
    }
    await delay(1500);
    window.scrollTo(0, 0);
    await delay(300);

    // Fix fixed/sticky elements
    document.querySelectorAll("*").forEach((el) => {
      const style = getComputedStyle(el);
      if (style.position === "fixed" || style.position === "sticky") {
        (el as HTMLElement).style.position = "absolute";
      }
    });
  });
}

/** Full page screenshot for app-layout pages (dashboard, settings, etc.) */
async function appLayoutScreenshot(page: Page, filePath: string) {
  await prepareAppLayoutForFullScreenshot(page);
  await page.screenshot({ path: filePath, type: "png", fullPage: true });
  console.log(`  ✅ ${filePath.replace(OUT_DIR + "/", "")}`);
}

/** Full page screenshot for public pages */
async function publicPageScreenshot(page: Page, filePath: string) {
  await preparePublicPageForFullScreenshot(page);
  await page.screenshot({ path: filePath, type: "png", fullPage: true });
  console.log(`  ✅ ${filePath.replace(OUT_DIR + "/", "")}`);
}

/** Viewport-only screenshot (for modals, dialogs, overlays) */
async function viewportScreenshot(page: Page, filePath: string) {
  await page.screenshot({ path: filePath, type: "png" });
  console.log(`  ✅ ${filePath.replace(OUT_DIR + "/", "")}`);
}

// ── page screenshot functions ────────────────────────────────────────────────

async function screenshotLanding(context: BrowserContext) {
  console.log("\n📸 01 — Landing Page");
  const dir = join(OUT_DIR, "01-landing");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await publicPageScreenshot(page, join(dir, "full-page.png"));
  await page.close();
}

async function screenshotLogin(context: BrowserContext) {
  console.log("\n📸 02 — Login Page");
  const dir = join(OUT_DIR, "02-login");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await publicPageScreenshot(page, join(dir, "full-page.png"));
  await page.close();
}

async function screenshotRegister(context: BrowserContext) {
  console.log("\n📸 03 — Register Page");
  const dir = join(OUT_DIR, "03-register");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/register`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await publicPageScreenshot(page, join(dir, "full-page.png"));
  await page.close();
}

/** Login and return authenticated context */
async function login(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.getByRole("textbox", { name: "E-posta" }).fill(LOGIN_EMAIL);
  await page.getByRole("textbox", { name: "Şifre" }).fill(LOGIN_PASSWORD);
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await page.waitForURL("**/dashboard**", { timeout: 10000 });
  await page.waitForTimeout(2000);
  console.log("🔐 Logged in successfully");
  await page.close();
  return context;
}

async function screenshotDashboard(context: BrowserContext) {
  console.log("\n📸 04 — Dashboard");
  const dir = join(OUT_DIR, "04-dashboard");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Close onboarding dialog if present
  const closeBtn = page.getByRole("button", { name: "Close" });
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }

  await appLayoutScreenshot(page, join(dir, "full-page.png"));

  // Command palette (⌘K) — need fresh page state
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const closeBtn2 = page.getByRole("button", { name: "Close" });
  if (await closeBtn2.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeBtn2.click();
    await page.waitForTimeout(300);
  }
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(600);
  await viewportScreenshot(page, join(dir, "command-palette.png"));

  await page.close();
}

async function screenshotNewInterview(context: BrowserContext) {
  console.log("\n📸 05 — New Interview");
  const dir = join(OUT_DIR, "05-new-interview");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dashboard/interview/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await appLayoutScreenshot(page, join(dir, "full-page.png"));

  // Click different interview types — reload each time for clean state
  const types = ["System Design", "Phone Screen", "Practice"];
  for (const t of types) {
    await page.goto(`${BASE_URL}/dashboard/interview/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const btn = page.getByRole("button", { name: t }).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(400);
      const slug = t.toLowerCase().replace(/\s+/g, "-");
      await viewportScreenshot(page, join(dir, `type-${slug}.png`));
    }
  }

  // Question picker
  await page.goto(`${BASE_URL}/dashboard/interview/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const questionBtn = page.getByRole("button", { name: /soru seç|rastgele/i });
  if (await questionBtn.isVisible().catch(() => false)) {
    await questionBtn.click();
    await page.waitForTimeout(1000);
    await viewportScreenshot(page, join(dir, "question-picker.png"));
  }

  await page.close();
}

async function screenshotQuestions(context: BrowserContext) {
  console.log("\n📸 06 — Questions");
  const dir = join(OUT_DIR, "06-questions");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dashboard/questions`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await appLayoutScreenshot(page, join(dir, "full-page.png"));

  // Şirketler tab
  await page.goto(`${BASE_URL}/dashboard/questions`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const companiesTab = page.getByRole("button", { name: "Şirketler" });
  if (await companiesTab.isVisible().catch(() => false)) {
    await companiesTab.click();
    await page.waitForTimeout(1000);
    await viewportScreenshot(page, join(dir, "companies-tab.png"));
  }

  // Konular tab
  const topicsTab = page.getByRole("button", { name: "Konular" });
  if (await topicsTab.isVisible().catch(() => false)) {
    await topicsTab.click();
    await page.waitForTimeout(1000);
    await viewportScreenshot(page, join(dir, "topics-tab.png"));
  }

  // Filter open
  await page.getByRole("button", { name: "Sorular" }).first().click();
  await page.waitForTimeout(500);
  const filterBtn = page.getByRole("button", { name: "Filtre" });
  if (await filterBtn.isVisible().catch(() => false)) {
    await filterBtn.click();
    await page.waitForTimeout(600);
    await viewportScreenshot(page, join(dir, "filter-open.png"));
  }

  await page.close();
}

async function screenshotHistory(context: BrowserContext) {
  console.log("\n📸 07 — History");
  const dir = join(OUT_DIR, "07-history");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dashboard/history`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await appLayoutScreenshot(page, join(dir, "full-page.png"));
  await page.close();
}

async function screenshotProgress(context: BrowserContext) {
  console.log("\n📸 08 — Progress");
  const dir = join(OUT_DIR, "08-progress");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dashboard/progress`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await appLayoutScreenshot(page, join(dir, "full-page.png"));

  // Kaydedilen İlanlar tab
  await page.goto(`${BASE_URL}/dashboard/progress`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const savedTab = page.getByRole("button", { name: /Kaydedilen/i });
  if (await savedTab.isVisible().catch(() => false)) {
    await savedTab.click();
    await page.waitForTimeout(1000);
    await viewportScreenshot(page, join(dir, "saved-jobs-tab.png"));
  }

  await page.close();
}

async function screenshotExplore(context: BrowserContext) {
  console.log("\n📸 09 — Explore");
  const dir = join(OUT_DIR, "09-explore");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dashboard/explore`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await appLayoutScreenshot(page, join(dir, "full-page.png"));

  // Filter
  await page.goto(`${BASE_URL}/dashboard/explore`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const filterBtn = page.getByRole("button", { name: "Filtre" });
  if (await filterBtn.isVisible().catch(() => false)) {
    await filterBtn.click();
    await page.waitForTimeout(600);
    await viewportScreenshot(page, join(dir, "filter-open.png"));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // Job detail
  const detayBtn = page.getByRole("button", { name: "Detay" }).first();
  if (await detayBtn.isVisible().catch(() => false)) {
    await detayBtn.click();
    await page.waitForTimeout(800);
    await viewportScreenshot(page, join(dir, "job-detail.png"));
  }

  await page.close();
}

async function screenshotJobs(context: BrowserContext) {
  console.log("\n📸 10 — Jobs");
  const dir = join(OUT_DIR, "10-jobs");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dashboard/jobs`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await appLayoutScreenshot(page, join(dir, "full-page.png"));

  // Expand job details
  await page.goto(`${BASE_URL}/dashboard/jobs`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const detailBtn = page.getByRole("button", { name: "Detaylar" }).first();
  if (await detailBtn.isVisible().catch(() => false)) {
    await detailBtn.click();
    await page.waitForTimeout(800);
    await appLayoutScreenshot(page, join(dir, "job-expanded.png"));
  }

  await page.close();
}

async function screenshotSettings(context: BrowserContext) {
  console.log("\n📸 11 — Settings");
  const dir = join(OUT_DIR, "11-settings");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/dashboard/settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await appLayoutScreenshot(page, join(dir, "full-page.png"));
  await page.close();
}

async function screenshotDocs(context: BrowserContext) {
  console.log("\n📸 12 — Docs");
  const dir = join(OUT_DIR, "12-docs");
  await ensureDir(dir);
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/docs`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await publicPageScreenshot(page, join(dir, "full-page.png"));

  const subpages = [
    { path: "/docs/mulakat-turleri", name: "mulakat-turleri" },
    { path: "/docs/sesli-mulakat", name: "sesli-mulakat" },
    { path: "/docs/kod-editoru", name: "kod-editoru" },
    { path: "/docs/soru-bankasi", name: "soru-bankasi" },
  ];
  for (const sub of subpages) {
    await page.goto(`${BASE_URL}${sub.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await publicPageScreenshot(page, join(dir, `${sub.name}.png`));
  }

  await page.close();
}

async function screenshotReport(context: BrowserContext) {
  console.log("\n📸 13 — Report");
  const dir = join(OUT_DIR, "13-report");
  await ensureDir(dir);
  const page = await context.newPage();

  // Go to history to find a "Değerlendirildi" report link
  await page.goto(`${BASE_URL}/dashboard/history`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // Find the link that contains "Değerlendirildi" text (the evaluated interview)
  const evaluatedLink = page.locator('a:has-text("Değerlendirildi")').first();
  let href: string | null = null;

  if (await evaluatedLink.isVisible().catch(() => false)) {
    href = await evaluatedLink.getAttribute("href");
  }

  // Fallback: just pick first report link
  if (!href) {
    const firstLink = page.locator('a[href*="/report"]').first();
    if (await firstLink.isVisible().catch(() => false)) {
      href = await firstLink.getAttribute("href");
    }
  }

  if (href) {
    await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    // Check if report is actually loaded (has score)
    const hasScore = await page.locator("text=/\\d+.*\\/.*100/").isVisible().catch(() => false);

    if (hasScore) {
      // Report page uses its own layout, not AppLayout — scroll body
      await publicPageScreenshot(page, join(dir, "full-page.png"));

      // Reload and expand transcript
      await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
      const transcriptBtn = page.getByRole("button", { name: /Transkript/i });
      if (await transcriptBtn.isVisible().catch(() => false)) {
        await transcriptBtn.click();
        await page.waitForTimeout(800);
        await publicPageScreenshot(page, join(dir, "transcript-open.png"));
      }
    } else {
      // Maybe it's a "rapor oluştur" page — screenshot anyway
      await viewportScreenshot(page, join(dir, "no-report.png"));
    }
  }

  await page.close();
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🚀 Starting screenshot capture...\n");

  const browser = await chromium.launch({ headless: true });

  // ── Public pages (no auth) ──
  const publicCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  console.log("── Public Pages ──");
  await Promise.all([
    screenshotLanding(publicCtx),
    screenshotLogin(publicCtx),
    screenshotRegister(publicCtx),
  ]);
  await publicCtx.close();

  // ── Authenticated pages ──
  console.log("\n── Authenticated Pages ──");
  const authCtx = await login(browser);

  // Batch 1
  await Promise.all([
    screenshotDashboard(authCtx),
    screenshotHistory(authCtx),
    screenshotDocs(authCtx),
  ]);

  // Batch 2
  await Promise.all([
    screenshotNewInterview(authCtx),
    screenshotQuestions(authCtx),
    screenshotProgress(authCtx),
  ]);

  // Batch 3
  await Promise.all([
    screenshotExplore(authCtx),
    screenshotJobs(authCtx),
    screenshotSettings(authCtx),
  ]);

  // Batch 4
  await screenshotReport(authCtx);

  await authCtx.close();
  await browser.close();

  console.log("\n🎉 All screenshots captured!");

  const { execSync } = await import("child_process");
  console.log("\n📁 Output:\n");
  console.log(execSync(`find ${OUT_DIR} -name '*.png' -exec ls -lh {} \\; | sort`).toString());
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
