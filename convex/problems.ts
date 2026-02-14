import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const problemValidator = {
  title: v.string(),
  description: v.string(),
  difficulty: v.union(
    v.literal("easy"),
    v.literal("medium"),
    v.literal("hard"),
  ),
  category: v.string(),
  starterCode: v.optional(
    v.object({
      javascript: v.optional(v.string()),
      python: v.optional(v.string()),
      typescript: v.optional(v.string()),
    }),
  ),
  testCases: v.array(
    v.object({
      input: v.string(),
      expectedOutput: v.string(),
      isHidden: v.boolean(),
    }),
  ),
  optimalSolution: v.optional(v.string()),
  timeComplexity: v.optional(v.string()),
  spaceComplexity: v.optional(v.string()),
};

// ─── Create ──────────────────────────────────────────────

export const create = mutation({
  args: problemValidator,
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("problems", {
      ...args,
      createdAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// ─── List ────────────────────────────────────────────────

export const list = query({
  args: {
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.difficulty) {
      return await ctx.db
        .query("problems")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty!))
        .collect();
    }
    if (args.category) {
      return await ctx.db
        .query("problems")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    }
    return await ctx.db.query("problems").collect();
  },
});

// ─── Get by ID ───────────────────────────────────────────

export const getById = query({
  args: { id: v.id("problems") },
  handler: async (ctx, args) => {
    const problem = await ctx.db.get(args.id);
    if (!problem) throw new Error("Problem not found");
    return problem;
  },
});

// ─── Get Random ──────────────────────────────────────────

export const getRandom = query({
  args: {
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    ),
    category: v.optional(v.string()),
    seed: v.optional(v.number()), // Random seed from caller to avoid Convex query determinism
  },
  handler: async (ctx, args) => {
    let problems;
    if (args.difficulty) {
      problems = await ctx.db
        .query("problems")
        .withIndex("by_difficulty", (q) => q.eq("difficulty", args.difficulty!))
        .collect();
    } else {
      problems = await ctx.db.query("problems").collect();
    }

    if (args.category) {
      problems = problems.filter((p) => p.category === args.category);
    }

    if (problems.length === 0) return null;

    const random = args.seed !== undefined ? args.seed : Math.random();
    const idx = Math.floor(random * problems.length) % problems.length;
    return problems[idx]!;
  },
});
