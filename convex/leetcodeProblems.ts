import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── List / Filter ──────────────────────────────────────

export const list = query({
  args: {
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    company: v.optional(v.string()),
    topic: v.optional(v.string()),
    askedByFaang: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let problems;
    if (args.difficulty) {
      problems = await ctx.db
        .query("leetcodeProblems")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty!))
        .collect();
    } else {
      problems = await ctx.db.query("leetcodeProblems").collect();
    }

    // In-memory filters
    if (args.company) {
      const companyLower = args.company.toLowerCase();
      problems = problems.filter((p) =>
        p.companies.some((c) => c.toLowerCase() === companyLower),
      );
    }

    if (args.topic) {
      const topicLower = args.topic.toLowerCase();
      problems = problems.filter((p) =>
        p.relatedTopics.some((t) => t.toLowerCase() === topicLower),
      );
    }

    if (args.askedByFaang !== undefined) {
      problems = problems.filter((p) => p.askedByFaang === args.askedByFaang);
    }

    // Sort by frequency (most asked first)
    problems.sort((a, b) => b.frequency - a.frequency);

    return {
      problems: problems.slice(0, limit),
      total: problems.length,
    };
  },
});

// ─── Get by ID ──────────────────────────────────────────

export const getById = query({
  args: { id: v.id("leetcodeProblems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Get by LeetCode ID ────────────────────────────────

export const getByLeetcodeId = query({
  args: { leetcodeId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leetcodeProblems")
      .withIndex("by_leetcode_id", (q) => q.eq("leetcodeId", args.leetcodeId))
      .first();
  },
});

// ─── Search ─────────────────────────────────────────────

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const queryLower = args.query.toLowerCase();

    const all = await ctx.db.query("leetcodeProblems").collect();

    const results = all.filter(
      (p) =>
        p.title.toLowerCase().includes(queryLower) ||
        p.relatedTopics.some((t) => t.toLowerCase().includes(queryLower)) ||
        p.companies.some((c) => c.toLowerCase().includes(queryLower)),
    );

    // Sort: title match first, then by frequency
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(queryLower) ? 1 : 0;
      const bTitle = b.title.toLowerCase().includes(queryLower) ? 1 : 0;
      if (aTitle !== bTitle) return bTitle - aTitle;
      return b.frequency - a.frequency;
    });

    return results.slice(0, limit);
  },
});

// ─── List Companies ─────────────────────────────────────

export const listCompanies = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("leetcodeProblems").collect();

    const companyMap = new Map<
      string,
      { total: number; easy: number; medium: number; hard: number }
    >();

    for (const p of all) {
      for (const company of p.companies) {
        const existing = companyMap.get(company) || {
          total: 0,
          easy: 0,
          medium: 0,
          hard: 0,
        };
        existing.total++;
        existing[p.difficulty]++;
        companyMap.set(company, existing);
      }
    }

    const companies = Array.from(companyMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);

    return companies;
  },
});

// ─── List Topics ────────────────────────────────────────

export const listTopics = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("leetcodeProblems").collect();

    const topicMap = new Map<
      string,
      { total: number; easy: number; medium: number; hard: number }
    >();

    for (const p of all) {
      for (const topic of p.relatedTopics) {
        const existing = topicMap.get(topic) || {
          total: 0,
          easy: 0,
          medium: 0,
          hard: 0,
        };
        existing.total++;
        existing[p.difficulty]++;
        topicMap.set(topic, existing);
      }
    }

    const topics = Array.from(topicMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);

    return topics;
  },
});

// ─── Get Company Problems ───────────────────────────────

export const getCompanyProblems = query({
  args: {
    company: v.string(),
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    topic: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal("frequency"),
        v.literal("rating"),
        v.literal("acceptance"),
        v.literal("difficulty"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("leetcodeProblems").collect();
    const companyLower = args.company.toLowerCase();

    let problems = all.filter((p) =>
      p.companies.some((c) => c.toLowerCase() === companyLower),
    );

    if (args.difficulty) {
      problems = problems.filter((p) => p.difficulty === args.difficulty);
    }

    if (args.topic) {
      const topicLower = args.topic.toLowerCase();
      problems = problems.filter((p) =>
        p.relatedTopics.some((t) => t.toLowerCase() === topicLower),
      );
    }

    const sortBy = args.sortBy ?? "frequency";
    const diffOrder = { easy: 0, medium: 1, hard: 2 };

    problems.sort((a, b) => {
      switch (sortBy) {
        case "frequency":
          return b.frequency - a.frequency;
        case "rating":
          return b.rating - a.rating;
        case "acceptance":
          return b.acceptanceRate - a.acceptanceRate;
        case "difficulty":
          return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        default:
          return b.frequency - a.frequency;
      }
    });

    // Topic dağılımı
    const topicBreakdown = new Map<string, number>();
    for (const p of problems) {
      for (const t of p.relatedTopics) {
        topicBreakdown.set(t, (topicBreakdown.get(t) ?? 0) + 1);
      }
    }

    return {
      company: args.company,
      problems,
      total: problems.length,
      stats: {
        easy: problems.filter((p) => p.difficulty === "easy").length,
        medium: problems.filter((p) => p.difficulty === "medium").length,
        hard: problems.filter((p) => p.difficulty === "hard").length,
      },
      topicBreakdown: Array.from(topicBreakdown.entries())
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count),
    };
  },
});

// ─── Get Random Problem ─────────────────────────────────

export const getRandom = query({
  args: {
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    company: v.optional(v.string()),
    topic: v.optional(v.string()),
    seed: v.optional(v.number()), // Random seed from caller to avoid Convex query determinism
  },
  handler: async (ctx, args) => {
    let problems = await ctx.db.query("leetcodeProblems").collect();

    if (args.difficulty) {
      problems = problems.filter((p) => p.difficulty === args.difficulty);
    }
    if (args.company) {
      const companyLower = args.company.toLowerCase();
      problems = problems.filter((p) =>
        p.companies.some((c) => c.toLowerCase() === companyLower),
      );
    }
    if (args.topic) {
      const topicLower = args.topic.toLowerCase();
      problems = problems.filter((p) =>
        p.relatedTopics.some((t) => t.toLowerCase() === topicLower),
      );
    }

    if (problems.length === 0) return null;

    // Use provided seed for randomness (Convex queries may be deterministic)
    const random = args.seed !== undefined ? args.seed : Math.random();
    const idx = Math.floor(random * problems.length) % problems.length;
    return problems[idx]!;
  },
});

// ─── Get Random Problem (prefer ones with cached coding data) ─

export const getRandomWithCodingData = query({
  args: {
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    seed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // 1. Get all leetcodeIds that have cached coding data
    const codingDataEntries = await ctx.db.query("leetcodeCodingData").collect();
    const idsWithData = new Set(codingDataEntries.map((d) => d.leetcodeId));

    // 2. Get all problems (filtered by difficulty if given)
    let problems = await ctx.db.query("leetcodeProblems").collect();
    if (args.difficulty) {
      problems = problems.filter((p) => p.difficulty === args.difficulty);
    }

    // 3. Prefer problems that already have coding data cached
    const withData = problems.filter((p) => idsWithData.has(p.leetcodeId));

    const pool = withData.length > 0 ? withData : problems;
    if (pool.length === 0) return null;

    const random = args.seed !== undefined ? args.seed : Math.random();
    const idx = Math.floor(random * pool.length) % pool.length;
    return pool[idx]!;
  },
});
