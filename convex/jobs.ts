import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Job validator (shared shape for upsert) ──────────────

const jobFields = {
  externalId: v.string(),
  title: v.string(),
  company: v.string(),
  applyUrl: v.string(),
  source: v.string(),
  location: v.string(),
  workplaceType: v.string(),
  countries: v.array(v.string()),
  seniorityLevel: v.optional(v.string()),
  commitment: v.array(v.string()),
  category: v.optional(v.string()),
  roleType: v.optional(v.string()),
  minYoe: v.optional(v.number()),
  skills: v.array(v.string()),
  requirements: v.optional(v.string()),
  description: v.optional(v.string()),
  salaryMin: v.optional(v.number()),
  salaryMax: v.optional(v.number()),
  salaryCurrency: v.optional(v.string()),
  salaryFrequency: v.optional(v.string()),
  isCompensationTransparent: v.boolean(),
  companyLogo: v.optional(v.string()),
  companyWebsite: v.optional(v.string()),
  companyLinkedin: v.optional(v.string()),
  companyIndustry: v.optional(v.string()),
  companySize: v.optional(v.number()),
  companyTagline: v.optional(v.string()),
  publishedAt: v.optional(v.number()),
  scrapedAt: v.number(),
  isExpired: v.boolean(),
};

// ─── Bulk upsert (scraper'dan çağrılır) ──────────────────

export const bulkUpsert = mutation({
  args: {
    jobs: v.array(v.object(jobFields)),
  },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const job of args.jobs) {
      // Check if job already exists by externalId
      const existing = await ctx.db
        .query("jobs")
        .withIndex("by_external_id", (q) => q.eq("externalId", job.externalId))
        .first();

      if (existing) {
        // Update if the job data has changed (check publishedAt or scrapedAt)
        if (
          existing.isExpired !== job.isExpired ||
          existing.title !== job.title ||
          existing.applyUrl !== job.applyUrl
        ) {
          await ctx.db.patch(existing._id, {
            ...job,
            scrapedAt: Date.now(),
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await ctx.db.insert("jobs", {
          ...job,
          scrapedAt: Date.now(),
        });
        inserted++;
      }
    }

    return { inserted, updated, skipped, total: args.jobs.length };
  },
});

// ─── List jobs (paginated) ───────────────────────────────

export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    workplaceType: v.optional(v.string()),
    seniorityLevel: v.optional(v.string()),
    category: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const buildQuery = () => {
      if (args.workplaceType) {
        return ctx.db
          .query("jobs")
          .withIndex("by_workplace_type", (idx) =>
            idx.eq("workplaceType", args.workplaceType!)
          );
      }
      if (args.seniorityLevel) {
        return ctx.db
          .query("jobs")
          .withIndex("by_seniority", (idx) =>
            idx.eq("seniorityLevel", args.seniorityLevel!)
          );
      }
      if (args.category) {
        return ctx.db
          .query("jobs")
          .withIndex("by_category", (idx) =>
            idx.eq("category", args.category!)
          );
      }
      if (args.company) {
        return ctx.db
          .query("jobs")
          .withIndex("by_company", (idx) =>
            idx.eq("company", args.company!)
          );
      }
      return ctx.db.query("jobs");
    };

    const results = await buildQuery().order("desc").take(limit + 1);

    const hasMore = results.length > limit;
    const jobs = hasMore ? results.slice(0, limit) : results;

    return {
      jobs,
      hasMore,
      nextCursor: hasMore ? jobs[jobs.length - 1]?._id : undefined,
    };
  },
});

// ─── Search jobs (full-text) ─────────────────────────────

export const search = query({
  args: {
    query: v.string(),
    workplaceType: v.optional(v.string()),
    seniorityLevel: v.optional(v.string()),
    category: v.optional(v.string()),
    company: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let q = ctx.db
      .query("jobs")
      .withSearchIndex("search_jobs", (s) => {
        let search = s.search("title", args.query);
        if (args.workplaceType) search = search.eq("workplaceType", args.workplaceType);
        if (args.seniorityLevel) search = search.eq("seniorityLevel", args.seniorityLevel);
        if (args.category) search = search.eq("category", args.category);
        if (args.company) search = search.eq("company", args.company);
        return search;
      });

    return await q.take(limit);
  },
});

// ─── List ALL (export/seed amaçlı) ──────────────────────

export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("jobs").collect();
  },
});

// ─── Get by ID ───────────────────────────────────────────

export const getById = query({
  args: { id: v.id("jobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Stats ───────────────────────────────────────────────

export const stats = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("jobs").collect();
    const total = all.length;
    const active = all.filter((j) => !j.isExpired).length;

    const companies = new Set(all.map((j) => j.company));
    const categories = new Set(all.map((j) => j.category).filter(Boolean));

    const byWorkplace: Record<string, number> = {};
    const bySeniority: Record<string, number> = {};

    for (const j of all) {
      byWorkplace[j.workplaceType] = (byWorkplace[j.workplaceType] || 0) + 1;
      if (j.seniorityLevel) {
        bySeniority[j.seniorityLevel] = (bySeniority[j.seniorityLevel] || 0) + 1;
      }
    }

    return {
      total,
      active,
      companies: companies.size,
      categories: categories.size,
      byWorkplace,
      bySeniority,
    };
  },
});

// ─── Mark expired ────────────────────────────────────────

export const markExpired = internalMutation({
  args: {
    externalIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    let count = 0;
    for (const externalId of args.externalIds) {
      const job = await ctx.db
        .query("jobs")
        .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
        .first();
      if (job && !job.isExpired) {
        await ctx.db.patch(job._id, { isExpired: true });
        count++;
      }
    }
    return { expired: count };
  },
});
