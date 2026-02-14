import { create } from "zustand";
import {
  searchExploreJobs,
  getExploreJobStats,
  createExplorePath,
  listExplorePaths,
  deleteExplorePath,
} from "@/lib/api";
import type { ScrapedJob, ExploreStats, ExplorePath } from "@/lib/api";

interface ExploreFilters {
  q: string;
  workplaceType: string;
  seniorityLevel: string;
  category: string;
}

interface ExploreState {
  // Job listings
  jobs: ScrapedJob[];
  stats: ExploreStats | null;
  filters: ExploreFilters;
  loading: boolean;
  statsLoading: boolean;

  // User's explore paths
  paths: ExplorePath[];
  pathsLoading: boolean;
  pathsFetchedAt: number;

  // Creating path
  creatingPathFor: string | null; // jobId being created

  // Selected job detail
  selectedJobId: string | null;

  // ── Actions ──
  setFilters: (f: Partial<ExploreFilters>) => void;
  fetchJobs: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchPaths: (force?: boolean) => Promise<void>;
  startPath: (jobId: string) => Promise<ExplorePath>;
  removePath: (id: string) => Promise<void>;
  setSelectedJob: (id: string | null) => void;
  getPathForJob: (jobId: string) => ExplorePath | undefined;
}

const PATHS_TTL = 3 * 60 * 1000;

export const useExploreStore = create<ExploreState>()((set, get) => ({
  jobs: [],
  stats: null,
  filters: { q: "", workplaceType: "", seniorityLevel: "", category: "" },
  loading: false,
  statsLoading: false,
  paths: [],
  pathsLoading: false,
  pathsFetchedAt: 0,
  creatingPathFor: null,
  selectedJobId: null,

  setFilters: (f) => {
    set((s) => ({ filters: { ...s.filters, ...f } }));
  },

  fetchJobs: async () => {
    const { filters } = get();
    set({ loading: true });
    try {
      const jobs = await searchExploreJobs({
        q: filters.q || undefined,
        workplaceType: filters.workplaceType || undefined,
        seniorityLevel: filters.seniorityLevel || undefined,
        category: filters.category || undefined,
        limit: 60,
      });
      set({ jobs, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const stats = await getExploreJobStats();
      set({ stats, statsLoading: false });
    } catch {
      set({ statsLoading: false });
    }
  },

  fetchPaths: async (force = false) => {
    const state = get();
    if (!force && state.pathsFetchedAt > 0 && Date.now() - state.pathsFetchedAt < PATHS_TTL) {
      return;
    }
    set({ pathsLoading: true });
    try {
      const paths = await listExplorePaths();
      set({ paths, pathsLoading: true, pathsFetchedAt: Date.now() });
    } catch {
      // ignore
    } finally {
      set({ pathsLoading: false });
    }
  },

  startPath: async (jobId) => {
    set({ creatingPathFor: jobId });
    try {
      const path = await createExplorePath(jobId);
      // Refresh paths
      await get().fetchPaths(true);
      return path;
    } finally {
      set({ creatingPathFor: null });
    }
  },

  removePath: async (id) => {
    set((s) => ({
      paths: s.paths.filter((p) => p._id !== id),
    }));
    try {
      await deleteExplorePath(id);
    } catch {
      await get().fetchPaths(true);
    }
  },

  setSelectedJob: (id) => set({ selectedJobId: id }),

  getPathForJob: (jobId) => {
    return get().paths.find((p) => p.jobId === jobId);
  },
}));
