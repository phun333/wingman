import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  listLeetcodeProblems,
  searchLeetcodeProblems,
  listCompanies,
  listTopics,
} from "@/lib/api";
import type {
  Difficulty,
  LeetcodeProblem,
  CompanyStats,
  TopicStats,
} from "@ffh/types";

// ─── Types ───────────────────────────────────────────────

type SortOption = "frequency" | "rating" | "acceptance" | "difficulty";
type Tab = "problems" | "companies" | "topics";

interface QuestionsFilters {
  tab: Tab;
  searchTerm: string;
  selectedDifficulty: Difficulty | "";
  selectedCompany: string;
  selectedTopic: string;
  faangOnly: boolean;
  sortBy: SortOption;
  currentPage: number;
  showFilters: boolean;
}

interface QuestionsState extends QuestionsFilters {
  // Cached data
  problems: LeetcodeProblem[];
  totalCount: number;
  companies: CompanyStats[];
  topics: TopicStats[];

  // Cache timestamps
  problemsFetchedAt: number;
  companiesFetchedAt: number;
  topicsFetchedAt: number;

  // Cache key to track what filter combo the cached problems belong to
  problemsCacheKey: string;

  // Loading & error
  loading: boolean;
  error: string | null;

  // ── Actions ──────────────────────────────────────────

  // Filter actions
  setTab: (tab: Tab) => void;
  setSearchTerm: (term: string) => void;
  setSelectedDifficulty: (d: Difficulty | "") => void;
  setSelectedCompany: (c: string) => void;
  setSelectedTopic: (t: string) => void;
  setFaangOnly: (v: boolean) => void;
  setSortBy: (s: SortOption) => void;
  setCurrentPage: (p: number) => void;
  setShowFilters: (v: boolean) => void;
  clearFilters: () => void;

  // Data fetching
  fetchProblems: (force?: boolean) => Promise<void>;
  fetchCompanies: (force?: boolean) => Promise<void>;
  fetchTopics: (force?: boolean) => Promise<void>;

  // Helpers
  _buildCacheKey: () => string;
}

// ─── Constants ───────────────────────────────────────────

/** Cache TTL: 5 minutes for problems, 10 minutes for companies/topics */
const PROBLEMS_TTL = 5 * 60 * 1000;
const STATIC_TTL = 10 * 60 * 1000;

function isStale(fetchedAt: number, ttl: number): boolean {
  return Date.now() - fetchedAt > ttl;
}

// ─── Store ───────────────────────────────────────────────

