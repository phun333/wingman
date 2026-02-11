import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Get by Key ──────────────────────────────────────────

export const getByKey = query({
  args: {
    userId: v.id("users"),
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userMemory")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", args.userId).eq("key", args.key),
      )
      .first();
  },
});

// ─── Get All for User ────────────────────────────────────

export const getAllByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userMemory")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// ─── Upsert ──────────────────────────────────────────────

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userMemory")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", args.userId).eq("key", args.key),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
      return await ctx.db.get(existing._id);
    }

    const id = await ctx.db.insert("userMemory", {
      userId: args.userId,
      key: args.key,
      value: args.value,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(id);
  },
});

// ─── Delete ──────────────────────────────────────────────

export const remove = mutation({
  args: { id: v.id("userMemory") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});
