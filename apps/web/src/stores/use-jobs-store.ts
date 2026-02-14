import { create } from "zustand";
import {
  listJobPostings,
  deleteJobPosting,
  parseJobPosting,
  getJobPaths,
  deleteJobPath,
} from "@/lib/api";
import type { JobPosting } from "@ffh/types";

// ─── Types ───────────────────────────────────────────────

interface JobPath {
  _id: string;
  jobPostingId: string;
  title: string;
  description: string;
  totalQuestions: number;
  completedQuestions: number;
  categories: Array<{
    name: string;
    type: "live-coding" | "system-design" | "phone-screen";
    questions: Array<{
      id: string;
      question: string;
      difficulty: "easy" | "medium" | "hard";
      completed: boolean;
      interviewId?: string;
      score?: number;
      leetcodeId?: number;
      leetcodeUrl?: string;
    }>;
  }>;
  progress: number;
  job?: {
    title: string;
    company?: string;
    level?: string;
  } | null;
}

interface JobsState {
  jobs: JobPosting[];
  paths: JobPath[];
  fetchedAt: number;
  loading: boolean;

  // ── Actions ──────────────────────────────────────────

  fetchData: (force?: boolean) => Promise<void>;
  parseJob: (params: { url?: string; rawText?: string }) => Promise<void>;
  removeJob: (id: string) => Promise<void>;
  removePath: (id: string) => Promise<void>;
  getPathForJob: (jobId: string) => JobPath | undefined;
  invalidate: () => void;
}

// ─── Constants ───────────────────────────────────────────

const JOBS_TTL = 3 * 60 * 1000; // 3 minutes

function isStale(fetchedAt: number, ttl: number): boolean {
  return Date.now() - fetchedAt > ttl;
}

// ─── Store ───────────────────────────────────────────────

export const useJobsStore = create<JobsState>()((set, get) => ({
  jobs: [],
  paths: [],
  fetchedAt: 0,
  loading: false,

  fetchData: async (force = false) => {
    const state = get();
    if (
      !force &&
      state.fetchedAt > 0 &&
      !isStale(state.fetchedAt, JOBS_TTL)
    ) {
      return;
    }

    set({ loading: true });
    try {
      const [jobList, pathList] = await Promise.all([
        listJobPostings(),
        getJobPaths(),
      ]);
      set({
        jobs: jobList,
        paths: pathList,
        fetchedAt: Date.now(),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  parseJob: async (params) => {
    await parseJobPosting(params);
    await get().fetchData(true);
  },

  removeJob: async (id) => {
    // Optimistic update
    set((state) => ({
      jobs: state.jobs.filter((j) => j._id !== id),
      paths: state.paths.filter((p) => p.jobPostingId !== id),
    }));

    try {
      await deleteJobPosting(id);
    } catch {
      // Revert on failure
      await get().fetchData(true);
      throw new Error("Silme işlemi başarısız");
    }
  },

  removePath: async (id) => {
    // Optimistic update
    set((state) => ({
      paths: state.paths.filter((p) => p._id !== id),
    }));

    try {
      await deleteJobPath(id);
    } catch {
      // Revert on failure
      await get().fetchData(true);
      throw new Error("Silme işlemi başarısız");
    }
  },

  getPathForJob: (jobId) => {
    return get().paths.find((p) => p.jobPostingId === jobId);
  },

  invalidate: () => set({ fetchedAt: 0 }),
}));

export type { JobPath };
