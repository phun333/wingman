import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { authMiddleware } from "../middleware/auth";

type AuthEnv = {
  Variables: { userId: string; userName: string; userEmail: string };
};

export const interviewRoutes = new Hono<AuthEnv>();

// Apply auth middleware to all interview routes
interviewRoutes.use("*", authMiddleware);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /interviews — Create
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interviewRoutes.post(
  "/",
  describeRoute({
    tags: ["Interviews"],
    summary: "Create a new interview session",
    responses: {
      201: { description: "Interview created" },
      401: { description: "Unauthorized" },
    },
  }),
  validator(
    "json",
    z.object({
      type: z.enum(["live-coding", "system-design", "phone-screen", "practice"]),
      difficulty: z.enum(["easy", "medium", "hard"]),
      language: z.string().default("tr"),
      questionCount: z.number().min(1).max(10).default(5),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");

    const interview = await convex.mutation(api.interviews.create, {
      userId: userId as any,
      type: body.type,
      difficulty: body.difficulty,
      language: body.language,
      questionCount: body.questionCount,
    });

    return c.json(interview, 201);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /interviews — List user's interviews
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interviewRoutes.get(
  "/",
  describeRoute({
    tags: ["Interviews"],
    summary: "List current user's interviews",
    responses: {
      200: { description: "List of interviews" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const limit = Number(c.req.query("limit") ?? "20");

    const interviews = await convex.query(api.interviews.listByUser, {
      userId: userId as any,
      limit,
    });

    return c.json(interviews);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /interviews/stats — User stats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interviewRoutes.get(
  "/stats",
  describeRoute({
    tags: ["Interviews"],
    summary: "Get current user's interview statistics",
    responses: {
      200: { description: "Interview stats" },
      401: { description: "Unauthorized" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");

    const stats = await convex.query(api.interviews.getUserStats, {
      userId: userId as any,
    });

    return c.json(stats);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /interviews/:id — Get by ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interviewRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Interviews"],
    summary: "Get interview by ID",
    responses: {
      200: { description: "Interview found" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden — not your interview" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");

    try {
      const interview = await convex.query(api.interviews.getById, {
        id: id as any,
      });

      // Auth check: user can only see their own interviews
      if (interview.userId !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      return c.json(interview);
    } catch {
      return c.json({ error: "Interview not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PATCH /interviews/:id/start — Start interview
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interviewRoutes.patch(
  "/:id/start",
  describeRoute({
    tags: ["Interviews"],
    summary: "Start an interview (status → in-progress)",
    responses: {
      200: { description: "Interview started" },
      401: { description: "Unauthorized" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");

    try {
      // Verify ownership
      const interview = await convex.query(api.interviews.getById, { id: id as any });
      if (interview.userId !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const updated = await convex.mutation(api.interviews.start, { id: id as any });
      return c.json(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      return c.json({ error: msg }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PATCH /interviews/:id/complete — Complete interview
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interviewRoutes.patch(
  "/:id/complete",
  describeRoute({
    tags: ["Interviews"],
    summary: "Complete an interview (status → completed)",
    responses: {
      200: { description: "Interview completed" },
      401: { description: "Unauthorized" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");

    try {
      const interview = await convex.query(api.interviews.getById, { id: id as any });
      if (interview.userId !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const updated = await convex.mutation(api.interviews.complete, { id: id as any });
      return c.json(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to complete";
      return c.json({ error: msg }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /interviews/:id/messages — List messages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interviewRoutes.get(
  "/:id/messages",
  describeRoute({
    tags: ["Interviews"],
    summary: "Get all messages for an interview",
    responses: {
      200: { description: "List of messages" },
      401: { description: "Unauthorized" },
      403: { description: "Forbidden" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const userId = c.get("userId");
    const id = c.req.param("id");

    try {
      const interview = await convex.query(api.interviews.getById, { id: id as any });
      if (interview.userId !== userId) {
        return c.json({ error: "Forbidden" }, 403);
      }

      const messages = await convex.query(api.messages.listByInterview, {
        interviewId: id as any,
      });

      return c.json(messages);
    } catch {
      return c.json({ error: "Interview not found" }, 404);
    }
  },
);
