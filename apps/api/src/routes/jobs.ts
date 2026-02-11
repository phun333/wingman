import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { authMiddleware } from "../middleware/auth";
import { ENV } from "@ffh/env";

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

    // If URL provided, fetch and extract text
    if (url && !rawText) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; FreyaBot/1.0)",
            Accept: "text/html,application/xhtml+xml,*/*",
          },
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
          return c.json(
            { error: `URL fetch failed: ${res.status}` },
            400,
          );
        }

        const html = await res.text();
        // Basic HTML → text extraction
        content = html
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
          .slice(0, 15_000); // LLM context limit
      } catch (err) {
        return c.json(
          {
            error: `URL fetch error: ${err instanceof Error ? err.message : "unknown"}`,
          },
          400,
        );
      }
    }

    if (!content || content.length < 50) {
      return c.json(
        { error: "İlan içeriği çok kısa veya okunamadı" },
        400,
      );
    }

    // LLM ile analiz
    try {
      const parsed = await analyzeJobPosting(content);

      const job = await convex.mutation(api.jobPostings.create, {
        userId: userId as any,
        url: url ?? "",
        title: parsed.title,
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
        "X-Title": "Freya AI Interview",
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
  if (!raw) throw new Error("LLM returned empty response");

  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned) as ParsedJob;

  // Ensure defaults
  return {
    title: parsed.title || "Bilinmeyen Pozisyon",
    company: parsed.company || undefined,
    requirements: Array.isArray(parsed.requirements)
      ? parsed.requirements
      : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    level: parsed.level || undefined,
  };
}
