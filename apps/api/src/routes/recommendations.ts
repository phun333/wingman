import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { authMiddleware } from "../middleware/auth";
import { getRecommendations, scoreProblems } from "../services/recommendation";

type AuthEnv = {
  Variables: { userId: string; userName: string; userEmail: string };
};

export const recommendationRoutes = new Hono<AuthEnv>();

recommendationRoutes.use("*", authMiddleware);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /recommendations — CV'ye göre problem önerisi al
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

recommendationRoutes.post(
  "/",
  describeRoute({
    tags: ["Recommendations"],
    summary: "CV analiz edip kişiselleştirilmiş LeetCode problem önerileri üret",
    description: `İki aşamalı hibrit öneri sistemi:
1. LLM ile CV'yi analiz eder (ilk çağrıda, sonraki çağrılarda cache kullanır)
2. 1825 LeetCode problemini analiz sonucuna göre puanlar ve sıralar

Scoring kriterleri: zayıf alan eşleşmesi, zorluk uyumu, şirket eşleşmesi, sıklık, FAANG bonusu`,
    responses: {
      200: { description: "Kişiselleştirilmiş problem önerileri" },
      400: { description: "Geçersiz input" },
      401: { description: "Unauthorized" },
      404: { description: "Resume bulunamadı" },
    },
  }),
  validator(
    "json",
    z.object({
      resumeId: z.string().describe("Analiz edilecek resume ID'si"),
      limit: z.number().min(1).max(100).optional().default(30).describe("Döndürülecek max problem sayısı"),
      difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("Zorluk filtresi (opsiyonel)"),
      forceReanalyze: z.boolean().optional().default(false).describe("true ise LLM analizini yeniden yapar"),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const { resumeId, limit, difficulty, forceReanalyze } = c.req.valid("json");

    try {
      const result = await getRecommendations(userId, resumeId, {
        forceReanalyze,
        limit,
        difficulty,
      });

      return c.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Recommendation failed";
      if (message.includes("not found")) {
        return c.json({ error: message }, 404);
      }
      return c.json({ error: message }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /recommendations/analysis — Mevcut analiz verisini getir
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

recommendationRoutes.get(
  "/analysis",
  describeRoute({
    tags: ["Recommendations"],
    summary: "Kullanıcının en güncel CV analiz verisini getir",
    responses: {
      200: { description: "Analiz verisi" },
      401: { description: "Unauthorized" },
      404: { description: "Analiz bulunamadı" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");

    const analysis = await convex.query(api.resumeAnalysis.getByUser, {
      userId: userId as any,
    });

    if (!analysis) {
      return c.json({ error: "Henüz CV analizi yapılmamış. Önce /recommendations endpoint'ine POST yapın." }, 404);
    }

    return c.json(analysis);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /recommendations/analysis/:resumeId — Belirli resume analizi
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

recommendationRoutes.get(
  "/analysis/:resumeId",
  describeRoute({
    tags: ["Recommendations"],
    summary: "Belirli bir resume'ün analiz verisini getir",
    responses: {
      200: { description: "Analiz verisi" },
      401: { description: "Unauthorized" },
      404: { description: "Analiz bulunamadı" },
    },
  }),
  async (c) => {
    const resumeId = c.req.param("resumeId");

    const analysis = await convex.query(api.resumeAnalysis.getByResume, {
      resumeId: resumeId as any,
    });

    if (!analysis) {
      return c.json({ error: "Bu resume için analiz bulunamadı" }, 404);
    }

    return c.json(analysis);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DELETE /recommendations/analysis/:id — Analizi sil
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

recommendationRoutes.delete(
  "/analysis/:id",
  describeRoute({
    tags: ["Recommendations"],
    summary: "Bir CV analizini sil",
    responses: {
      200: { description: "Silindi" },
      401: { description: "Unauthorized" },
      404: { description: "Bulunamadı" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      await convex.mutation(api.resumeAnalysis.remove, { id: id as any });
      return c.json({ deleted: true });
    } catch {
      return c.json({ error: "Analysis not found" }, 404);
    }
  },
);
