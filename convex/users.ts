import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");
    return user;
  },
});

export const getByAuthId = query({
  args: { authId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    authId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      authId: args.authId,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    authId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("User not found");
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    return await ctx.db.get(id);
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("User not found");
    await ctx.db.delete(args.id);
    return { deleted: true };
  },
});

// Get or create user by auth ID
export const getOrCreateByAuthId = mutation({
  args: {
    authId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // First try to find by authId
    let user = await ctx.db.query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();

    if (!user) {
      // Try to find by email
      user = await ctx.db.query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();

      if (user) {
        // User exists but without authId, update it
        await ctx.db.patch(user._id, {
          authId: args.authId,
          updatedAt: Date.now(),
        });
        user = await ctx.db.get(user._id);
      } else {
        // Create new user
        const id = await ctx.db.insert("users", {
          email: args.email,
          name: args.name,
          authId: args.authId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        user = await ctx.db.get(id);
      }
    }

    return user;
  },
});
