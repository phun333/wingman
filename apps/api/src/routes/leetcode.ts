import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { convex } from "@ffh/db";
import { api } from "../../../../convex/_generated/api";
import { getCodingData } from "../services/coding-data-generator";

export const leetcodeRoutes = new Hono();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /leetcode — List / filter problems
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

leetcodeRoutes.get(
  "/",
  describeRoute({
    tags: ["LeetCode"],
    summary: "List LeetCode problems with filters",
    responses: { 200: { description: "Filtered problem list with total count" } },
  }),
  async (c) => {
    const difficulty = c.req.query("difficulty") as
      | "easy"
      | "medium"
      | "hard"
      | undefined;
    const company = c.req.query("company");
    const topic = c.req.query("topic");
    const faang = c.req.query("faang");
    const limit = c.req.query("limit");

    const result = await convex.query(api.leetcodeProblems.list, {
      difficulty,
      company: company || undefined,
      topic: topic || undefined,
      askedByFaang: faang === "true" ? true : faang === "false" ? false : undefined,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });

    return c.json(result);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /leetcode/search — Search problems
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

leetcodeRoutes.get(
  "/search",
  describeRoute({
    tags: ["LeetCode"],
    summary: "Search problems by title, topic, or company",
    responses: { 200: { description: "Search results" } },
  }),
  async (c) => {
    const q = c.req.query("q");
    if (!q) return c.json({ error: "Query parameter 'q' is required" }, 400);

    const limit = c.req.query("limit");
    const results = await convex.query(api.leetcodeProblems.search, {
      query: q,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });

    return c.json(results);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /leetcode/companies — List all companies with stats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

leetcodeRoutes.get(
  "/companies",
  describeRoute({
    tags: ["LeetCode"],
    summary: "List all companies with problem counts",
    responses: { 200: { description: "Company list with stats" } },
  }),
  async (c) => {
    const companies = await convex.query(api.leetcodeProblems.listCompanies);
    return c.json(companies);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /leetcode/companies/:company — Get company problems
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

leetcodeRoutes.get(
  "/companies/:company",
  describeRoute({
    tags: ["LeetCode"],
    summary: "Get all problems for a specific company with stats",
    responses: { 200: { description: "Company problems with breakdown" } },
  }),
  async (c) => {
    const company = c.req.param("company");
    const difficulty = c.req.query("difficulty") as
      | "easy"
      | "medium"
      | "hard"
      | undefined;
    const topic = c.req.query("topic");
    const sortBy = (c.req.query("sort") as "frequency" | "rating" | "acceptance" | "difficulty") || undefined;

    const result = await convex.query(api.leetcodeProblems.getCompanyProblems, {
      company,
      difficulty,
      topic: topic || undefined,
      sortBy,
    });

    return c.json(result);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /leetcode/topics — List all topics with stats
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

leetcodeRoutes.get(
  "/topics",
  describeRoute({
    tags: ["LeetCode"],
    summary: "List all topics with problem counts",
    responses: { 200: { description: "Topic list with stats" } },
  }),
  async (c) => {
    const topics = await convex.query(api.leetcodeProblems.listTopics);
    return c.json(topics);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /leetcode/random — Get random problem
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

leetcodeRoutes.get(
  "/random",
  describeRoute({
    tags: ["LeetCode"],
    summary: "Get a random problem with optional filters",
    responses: {
      200: { description: "Random problem" },
      404: { description: "No problems match filters" },
    },
  }),
  async (c) => {
    const difficulty = c.req.query("difficulty") as
      | "easy"
      | "medium"
      | "hard"
      | undefined;
    const company = c.req.query("company");
    const topic = c.req.query("topic");

    // If no company/topic filter, prefer problems with cached coding data
    if (!company && !topic) {
      const problem = await convex.query(api.leetcodeProblems.getRandomWithCodingData, {
        difficulty,
        seed: Math.random(),
      });
      if (problem) return c.json(problem);
    }

    // Fallback to regular random (with all filters)
    const problem = await convex.query(api.leetcodeProblems.getRandom, {
      difficulty,
      company: company || undefined,
      topic: topic || undefined,
      seed: Math.random(),
    });

    if (!problem) return c.json({ error: "No problems found" }, 404);
    return c.json(problem);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /leetcode/:id/coding-data — Get starter code + test cases
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

leetcodeRoutes.get(
  "/:id/coding-data",
  describeRoute({
    tags: ["LeetCode"],
    summary: "Get starter code templates and test cases for a problem (LLM-generated, cached)",
    responses: {
      200: { description: "Coding data with starter code and test cases" },
      404: { description: "Problem not found" },
      500: { description: "Generation failed" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");

    // Resolve to leetcodeId number
    let leetcodeId: number;
    const numericId = Number.parseInt(id, 10);
    if (!Number.isNaN(numericId) && numericId > 0 && numericId < 10000) {
      leetcodeId = numericId;
    } else {
      // Convex doc ID — look up the leetcodeId
      try {
        const problem = await convex.query(api.leetcodeProblems.getById, { id: id as any });
        if (!problem) return c.json({ error: "Problem not found" }, 404);
        leetcodeId = problem.leetcodeId;
      } catch {
        return c.json({ error: "Problem not found" }, 404);
      }
    }

    const data = await getCodingData(leetcodeId);
    if (!data) return c.json({ error: "Failed to generate coding data" }, 500);
    return c.json(data);
  },
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  GET /leetcode/:id — Get by Convex ID
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

leetcodeRoutes.get(
  "/:id",
  describeRoute({
    tags: ["LeetCode"],
    summary: "Get problem by ID",
    responses: {
      200: { description: "Problem found" },
      404: { description: "Not found" },
    },
  }),
  async (c) => {
    const id = c.req.param("id");

    // LeetCode numeric ID mi, Convex ID mi?
    const numericId = Number.parseInt(id, 10);
    if (!Number.isNaN(numericId) && numericId > 0 && numericId < 10000) {
      const problem = await convex.query(
        api.leetcodeProblems.getByLeetcodeId,
        { leetcodeId: numericId },
      );
      if (!problem) return c.json({ error: "Problem not found" }, 404);
      return c.json(problem);
    }

    try {
      const problem = await convex.query(api.leetcodeProblems.getById, {
        id: id as any,
      });
      if (!problem) return c.json({ error: "Problem not found" }, 404);
      return c.json(problem);
    } catch {
      return c.json({ error: "Problem not found" }, 404);
    }
  },
);
