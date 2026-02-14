import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
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
        summary: parsed.summary,
        yearsOfExperience: parsed.yearsOfExperience,
        skills: parsed.skills,
        categorizedSkills: parsed.categorizedSkills,
        experience: parsed.experience,
        education: parsed.education,
        projects: parsed.projects,
        certifications: parsed.certifications,
        languages: parsed.languages,
        keyAchievements: parsed.keyAchievements,
        interviewTopics: parsed.interviewTopics,
        rawText: rawText.slice(0, 12_000),
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
    const readableRegex = /[a-zA-ZğüşıöçĞÜŞİÖÇ0-9@.,;:!?\-/\s]{10,}/g;
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
//  LLM — Analyze resume content (Deep Analysis)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface ParsedResume {
  name?: string;
  title?: string;
  summary?: string;
  yearsOfExperience?: number;
  skills: string[];
  categorizedSkills?: {
    programmingLanguages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    cloud: string[];
    methodologies: string[];
    other: string[];
  };
  experience: {
    company: string;
    role: string;
    duration: string;
    highlights: string[];
    technologies?: string[];
  }[];
  education: {
    school: string;
    degree: string;
    year?: string;
    gpa?: string;
  }[];
  projects?: {
    name: string;
    description: string;
    technologies: string[];
    highlights: string[];
  }[];
  certifications?: {
    name: string;
    issuer: string;
    year?: string;
  }[];
  languages?: string[];
  keyAchievements?: string[];
  interviewTopics?: string[];
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
        "X-Title": "Wingman AI Interview",
      },
      body: JSON.stringify({
        model: ENV.OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content: `Sen deneyimli bir teknik işe alım uzmanı ve özgeçmiş analiz asistanısın. Sana verilen özgeçmiş metnini SON DERECE DETAYLI analiz edip aşağıdaki JSON formatında döndür.

ÖNEMLİ KURALLAR:
- Özgeçmişin HER satırını, HER detayını incele. Hiçbir bilgiyi atlama.
- Her iş deneyimi için EN AZ 3-5 highlight çıkar. Metinden doğrudan alıntıla veya özetle.
- Teknolojileri, araçları, framework'leri, cloud servislerini TEK TEK belirle.
- Sayısal başarıları (performans artışı, maliyet düşürme, kullanıcı sayısı vb.) mutlaka yakala.
- Liderlik, mentorluk, takım yönetimi gibi soft skill'leri de çıkar.
- Projeleri ayrı ayrı analiz et — her projenin ne yaptığını, hangi teknolojileri kullandığını belirle.
- interviewTopics alanında, bu adaya sorulabilecek EN AZ 5-8 kişiselleştirilmiş mülakat sorusu/konusu öner.

Yanıtını SADECE geçerli JSON olarak ver, başka hiçbir şey ekleme. Markdown code block KULLANMA.

{
  "name": "Kişinin tam adı (bulunamazsa null)",
  "title": "Mevcut veya en son pozisyon unvanı (ör: Senior Software Engineer)",
  "summary": "Adayın profesyonel profili hakkında 3-5 cümlelik kapsamlı özet. Kaç yıllık deneyimi var, hangi alanlarda uzman, kariyer yörüngesi nasıl, en güçlü yönleri neler — bunları sentezle.",
  "yearsOfExperience": 5,
  "skills": ["TypeScript", "React", "AWS", "Docker", "PostgreSQL", ...],
  "categorizedSkills": {
    "programmingLanguages": ["TypeScript", "Python", "Go", "Java", ...],
    "frameworks": ["React", "Next.js", "Express", "Spring Boot", ...],
    "databases": ["PostgreSQL", "MongoDB", "Redis", "DynamoDB", ...],
    "tools": ["Docker", "Kubernetes", "Git", "Jenkins", "Terraform", ...],
    "cloud": ["AWS", "GCP", "Azure", "Vercel", "Cloudflare", ...],
    "methodologies": ["Agile", "Scrum", "CI/CD", "TDD", "Microservices", ...],
    "other": ["GraphQL", "REST API", "WebSocket", "gRPC", ...]
  },
  "experience": [
    {
      "company": "Şirket Adı",
      "role": "Pozisyon Unvanı",
      "duration": "Ocak 2022 - Devam ediyor (2+ yıl)",
      "highlights": [
        "Mikro servis mimarisine geçişi liderlik etti, sistem uptime'ını %99.9'a çıkardı",
        "5 kişilik frontend ekibini yönetti, code review süreçlerini kurdu",
        "React + TypeScript ile müşteri portalını sıfırdan geliştirdi, 50K+ aktif kullanıcıya ulaştı",
        "CI/CD pipeline'ını GitHub Actions ile otomatize etti, deployment süresini %70 azalttı",
        "Performans optimizasyonları ile sayfa yüklenme süresini 3s'den 800ms'ye düşürdü"
      ],
      "technologies": ["React", "TypeScript", "Node.js", "AWS", "Docker", "PostgreSQL"]
    }
  ],
  "education": [
    {
      "school": "Üniversite Adı",
      "degree": "Bilgisayar Mühendisliği Lisans",
      "year": "2018",
      "gpa": "3.5/4.0"
    }
  ],
  "projects": [
    {
      "name": "Proje Adı",
      "description": "Projenin ne yaptığının detaylı açıklaması",
      "technologies": ["React", "Node.js", "MongoDB"],
      "highlights": ["100K+ kullanıcı", "Açık kaynak, 500+ GitHub star"]
    }
  ],
  "certifications": [
    {
      "name": "AWS Solutions Architect Associate",
      "issuer": "Amazon Web Services",
      "year": "2023"
    }
  ],
  "languages": ["Türkçe (Ana dil)", "İngilizce (İleri seviye)", "Almanca (Orta seviye)"],
  "keyAchievements": [
    "Sistem performansını %300 artırdı",
    "50K+ aktif kullanıcılı ürün geliştirdi",
    "5 kişilik ekibi yönetti",
    "Açık kaynak projeye 500+ GitHub star aldı",
    "Yıllık 200K$ maliyet tasarrufu sağladı"
  ],
  "interviewTopics": [
    "React performans optimizasyonu (useMemo, useCallback, lazy loading) deneyimi",
    "Mikro servis mimarisinde servisler arası iletişim ve hata yönetimi",
    "CI/CD pipeline tasarımı ve deployment stratejileri",
    "Takım liderliği deneyimi ve code review süreçleri",
    "AWS servisleri ile ölçeklenebilir sistem tasarımı",
    "PostgreSQL query optimizasyonu ve veritabanı tasarımı",
    "Monolith'ten mikro servise geçiş deneyimi",
    "Performans metrikleri ve monitoring yaklaşımı"
  ]
}

Bulunamayan alanlar için:
- skills ve categorizedSkills → metinden MUTLAKA çıkarım yap, boş bırakma
- experience highlights → her deneyim için en az 2-3 madde yaz, metinde yoksa bile pozisyondan çıkarım yap
- projects → özgeçmişte proje yoksa boş dizi dön
- certifications → yoksa boş dizi
- interviewTopics → MUTLAKA en az 5 konu öner, adayın deneyimine göre kişiselleştir
- keyAchievements → metinden sayısal/ölçülebilir başarıları çıkar, yoksa önemli başarıları listele
- summary → MUTLAKA yaz, adayın genel profilini 3-5 cümle ile özetle`,
          },
          {
            role: "user",
            content: `Aşağıdaki özgeçmişi son derece detaylı analiz et. Her satırı, her bilgiyi, her teknolojiyi, her başarıyı yakala. Hiçbir detayı atlama:\n\n${content.slice(0, 12_000)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
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
    summary: parsed.summary || undefined,
    yearsOfExperience: parsed.yearsOfExperience ?? undefined,
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    categorizedSkills: parsed.categorizedSkills ?? undefined,
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
    languages: Array.isArray(parsed.languages) ? parsed.languages : [],
    keyAchievements: Array.isArray(parsed.keyAchievements) ? parsed.keyAchievements : [],
    interviewTopics: Array.isArray(parsed.interviewTopics) ? parsed.interviewTopics : [],
  };
}
