import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";

export const designProblemRoutes = new Hono();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /design-problems — List all design problems
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

designProblemRoutes.get(
  "/",
  describeRoute({
    tags: ["Design Problems"],
    summary: "List design problems with optional difficulty filter",
    responses: { 200: { description: "List of design problems" } },
  }),
  async (c) => {
    const difficulty = c.req.query("difficulty") as "easy" | "medium" | "hard" | undefined;
    const problems = await convex.query(api.designProblems.list, { difficulty });
    return c.json(problems);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /design-problems/random — Random design problem
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

designProblemRoutes.get(
  "/random",
  describeRoute({
    tags: ["Design Problems"],
    summary: "Get a random design problem by difficulty",
    responses: {
      200: { description: "Random design problem" },
      404: { description: "No problems found" },
    },
  }),
  async (c) => {
    const difficulty = c.req.query("difficulty") as "easy" | "medium" | "hard" | undefined;
    if (!difficulty) {
      return c.json({ error: "difficulty query param required" }, 400);
    }
    const problem = await convex.query(api.designProblems.getRandom, { difficulty });
    if (!problem) return c.json({ error: "No design problems found" }, 404);
    return c.json(problem);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /design-problems/:id — Get by ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

designProblemRoutes.get(
  "/:id",
  describeRoute({
    tags: ["Design Problems"],
    summary: "Get design problem by ID",
    responses: {
      200: { description: "Problem found" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");
    try {
      const problem = await convex.query(api.designProblems.getById, { id: id as any });
      return c.json(problem);
    } catch {
      return c.json({ error: "Design problem not found" }, 404);
    }
  },
);
