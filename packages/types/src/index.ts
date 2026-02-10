// ─── API Response ────────────────────────────────────────

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ─── Interview ───────────────────────────────────────────

export type InterviewType =
  | "live-coding"
  | "system-design"
  | "phone-screen"
  | "practice";

export type InterviewStatus =
  | "created"
  | "in-progress"
  | "completed"
  | "evaluated";

export type Difficulty = "easy" | "medium" | "hard";

// ─── Chat / Voice ────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export type VoicePipelineState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking";
