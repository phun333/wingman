import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { authMiddleware } from "../middleware/auth";
import { generateReport } from "../services/report-generator";

type AuthEnv = {
  Variables: { userId: string; userName: string; userEmail: string };
};

export const reportRoutes = new Hono<AuthEnv>();

reportRoutes.use("*", authMiddleware);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /reports/generate — Generate report for an interview
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

reportRoutes.post(
  "/generate",
  describeRoute({
    tags: ["Reports"],
    summary: "Generate evaluation report for a completed interview",
    responses: {
      200: { description: "Report generated" },
      400: { description: "Invalid request" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
    },
  }),
  validator(
    "json",
    z.object({
      interviewId: z.string(),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const { interviewId } = c.req.valid("json");

    try {
      // Verify ownership
      const interview = await convex.query(api.interviews.getById, {
        id: interviewId as any,
      });
      if (interview.userId !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const resultId = await generateReport(interviewId);
      return c.json({ resultId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Report generation failed";
      return c.json({ error: message }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /reports/interview/:id — Get report by interview ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

reportRoutes.get(
  "/interview/:id",
  describeRoute({
    tags: ["Reports"],
    summary: "Get report for an interview",
    responses: {
      200: { description: "Report found" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const interviewId = c.req.param("id");

    try {
      // Verify ownership
      const interview = await convex.query(api.interviews.getById, {
        id: interviewId as any,
      });
      if (interview.userId !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const result = await convex.query(api.interviewResults.getByInterview, {
        interviewId: interviewId as any,
      });

      if (!result) {
        return c.json({ error: "Report not found" }, 404);
      }

      return c.json(result);
    } catch {
      return c.json({ error: "Interview not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /reports/progress — Get user's progress data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

reportRoutes.get(
  "/progress",
  describeRoute({
    tags: ["Reports"],
    summary: "Get user progress and cumulative analysis",
    responses: {
      200: { description: "Progress data" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");

    const progress = await convex.query(api.interviewResults.getUserProgress, {
      userId: userId as any,
    });

    return c.json(progress);
  },
);
