import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { authMiddleware } from "../middleware/auth";

type AuthEnv = {
  Variables: { userId: string; userName: string; userEmail: string };
};

export const exploreRoutes = new Hono<AuthEnv>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /explore/jobs — Search & list scraped jobs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.get(
  "/jobs",
  describeRoute({
    tags: ["Explore"],
    summary: "Search and list scraped job listings",
    responses: { 200: { description: "Job listings" } },
  }),
  async (c) => {
    const q = c.req.query("q");
    const workplaceType = c.req.query("workplaceType");
    const seniorityLevel = c.req.query("seniorityLevel");
    const category = c.req.query("category");
    const company = c.req.query("company");
    const limit = parseInt(c.req.query("limit") ?? "30", 10);

    if (q && q.trim().length > 0) {
      const results = await convex.query(api.jobs.search, {
        query: q.trim(),
        workplaceType: workplaceType || undefined,
        seniorityLevel: seniorityLevel || undefined,
        category: category || undefined,
        company: company || undefined,
        limit,
      });
      return c.json(results);
    }

    const result = await convex.query(api.jobs.list, {
      limit,
      workplaceType: workplaceType || undefined,
      seniorityLevel: seniorityLevel || undefined,
      category: category || undefined,
      company: company || undefined,
    });

    return c.json(result.jobs);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /explore/jobs/stats — Aggregate stats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.get(
  "/jobs/stats",
  describeRoute({
    tags: ["Explore"],
    summary: "Get job stats (counts, categories, etc.)",
    responses: { 200: { description: "Stats object" } },
  }),
  async (c) => {
    const stats = await convex.query(api.jobs.stats);
    return c.json(stats);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /explore/jobs/:id — Single job detail
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.get(
  "/jobs/:id",
  describeRoute({
    tags: ["Explore"],
    summary: "Get a single scraped job by ID",
    responses: { 200: { description: "Job detail" }, 404: { description: "Not found" } },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      const job = await convex.query(api.jobs.getById, { id: id as any });
      if (!job) return c.json({ error: "Job not found" }, 404);
      return c.json(job);
    } catch {
      return c.json({ error: "Job not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Auth-protected routes below
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.use("/paths/*", authMiddleware);
exploreRoutes.use("/paths", authMiddleware);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /explore/paths — Create interview path for a scraped job
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.post(
  "/paths",
  authMiddleware,
  describeRoute({
    tags: ["Explore"],
    summary: "Create interview preparation path from scraped job",
    responses: { 201: { description: "Path created" } },
  }),
  validator("json", z.object({ jobId: z.string() })),
  async (c) => {
    const userId = c.get("userId");
    const { jobId } = c.req.valid("json");

    try {
      const path = await convex.mutation(api.explorePaths.createForJob, {
        userId: userId as any,
        jobId: jobId as any,
      });
      return c.json(path, 201);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Path creation failed";
      return c.json({ error: msg }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /explore/paths — List user's explore paths
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.get(
  "/paths",
  authMiddleware,
  describeRoute({
    tags: ["Explore"],
    summary: "List user's interview paths from scraped jobs",
    responses: { 200: { description: "Path list" } },
  }),
  async (c) => {
    const userId = c.get("userId");
    const paths = await convex.query(api.explorePaths.listByUser, {
      userId: userId as any,
    });
    return c.json(paths);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /explore/paths/:id — Get specific path
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.get(
  "/paths/:id",
  authMiddleware,
  describeRoute({
    tags: ["Explore"],
    summary: "Get explore path by ID",
    responses: { 200: { description: "Path detail" }, 404: { description: "Not found" } },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      const path = await convex.query(api.explorePaths.getById, { id: id as any });
      if (!path) return c.json({ error: "Path not found" }, 404);
      return c.json(path);
    } catch {
      return c.json({ error: "Path not found" }, 404);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PUT /explore/paths/:id/progress — Update question progress
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.put(
  "/paths/:id/progress",
  authMiddleware,
  describeRoute({
    tags: ["Explore"],
    summary: "Update question completion progress",
    responses: { 200: { description: "Updated" } },
  }),
  validator("json", z.object({
    categoryIndex: z.number(),
    questionIndex: z.number(),
    completed: z.boolean(),
    interviewId: z.string().optional(),
    score: z.number().optional(),
  })),
  async (c) => {
    const pathId = c.req.param("id");
    const body = c.req.valid("json");

    try {
      const updated = await convex.mutation(api.explorePaths.updateQuestionProgress, {
        pathId: pathId as any,
        categoryIndex: body.categoryIndex,
        questionIndex: body.questionIndex,
        completed: body.completed,
        interviewId: body.interviewId as any,
        score: body.score,
      });
      return c.json(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      return c.json({ error: msg }, 400);
    }
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DELETE /explore/paths/:id — Delete an explore path
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exploreRoutes.delete(
  "/paths/:id",
  authMiddleware,
  describeRoute({
    tags: ["Explore"],
    summary: "Delete explore path",
    responses: { 200: { description: "Deleted" } },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      await convex.mutation(api.explorePaths.remove, { id: id as any });
      return c.json({ deleted: true });
    } catch {
      return c.json({ error: "Not found" }, 404);
    }
  },
);
