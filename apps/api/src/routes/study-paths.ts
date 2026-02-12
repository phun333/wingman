import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";

export const studyPathRoutes = new Hono();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /study-paths — Generate company study path
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

studyPathRoutes.post(
  "/",
  describeRoute({
    tags: ["Study Paths"],
    summary: "Generate a company-specific study path",
    responses: {
      201: { description: "Study path created" },
      200: { description: "Existing study path returned" },
    },
  }),
  validator(
    "json",
    z.object({
      userId: z.string(),
      company: z.string().min(1),
      difficulty: z
        .enum(["mixed", "easy", "medium", "hard"])
        .optional()
        .default("mixed"),
      maxProblems: z.number().min(5).max(200).optional().default(50),
    }),
  ),
  async (c) => {
    const { userId, company, difficulty, maxProblems } = c.req.valid("json");

    const path = await convex.mutation(api.companyStudyPaths.generate, {
      userId: userId as any,
      company,
      difficulty,
      maxProblems,
    });

    return c.json(path, 201);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /study-paths/user/:userId — List user's study paths
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

studyPathRoutes.get(
  "/user/:userId",
  describeRoute({
    tags: ["Study Paths"],
    summary: "List all study paths for a user",
    responses: { 200: { description: "List of study paths" } },
  }),
  async (c) => {
    const userId = c.req.param("userId");
    const paths = await convex.query(api.companyStudyPaths.listByUser, {
      userId: userId as any,
    });
    return c.json(paths);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /study-paths/:id — Get study path details
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

studyPathRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Study Paths"],
    summary: "Get study path by ID with full details",
    responses: {
      200: { description: "Study path found" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    const path = await convex.query(api.companyStudyPaths.getById, {
      id: id as any,
    });
    if (!path) return c.json({ error: "Study path not found" }, 404);
    return c.json(path);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PATCH /study-paths/:id/progress — Mark problem completed
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

studyPathRoutes.patch(
  "/:id/progress",
  describeRoute({
    tags: ["Study Paths"],
    summary: "Mark a problem as completed/uncompleted in a study path",
    responses: { 200: { description: "Progress updated" } },
  }),
  validator(
    "json",
    z.object({
      sectionIndex: z.number().int().min(0),
      problemIndex: z.number().int().min(0),
      completed: z.boolean(),
      interviewId: z.string().optional(),
      score: z.number().min(0).max(100).optional(),
    }),
  ),
  async (c) => {
    const id = c.req.param("id");
    const body = c.req.valid("json");

    const result = await convex.mutation(
      api.companyStudyPaths.markProblemCompleted,
      {
        pathId: id as any,
        sectionIndex: body.sectionIndex,
        problemIndex: body.problemIndex,
        completed: body.completed,
        interviewId: body.interviewId as any,
        score: body.score,
      },
    );

    return c.json(result);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /study-paths/:id/reset — Reset path progress
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

studyPathRoutes.post(
  "/:id/reset",
  describeRoute({
    tags: ["Study Paths"],
    summary: "Reset all progress in a study path",
    responses: { 200: { description: "Progress reset" } },
  }),
  async (c) => {
    const id = c.req.param("id");
    const result = await convex.mutation(api.companyStudyPaths.resetProgress, {
      id: id as any,
    });
    return c.json(result);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DELETE /study-paths/:id — Delete study path
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

studyPathRoutes.delete(
  "/:id",
  describeRoute({
    tags: ["Study Paths"],
    summary: "Delete a study path",
    responses: { 200: { description: "Deleted" } },
  }),
  async (c) => {
    const id = c.req.param("id");
    await convex.mutation(api.companyStudyPaths.remove, { id: id as any });
    return c.json({ deleted: true });
  },
);
