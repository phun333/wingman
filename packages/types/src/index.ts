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

export interface Interview {
  _id: string;
  userId: string;
  type: InterviewType;
  status: InterviewStatus;
  difficulty: Difficulty;
  language: string;
  questionCount: number;
  config?: unknown;
  startedAt?: number;
  endedAt?: number;
  createdAt: number;
}

export interface Message {
  _id: string;
  interviewId: string;
  role: MessageRole;
  content: string;
  audioUrl?: string;
  timestamp: number;
}

export interface InterviewStats {
  total: number;
  completed: number;
  thisWeek: number;
}

// ─── Chat / Voice ────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export type VoicePipelineState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking";

// ─── WebSocket Protocol ──────────────────────────────────

/** Client → Server */
export type ClientMessage =
  | { type: "audio_chunk"; data: string }
  | { type: "start_listening" }
  | { type: "stop_listening" }
  | { type: "interrupt" }
  | { type: "config"; language?: string; speed?: number };

/** Server → Client */
export type ServerMessage =
  | { type: "transcript"; text: string; final: boolean }
  | { type: "ai_text"; text: string; done: boolean }
  | { type: "ai_audio"; data: string }
  | { type: "ai_audio_done" }
  | { type: "state_change"; state: VoicePipelineState }
  | { type: "error"; message: string };
