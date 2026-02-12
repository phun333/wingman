import { create } from "zustand";
import {
  listInterviews,
  getInterviewStats,
  getUserProgress,
  getDailyActivity,
  type DailyActivity,
} from "@/lib/api";
import type { Interview, InterviewStats, UserProgress } from "@ffh/types";

// ─── Types ───────────────────────────────────────────────

interface InterviewsState {
  // Data — shared across Dashboard, History, Progress
  recentInterviews: Interview[];
  allInterviews: Interview[];
  stats: InterviewStats;
  progress: UserProgress | null;
  activity: DailyActivity | null;

  // Timestamps for stale-while-revalidate
  recentFetchedAt: number;
  allFetchedAt: number;
  statsFetchedAt: number;
  progressFetchedAt: number;
  activityFetchedAt: number;

  // Loading flags
  loadingRecent: boolean;
  loadingAll: boolean;
  loadingStats: boolean;
  loadingProgress: boolean;
  loadingActivity: boolean;

  // ── Actions ──────────────────────────────────────────

  fetchRecent: (force?: boolean) => Promise<Interview[]>;
  fetchAll: (force?: boolean) => Promise<Interview[]>;
  fetchStats: (force?: boolean) => Promise<InterviewStats>;
  fetchProgress: (force?: boolean) => Promise<UserProgress | null>;
  fetchActivity: (force?: boolean) => Promise<DailyActivity | null>;

  /** Fetch common dashboard data in parallel */
  fetchDashboardData: (force?: boolean) => Promise<void>;

  /** Fetch all progress page data in parallel */
  fetchProgressData: (force?: boolean) => Promise<void>;

  /** Invalidate all caches (e.g., after completing an interview) */
  invalidateAll: () => void;

  /** Add or update a single interview optimistically */
  upsertInterview: (interview: Interview) => void;
}

// ─── Constants ───────────────────────────────────────────

const SHORT_TTL = 2 * 60 * 1000; // 2 min — interviews, stats
const MEDIUM_TTL = 5 * 60 * 1000; // 5 min — progress, activity

function isStale(fetchedAt: number, ttl: number): boolean {
  return Date.now() - fetchedAt > ttl;
}

// ─── Store ───────────────────────────────────────────────

export const useInterviewsStore = create<InterviewsState>()((set, get) => ({
  recentInterviews: [],
  allInterviews: [],
  stats: { total: 0, completed: 0, thisWeek: 0 },
  progress: null,
  activity: null,

  recentFetchedAt: 0,
  allFetchedAt: 0,
  statsFetchedAt: 0,
  progressFetchedAt: 0,
  activityFetchedAt: 0,

  loadingRecent: false,
  loadingAll: false,
  loadingStats: false,
  loadingProgress: false,
  loadingActivity: false,

  fetchRecent: async (force = false) => {
    const state = get();
    if (
      !force &&
      state.recentInterviews.length > 0 &&
      !isStale(state.recentFetchedAt, SHORT_TTL)
    ) {
      return state.recentInterviews;
    }

    set({ loadingRecent: true });
    try {
      const interviews = await listInterviews(10);
      set({
        recentInterviews: interviews,
        recentFetchedAt: Date.now(),
        loadingRecent: false,
      });
      return interviews;
    } catch {
      set({ loadingRecent: false });
      return state.recentInterviews;
    }
  },

  fetchAll: async (force = false) => {
    const state = get();
    if (
      !force &&
      state.allInterviews.length > 0 &&
      !isStale(state.allFetchedAt, SHORT_TTL)
    ) {
      return state.allInterviews;
    }

    set({ loadingAll: true });
    try {
      const interviews = await listInterviews(50);
      set({
        allInterviews: interviews,
        allFetchedAt: Date.now(),
        loadingAll: false,
      });
      return interviews;
    } catch {
      set({ loadingAll: false });
      return state.allInterviews;
    }
  },

  fetchStats: async (force = false) => {
    const state = get();
    if (
      !force &&
      state.stats.total > 0 &&
      !isStale(state.statsFetchedAt, SHORT_TTL)
    ) {
      return state.stats;
    }

    set({ loadingStats: true });
    try {
      const stats = await getInterviewStats();
      set({
        stats,
        statsFetchedAt: Date.now(),
        loadingStats: false,
      });
      return stats;
    } catch {
      set({ loadingStats: false });
      return state.stats;
    }
  },

  fetchProgress: async (force = false) => {
    const state = get();
    if (
      !force &&
      state.progress !== null &&
      !isStale(state.progressFetchedAt, MEDIUM_TTL)
    ) {
      return state.progress;
    }

    set({ loadingProgress: true });
    try {
      const progress = await getUserProgress();
      set({
        progress,
        progressFetchedAt: Date.now(),
        loadingProgress: false,
      });
      return progress;
    } catch {
      set({ loadingProgress: false });
      return null;
    }
  },

  fetchActivity: async (force = false) => {
    const state = get();
    if (
      !force &&
      state.activity !== null &&
      !isStale(state.activityFetchedAt, MEDIUM_TTL)
    ) {
      return state.activity;
    }

    set({ loadingActivity: true });
    try {
      const activity = await getDailyActivity();
      set({
        activity,
        activityFetchedAt: Date.now(),
        loadingActivity: false,
      });
      return activity;
    } catch {
      set({ loadingActivity: false });
      return null;
    }
  },

  fetchDashboardData: async (force = false) => {
    const { fetchRecent, fetchStats } = get();
    await Promise.all([fetchRecent(force), fetchStats(force)]);
  },

  fetchProgressData: async (force = false) => {
    const { fetchAll, fetchProgress } = get();
    await Promise.all([fetchAll(force), fetchProgress(force)]);
  },

  invalidateAll: () =>
    set({
      recentFetchedAt: 0,
      allFetchedAt: 0,
      statsFetchedAt: 0,
      progressFetchedAt: 0,
      activityFetchedAt: 0,
    }),

  upsertInterview: (interview) => {
    set((state) => {
      const updateList = (list: Interview[]) => {
        const idx = list.findIndex((i) => i._id === interview._id);
        if (idx >= 0) {
          const copy = [...list];
          copy[idx] = interview;
          return copy;
        }
        return [interview, ...list];
      };

      return {
        recentInterviews: updateList(state.recentInterviews),
        allInterviews: updateList(state.allInterviews),
      };
    });
  },
}));
