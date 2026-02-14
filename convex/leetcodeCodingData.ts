import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Get by LeetCode ID (cache lookup) ─────────────────

export const getByLeetcodeId = query({
  args: { leetcodeId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leetcodeCodingData")
      .withIndex("by_leetcode_id", (q) => q.eq("leetcodeId", args.leetcodeId))
      .first();
  },
});

// ─── Upsert coding data (create or update) ─────────────

export const upsert = mutation({
  args: {
    leetcodeId: v.number(),
    starterCode: v.object({
      javascript: v.string(),
      python: v.string(),
      typescript: v.string(),
    }),
    testCases: v.array(
      v.object({
        input: v.string(),
        expectedOutput: v.string(),
        isHidden: v.boolean(),
      }),
    ),
    solutionCode: v.optional(
      v.object({
        javascript: v.optional(v.string()),
        python: v.optional(v.string()),
        typescript: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Check if entry exists
    const existing = await ctx.db
      .query("leetcodeCodingData")
      .withIndex("by_leetcode_id", (q) => q.eq("leetcodeId", args.leetcodeId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        starterCode: args.starterCode,
        testCases: args.testCases,
        solutionCode: args.solutionCode,
      });
      return existing._id;
    }

    return await ctx.db.insert("leetcodeCodingData", {
      leetcodeId: args.leetcodeId,
      starterCode: args.starterCode,
      testCases: args.testCases,
      solutionCode: args.solutionCode,
      createdAt: Date.now(),
    });
  },
});
