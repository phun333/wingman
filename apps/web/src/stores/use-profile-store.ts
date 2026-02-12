import { create } from "zustand";
import {
  getProfile,
  updateProfile,
  uploadResumeFile,
  uploadResumeText,
  deleteResume,
  type ProfileData,
} from "@/lib/api";
import type { UserProfile } from "@ffh/types";

// ─── Types ───────────────────────────────────────────────

interface ProfileState {
  profile: ProfileData | null;
  fetchedAt: number;
  loading: boolean;

  // ── Actions ──────────────────────────────────────────

  fetchProfile: (force?: boolean) => Promise<ProfileData | null>;

  saveProfile: (params: {
    interests?: string[];
    goals?: string;
  }) => Promise<UserProfile | null>;

  uploadFile: (file: File) => Promise<void>;
  uploadText: (text: string, fileName?: string) => Promise<void>;
  removeResume: (id: string) => Promise<void>;

  /** Invalidate cache so next fetch is forced */
  invalidate: () => void;
}

// ─── Constants ───────────────────────────────────────────

const PROFILE_TTL = 5 * 60 * 1000; // 5 minutes

function isStale(fetchedAt: number, ttl: number): boolean {
  return Date.now() - fetchedAt > ttl;
}

// ─── Store ───────────────────────────────────────────────

export const useProfileStore = create<ProfileState>()((set, get) => ({
  profile: null,
  fetchedAt: 0,
  loading: false,

  fetchProfile: async (force = false) => {
    const state = get();
    if (
      !force &&
      state.profile !== null &&
      !isStale(state.fetchedAt, PROFILE_TTL)
    ) {
      return state.profile;
    }

    set({ loading: true });
    try {
      const data = await getProfile();
      set({ profile: data, fetchedAt: Date.now(), loading: false });
      return data;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  saveProfile: async (params) => {
    try {
      const result = await updateProfile(params);
      // Re-fetch to get updated profile
      await get().fetchProfile(true);
      return result;
    } catch {
      return null;
    }
  },

  uploadFile: async (file) => {
    await uploadResumeFile(file);
    await get().fetchProfile(true);
  },

  uploadText: async (text, fileName) => {
    await uploadResumeText({ text, fileName });
    await get().fetchProfile(true);
  },

  removeResume: async (id) => {
    // Optimistic: remove from local state
    set((state) => {
      if (!state.profile) return state;
      return {
        profile: {
          ...state.profile,
          resumes: state.profile.resumes.filter((r) => r._id !== id),
        },
      };
    });

    try {
      await deleteResume(id);
    } catch {
      // Revert on failure
      await get().fetchProfile(true);
      throw new Error("Silme işlemi başarısız");
    }
  },

  invalidate: () => set({ fetchedAt: 0 }),
}));
