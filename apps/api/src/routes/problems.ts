import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { z } from "zod";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";

export const problemRoutes = new Hono();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /problems — List all problems
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

problemRoutes.get(
  "/",
  describeRoute({
    tags: ["Problems"],
    summary: "List problems with optional difficulty/category filter",
    responses: { 200: { description: "List of problems" } },
  }),
  async (c) => {
    const difficulty = c.req.query("difficulty") as "easy" | "medium" | "hard" | undefined;
    const category = c.req.query("category");

    const problems = await convex.query(api.problems.list, {
      difficulty,
      category,
    });
    return c.json(problems);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /problems/random — Get random problem
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

problemRoutes.get(
  "/random",
  describeRoute({
    tags: ["Problems"],
    summary: "Get a random problem, optionally filtered by difficulty",
    responses: {
      200: { description: "Random problem" },
      404: { description: "No problems found" },
    },
  }),
  async (c) => {
    const difficulty = c.req.query("difficulty") as "easy" | "medium" | "hard" | undefined;
    const category = c.req.query("category");

    const problem = await convex.query(api.problems.getRandom, {
      difficulty,
      category,
    });

    if (!problem) {
      return c.json({ error: "No problems found" }, 404);
    }

    return c.json(problem);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /problems/:id — Get by ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

problemRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Problems"],
    summary: "Get problem by ID",
    responses: {
      200: { description: "Problem found" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      const problem = await convex.query(api.problems.getById, { id: id as any });
      return c.json(problem);
    } catch {
      return c.json({ error: "Problem not found" }, 404);
    }
  },
);
