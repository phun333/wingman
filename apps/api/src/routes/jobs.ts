import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { authMiddleware } from "../middleware/auth";
import { ENV } from "@ffh/env";
import Hyperbrowser from "@hyperbrowser/sdk";

type AuthEnv = {
  Variables: { userId: string; userName: string; userEmail: string };
};

export const jobRoutes = new Hono<AuthEnv>();

jobRoutes.use("*", authMiddleware);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /jobs/parse — Parse job posting from URL or text
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

jobRoutes.post(
  "/parse",
  describeRoute({
    tags: ["Jobs"],
    summary: "Parse a job posting from URL or raw text",
    responses: {
      201: { description: "Job posting parsed and saved" },
      400: { description: "Invalid input" },
      401: { description: "Unauthorized" },
    },
  }),
  validator(
    "json",
    z.object({
      url: z.string().optional(),
      rawText: z.string().optional(),
    }).refine((d) => d.url || d.rawText, {
      message: "Either url or rawText is required",
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const { url, rawText } = c.req.valid("json");

    let content = rawText ?? "";

    // Scrape strategies in order: Jina Reader → Hyperbrowser → Basic Fetch
    const scrapers = [
      { name: "Jina Reader", fn: () => scrapeWithJinaReader(url!) },
      { name: "Hyperbrowser", fn: () => scrapeWithHyperbrowser(url!) },
      { name: "Basic Fetch", fn: () => scrapeWithBasicFetch(url!) },
    ];

    if (url && !rawText) {
      for (const scraper of scrapers) {
        try {
          const scraped = await scraper.fn();
          console.log(`[DEBUG] ${scraper.name} scraped content length:`, scraped.length);
          console.log(`[DEBUG] ${scraper.name} first 2000 chars:`, scraped.slice(0, 2000));

          // Skip junk content (Cloudflare block pages, error pages, etc.)
          if (scraped.length < 50) {
            console.warn(`[DEBUG] ${scraper.name}: content too short, trying next...`);
            continue;
          }

          // Quick LLM analysis to see if content is usable
          const testParsed = await analyzeJobPosting(scraped);
          if (testParsed.title) {
            console.log(`[DEBUG] ${scraper.name}: got valid title "${testParsed.title}", using this content`);
            content = scraped;
            break;
          }

          console.warn(`[DEBUG] ${scraper.name}: LLM returned no title, trying next scraper...`);
          // Keep this content as fallback if nothing better comes
          if (!content || scraped.length > content.length) {
            content = scraped;
          }
        } catch (err) {
          console.warn(`[DEBUG] ${scraper.name} failed:`, err);
        }
      }

      if (!content || content.length < 50) {
        console.error("[DEBUG] All scrapers failed. Content length:", content.length);
        return c.json(
          { error: "URL'den içerik alınamadı. Lütfen ilan metnini manuel yapıştırın." },
          400,
        );
      }
    }

    if (!content || content.length < 50) {
      return c.json({ error: "İlan içeriği çok kısa veya okunamadı" }, 400);
    }

    console.log("[DEBUG] Final content length sent to LLM:", content.length);

    // LLM ile analiz (loop'ta zaten denenmiş olabilir, ama rawText için de gerekli)
    try {
      const parsed = await analyzeJobPosting(content);

      const job = await convex.mutation(api.jobPostings.create, {
        userId: userId as any,
        url: url ?? "",
        title: parsed.title || "Bilinmeyen Pozisyon",
        company: parsed.company,
        requirements: parsed.requirements,
        skills: parsed.skills,
        level: parsed.level,
        rawContent: content.slice(0, 10_000),
      });

      return c.json(job, 201);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Job parsing failed";
      return c.json({ error: message }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /jobs — List user's saved job postings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

jobRoutes.get(
  "/",
  describeRoute({
    tags: ["Jobs"],
    summary: "List user's parsed job postings",
    responses: {
      200: { description: "List of job postings" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const jobs = await convex.query(api.jobPostings.listByUser, {
      userId: userId as any,
    });
    return c.json(jobs);
  },
);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /jobs/paths — List user's interview paths
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

jobRoutes.get(
  "/paths",
  describeRoute({
    tags: ["Jobs"],
    summary: "List user's job-specific interview paths",
    responses: {
      200: { description: "List of interview paths" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const paths = await convex.query(api.jobInterviewPaths.listByUser, {
      userId: userId as any,
    });
    return c.json(paths);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /jobs/paths/:id — Get specific path
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

jobRoutes.get(
  "/paths/:id",
  describeRoute({
    tags: ["Jobs"],
    summary: "Get specific interview path",
    responses: {
      200: { description: "Interview path details" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      const path = await convex.query(api.jobInterviewPaths.getById, {
        id: id as any,
      });
      if (!path) {
        return c.json({ error: "Path not found" }, 404);
      }
      return c.json(path);
    } catch {
      return c.json({ error: "Path not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PUT /jobs/paths/:id/progress — Update question progress
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

jobRoutes.put(
  "/paths/:id/progress",
  describeRoute({
    tags: ["Jobs"],
    summary: "Update question completion progress",
    responses: {
      200: { description: "Progress updated" },
      400: { description: "Invalid request" },
    },
  }),
  validator(
    "json",
    z.object({
      categoryIndex: z.number(),
      questionIndex: z.number(),
      completed: z.boolean(),
      interviewId: z.string().optional(),
      score: z.number().optional(),
    }),
  ),
  async (c) => {
    const pathId = c.req.param("id");
    const body = c.req.valid("json");

    try {
      const updated = await convex.mutation(api.jobInterviewPaths.updateQuestionProgress, {
        pathId: pathId as any,
        ...body,
      });
      return c.json(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      return c.json({ error: message }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /jobs/:id — Get by ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

jobRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Jobs"],
    summary: "Get job posting by ID",
    responses: {
      200: { description: "Job posting found" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      const job = await convex.query(api.jobPostings.getById, {
        id: id as any,
      });
      return c.json(job);
    } catch {
      return c.json({ error: "Job posting not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DELETE /jobs/:id
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
jobRoutes.delete(
  "/:id",
  describeRoute({
    tags: ["Jobs"],
    summary: "Delete a job posting",
    responses: {
      200: { description: "Deleted" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      await convex.mutation(api.jobPostings.remove, { id: id as any });
      return c.json({ deleted: true });
    } catch {
      return c.json({ error: "Job posting not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  URL Scraping — Jina Reader (primary) + Basic Fetch (fallback)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Scrape URL using Jina Reader API (free, no API key needed).
 * Converts any web page to clean markdown — handles JS-rendered pages,
 * LinkedIn, Amazon, etc.
 * Docs: https://r.jina.ai
 */
async function scrapeWithJinaReader(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  const res = await fetch(jinaUrl, {
    method: "GET",
    headers: {
      Accept: "text/markdown",
      "X-Return-Format": "markdown",
      "X-No-Cache": "true",
    },
    signal: AbortSignal.timeout(30_000), // Jina renders JS, may take longer
  });

  if (!res.ok) {
    throw new Error(`Jina Reader failed: ${res.status}`);
  }

  const markdown = await res.text();

  if (!markdown || markdown.length < 50) {
    throw new Error("Jina Reader returned empty/short content");
  }

  // Trim to LLM context limit
  return markdown.slice(0, 15_000);
}

/**
 * Scrape URL using Patchright (patched Playwright) — bypasses Cloudflare & anti-bot.
 * Launches a real headless Chromium, waits for page to load, extracts text.
 */
/**
 * Scrape URL using Hyperbrowser — cloud browser with stealth & anti-bot bypass.
 * No local browser needed, handles Cloudflare/JS-rendered pages.
 */
async function scrapeWithHyperbrowser(url: string): Promise<string> {
  const apiKey = ENV.HYPERBROWSER_API_KEY;
  if (!apiKey) throw new Error("HYPERBROWSER_API_KEY not set");

  console.log("[DEBUG] Hyperbrowser: starting scrape for", url);
  const client = new Hyperbrowser({ apiKey });

  const result = await client.scrape.startAndWait({
    url,
    sessionOptions: {
      useStealth: true,
      acceptCookies: true,
    },
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true,
      waitFor: 3000,
    },
  });

  const content = result.data?.markdown ?? "";
  console.log("[DEBUG] Hyperbrowser: scraped content length:", content.length);

  if (!content || content.length < 50) {
    throw new Error("Hyperbrowser: page content too short");
  }

  return content.slice(0, 15_000);
}

/**
 * Fallback: basic fetch + HTML tag stripping.
 */
async function scrapeWithBasicFetch(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; WingmanBot/1.0)",
      Accept: "text/html,application/xhtml+xml,*/*",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`URL fetch failed: ${res.status}`);
  }

  const html = await res.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15_000);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LLM — Analyze job posting content
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ParsedJob {
  title: string;
  company?: string;
  requirements: string[];
  skills: string[];
  level?: string;
}

async function analyzeJobPosting(content: string): Promise<ParsedJob> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": ENV.SITE_URL,
        "X-Title": "Wingman AI Interview",
      },
      body: JSON.stringify({
        model: ENV.OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: `Sen bir iş ilanı analiz asistanısın. Sana verilen iş ilanı metnini analiz edip aşağıdaki JSON formatında döndür.
Yanıtını SADECE geçerli JSON olarak ver, başka hiçbir şey ekleme. Markdown code block KULLANMA.

{
  "title": "Pozisyon başlığı",
  "company": "Şirket adı (bulunamazsa null)",
  "requirements": ["Gereksinim 1", "Gereksinim 2", ...],
  "skills": ["Yetenek 1", "Yetenek 2", ...],
  "level": "junior | mid | senior | lead | staff (tahmin et, bulunamazsa null)"
}`,
          },
          {
            role: "user",
            content: `İş ilanı metni:\n\n${content}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`LLM failed: ${response.status}`);
  }

  const result = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const raw = result.choices?.[0]?.message?.content;
  console.log("[DEBUG] LLM raw response:", raw);
  if (!raw) throw new Error("LLM returned empty response");

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned) as ParsedJob;
  console.log("[DEBUG] Parsed job result:", JSON.stringify(parsed, null, 2));

  // Ensure defaults (title intentionally kept as empty string so caller can detect failure)
  const finalResult = {
    title: parsed.title || "",
    company: parsed.company || undefined,
    requirements: Array.isArray(parsed.requirements)
      ? parsed.requirements
      : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    level: parsed.level || undefined,
  };
  console.log("[DEBUG] Final result:", JSON.stringify(finalResult, null, 2));

  return finalResult;
}
