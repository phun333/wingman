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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      createdAt: now,
      updatedAt: now,
    });
    return await ctx.db.get(id);
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
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
