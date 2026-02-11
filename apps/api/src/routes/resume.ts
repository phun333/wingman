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

export const resumeRoutes = new Hono<AuthEnv>();

resumeRoutes.use("*", authMiddleware);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /resume/upload — Upload and parse resume (text-based)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resumeRoutes.post(
  "/upload",
  describeRoute({
    tags: ["Resume"],
    summary: "Upload and analyze a resume (as text or PDF base64)",
    responses: {
      201: { description: "Resume parsed and saved" },
      400: { description: "Invalid input" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const contentType = c.req.header("content-type") ?? "";

    let rawText = "";
    let fileName = "resume.txt";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await c.req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return c.json({ error: "No file provided" }, 400);
      }

      fileName = file.name;
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (file.size > maxSize) {
        return c.json({ error: "Dosya 5MB'dan büyük olamaz" }, 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determine file type
      if (
        fileName.endsWith(".pdf") ||
        file.type === "application/pdf"
      ) {
        // Basic PDF text extraction — look for text streams
        rawText = extractTextFromPDF(buffer);
      } else if (
        fileName.endsWith(".txt") ||
        file.type === "text/plain"
      ) {
        rawText = buffer.toString("utf-8");
      } else {
        // Try as plain text
        rawText = buffer.toString("utf-8");
      }
    } else {
      // JSON body with raw text
      const body = await c.req.json<{ text?: string; fileName?: string }>();
      rawText = body.text ?? "";
      fileName = body.fileName ?? "resume.txt";
    }

    if (!rawText || rawText.length < 30) {
      return c.json(
        {
          error:
            "Özgeçmiş içeriği çok kısa veya okunamadı. Düz metin olarak yapıştırmayı deneyin.",
        },
        400,
      );
    }

    // LLM ile analiz
    try {
      const parsed = await analyzeResume(rawText);

      const resume = await convex.mutation(api.resumes.create, {
        userId: userId as any,
        fileName,
        name: parsed.name,
        title: parsed.title,
        yearsOfExperience: parsed.yearsOfExperience,
        skills: parsed.skills,
        experience: parsed.experience,
        education: parsed.education,
        rawText: rawText.slice(0, 10_000),
      });

      return c.json(resume, 201);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Resume parsing failed";
      return c.json({ error: message }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /resume — List user's resumes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resumeRoutes.get(
  "/",
  describeRoute({
    tags: ["Resume"],
    summary: "List user's uploaded resumes",
    responses: {
      200: { description: "List of resumes" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const resumes = await convex.query(api.resumes.listByUser, {
      userId: userId as any,
    });
    return c.json(resumes);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /resume/:id
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resumeRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Resume"],
    summary: "Get resume by ID",
    responses: {
      200: { description: "Resume found" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      const resume = await convex.query(api.resumes.getById, {
        id: id as any,
      });
      return c.json(resume);
    } catch {
      return c.json({ error: "Resume not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DELETE /resume/:id
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

resumeRoutes.delete(
  "/:id",
  describeRoute({
    tags: ["Resume"],
    summary: "Delete a resume",
    responses: {
      200: { description: "Deleted" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      await convex.mutation(api.resumes.remove, { id: id as any });
      return c.json({ deleted: true });
    } catch {
      return c.json({ error: "Resume not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PDF → Text Extraction (basic)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function extractTextFromPDF(buffer: Buffer): string {
  // Basic text extraction from PDF — looks for text between BT/ET operators
  // and parenthesized strings. Works for simple PDFs.
  const content = buffer.toString("latin1");
  const textParts: string[] = [];

  // Method 1: Extract parenthesized strings from text streams
  const parenRegex = /\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = parenRegex.exec(content)) !== null) {
    const text = match[1]!
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "")
      .replace(/\\\\/g, "\\")
      .replace(/\\([()])/g, "$1");

    if (text.length > 1 && /[a-zA-ZğüşıöçĞÜŞİÖÇ0-9]/.test(text)) {
      textParts.push(text);
    }
  }

  // Method 2: Look for readable text sequences
  if (textParts.length < 10) {
    const readableRegex = /[a-zA-ZğüşıöçĞÜŞİÖÇ0-9@.,;:!?\-\/\s]{10,}/g;
    let rMatch: RegExpExecArray | null;
    while ((rMatch = readableRegex.exec(content)) !== null) {
      const cleaned = rMatch[0].trim();
      if (cleaned.length > 10 && !textParts.includes(cleaned)) {
        textParts.push(cleaned);
      }
    }
  }

  return textParts.join(" ").replace(/\s+/g, " ").trim();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LLM — Analyze resume content
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ParsedResume {
  name?: string;
  title?: string;
  yearsOfExperience?: number;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    highlights: string[];
  }[];
  education: {
    school: string;
    degree: string;
  }[];
}

async function analyzeResume(content: string): Promise<ParsedResume> {
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
            content: `Sen bir özgeçmiş analiz asistanısın. Sana verilen özgeçmiş metnini analiz edip aşağıdaki JSON formatında döndür.
Yanıtını SADECE geçerli JSON olarak ver, başka hiçbir şey ekleme. Markdown code block KULLANMA.

{
  "name": "Kişinin adı (bulunamazsa null)",
  "title": "Mevcut veya hedef pozisyon (ör: Senior Software Engineer)",
  "yearsOfExperience": 5,
  "skills": ["TypeScript", "React", "AWS", ...],
  "experience": [
    {
      "company": "Şirket Adı",
      "role": "Pozisyon",
      "duration": "2 yıl",
      "highlights": ["Başarı 1", "Başarı 2"]
    }
  ],
  "education": [
    {
      "school": "Üniversite Adı",
      "degree": "Bilgisayar Mühendisliği Lisans"
    }
  ]
}

Bulunamayan alanlar için mantıklı varsayılanlar kullan. skills dizisi boş olmamalı — metinden çıkarım yap.`,
          },
          {
            role: "user",
            content: `Özgeçmiş metni:\n\n${content.slice(0, 8_000)}`,
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

  const parsed = JSON.parse(cleaned) as ParsedResume;

  return {
    name: parsed.name || undefined,
    title: parsed.title || undefined,
    yearsOfExperience: parsed.yearsOfExperience ?? undefined,
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
  };
}