export const useQuestionsStore = create<QuestionsState>()(
  persist(
    (set, get) => ({
      // Filter defaults
      tab: "problems",
      searchTerm: "",
      selectedDifficulty: "",
      selectedCompany: "",
      selectedTopic: "",
      faangOnly: false,
      sortBy: "frequency",
      currentPage: 1,
      showFilters: false,

      // Data
      problems: [],
      totalCount: 0,
      companies: [],
      topics: [],

      // Timestamps
      problemsFetchedAt: 0,
      companiesFetchedAt: 0,
      topicsFetchedAt: 0,
      problemsCacheKey: "",

      // State
      loading: false,
      error: null,

      // ── Filter Actions ──────────────────────────────

      setTab: (tab) => set({ tab }),

      setSearchTerm: (searchTerm) =>
        set({ searchTerm, currentPage: 1 }),

      setSelectedDifficulty: (selectedDifficulty) =>
        set({ selectedDifficulty, currentPage: 1 }),

      setSelectedCompany: (selectedCompany) =>
        set({ selectedCompany, currentPage: 1 }),

      setSelectedTopic: (selectedTopic) =>
        set({ selectedTopic, currentPage: 1 }),

      setFaangOnly: (faangOnly) =>
        set({ faangOnly, currentPage: 1 }),

      setSortBy: (sortBy) =>
        set({ sortBy, currentPage: 1 }),

      setCurrentPage: (currentPage) => set({ currentPage }),

      setShowFilters: (showFilters) => set({ showFilters }),

      clearFilters: () =>
        set({
          selectedDifficulty: "",
          selectedCompany: "",
          selectedTopic: "",
          faangOnly: false,
          searchTerm: "",
          currentPage: 1,
        }),

      // ── Cache Key Builder ───────────────────────────

      _buildCacheKey: () => {
        const s = get();
        return `${s.searchTerm}|${s.selectedDifficulty}|${s.selectedCompany}|${s.selectedTopic}|${s.faangOnly}`;
      },

      // ── Data Fetching ───────────────────────────────

      fetchProblems: async (force = false) => {
        const state = get();
        const cacheKey = state._buildCacheKey();

        // If cache is valid and same filters, skip
        if (
          !force &&
          state.problemsCacheKey === cacheKey &&
          state.problems.length > 0 &&
          !isStale(state.problemsFetchedAt, PROBLEMS_TTL)
        ) {
          return;
        }

        set({ loading: true, error: null });

        try {
          let problems: LeetcodeProblem[];
          let total: number;

          if (state.searchTerm.length >= 2) {
            const results = await searchLeetcodeProblems(state.searchTerm, 500);
            problems = results;
            total = results.length;
          } else {
            const result = await listLeetcodeProblems({
              difficulty: state.selectedDifficulty || undefined,
              company: state.selectedCompany || undefined,
              topic: state.selectedTopic || undefined,
              faang: state.faangOnly || undefined,
              limit: 2000,
            });
            problems = result.problems;
            total = result.total;
          }

          set({
            problems,
            totalCount: total,
            problemsFetchedAt: Date.now(),
            problemsCacheKey: cacheKey,
            loading: false,
          });
        } catch (err) {
          set({
            error:
              err instanceof Error
                ? err.message
                : "Sorular yüklenirken hata oluştu",
            loading: false,
          });
        }
      },

      fetchCompanies: async (force = false) => {
        const state = get();
        if (
          !force &&
          state.companies.length > 0 &&
          !isStale(state.companiesFetchedAt, STATIC_TTL)
        ) {
          return;
        }

        try {
          const companies = await listCompanies();
          set({ companies, companiesFetchedAt: Date.now() });
        } catch {
          // silent — companies are non-critical
        }
      },

      fetchTopics: async (force = false) => {
        const state = get();
        if (
          !force &&
          state.topics.length > 0 &&
          !isStale(state.topicsFetchedAt, STATIC_TTL)
        ) {
          return;
        }

        try {
          const topics = await listTopics();
          set({ topics, topicsFetchedAt: Date.now() });
        } catch {
          // silent
        }
      },
    }),
    {
      name: "ffh-questions",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Persist filters (UX improvement)
        tab: state.tab,
        searchTerm: state.searchTerm,
        selectedDifficulty: state.selectedDifficulty,
        selectedCompany: state.selectedCompany,
        selectedTopic: state.selectedTopic,
        faangOnly: state.faangOnly,
        sortBy: state.sortBy,
        currentPage: state.currentPage,
        showFilters: state.showFilters,

        // Persist cached data
        problems: state.problems,
        totalCount: state.totalCount,
        companies: state.companies,
        topics: state.topics,

        // Timestamps
        problemsFetchedAt: state.problemsFetchedAt,
        companiesFetchedAt: state.companiesFetchedAt,
        topicsFetchedAt: state.topicsFetchedAt,
        problemsCacheKey: state.problemsCacheKey,
      }),
    },
  ),
);

// ─── Selectors (for performance) ─────────────────────────

export const useQuestionsFilters = () =>
  useQuestionsStore((s) => ({
    tab: s.tab,
    searchTerm: s.searchTerm,
    selectedDifficulty: s.selectedDifficulty,
    selectedCompany: s.selectedCompany,
    selectedTopic: s.selectedTopic,
    faangOnly: s.faangOnly,
    sortBy: s.sortBy,
    currentPage: s.currentPage,
    showFilters: s.showFilters,
  }));

export const useQuestionsData = () =>
  useQuestionsStore((s) => ({
    problems: s.problems,
    totalCount: s.totalCount,
    companies: s.companies,
    topics: s.topics,
    loading: s.loading,
    error: s.error,
  }));

export type { SortOption, Tab };
