import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Get or Create ───────────────────────────────────────

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// ─── Upsert ──────────────────────────────────────────────

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    interests: v.optional(v.array(v.string())),
    goals: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.interests !== undefined && { interests: args.interests }),
        ...(args.goals !== undefined && { goals: args.goals }),
        ...(args.preferredLanguage !== undefined && {
          preferredLanguage: args.preferredLanguage,
        }),
        updatedAt: Date.now(),
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("userProfiles", {
      userId: args.userId,
      interests: args.interests ?? [],
      goals: args.goals,
      preferredLanguage: args.preferredLanguage,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});
