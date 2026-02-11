import type { HireRecommendation } from "@ffh/types";
import type { BadgeVariant } from "@/components/ui/Badge";

// ─── Interview Type Labels ──────────────────────────────

export const typeLabels: Record<string, string> = {
  "live-coding": "Live Coding",
  "system-design": "System Design",
  "phone-screen": "Phone Screen",
  practice: "Practice",
};

export const typeColors: Record<string, string> = {
  "live-coding": "#3b82f6",
  "system-design": "#f59e0b",
  "phone-screen": "#22c55e",
  practice: "#8b5cf6",
};

// ─── Status Labels ──────────────────────────────────────

export const statusLabels: Record<
  string,
  { label: string; variant: BadgeVariant }
> = {
  created: { label: "Oluşturuldu", variant: "default" },
  "in-progress": { label: "Devam Ediyor", variant: "amber" },
  completed: { label: "Tamamlandı", variant: "success" },
  evaluated: { label: "Değerlendirildi", variant: "success" },
};

// ─── Difficulty Config ──────────────────────────────────

export const difficultyLabels: Record<
  string,
  { label: string; variant: BadgeVariant; classes: string }
> = {
  easy: {
    label: "Kolay",
    variant: "success",
    classes: "text-success border-success/30 bg-success/10",
  },
  medium: {
    label: "Orta",
    variant: "amber",
    classes: "text-amber border-amber/30 bg-amber/10",
  },
  hard: {
    label: "Zor",
    variant: "danger",
    classes: "text-danger border-danger/30 bg-danger/10",
  },
};

// ─── Hire Recommendation Labels ─────────────────────────

export const hireLabels: Record<
  HireRecommendation,
  { label: string; variant: BadgeVariant; color: string; bg: string }
> = {
  "strong-hire": {
    label: "Strong Hire",
    variant: "success",
    color: "text-success",
    bg: "bg-success/15 border-success/30",
  },
  hire: {
    label: "Hire",
    variant: "success",
    color: "text-info",
    bg: "bg-info/15 border-info/30",
  },
  "lean-hire": {
    label: "Lean Hire",
    variant: "amber",
    color: "text-amber",
    bg: "bg-amber/15 border-amber/30",
  },
  "no-hire": {
    label: "No Hire",
    variant: "danger",
    color: "text-danger",
    bg: "bg-danger/15 border-danger/30",
  },
};

// ─── Date / Time Formatters ─────────────────────────────

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function formatFullDate(ts: number): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

export function formatDuration(start?: number, end?: number): string {
  if (!start) return "—";
  const endTs = end ?? Date.now();
  const seconds = Math.floor((endTs - start) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}dk ${s}s`;
}
