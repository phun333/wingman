import { useState, useEffect, useRef, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import {
  Clock,
  HardDrive,
  Bot,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Zap,
  User,
  GripHorizontal,
  Hand,
  Send,
  Square,
} from "lucide-react";
import type { Problem, LatencyReport, VoicePipelineState } from "@ffh/types";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: number;
}

interface ProblemPanelProps {
  problem: Problem | null;
  loading?: boolean;
  transcript?: string;
  aiText?: string;
  micActive?: boolean;
  state?: "idle" | "listening" | "processing" | "speaking";
  volume?: number;
  onMicClick?: () => void;
  connected?: boolean;
  voiceStarted?: boolean;
  onStartVoice?: () => void;
  onInterrupt?: () => void;
  hintLevel?: number;
  totalHints?: number;
  onRequestHint?: () => void;
  interviewStatus?: "created" | "in-progress" | "completed" | "abandoned" | "evaluated";
  onStartInterview?: () => void;
  latency?: LatencyReport | null;
  latencyHistory?: number[];
}

const difficultyConfig = {
  easy: { label: "Kolay", variant: "success" as const },
  medium: { label: "Orta", variant: "amber" as const },
  hard: { label: "Zor", variant: "danger" as const },
};

export function ProblemPanel({
  problem,
  loading,
  transcript = "",
  aiText = "",
  micActive = false,
  state = "idle",
  volume = 0,
  onMicClick,
  connected = false,
  voiceStarted = false,
  onStartVoice,
  onInterrupt,
  hintLevel = 0,
  totalHints = 0,
  onRequestHint,
  interviewStatus,
  onStartInterview,
  latency = null,
  latencyHistory = [],
}: ProblemPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserMessage, setCurrentUserMessage] = useState<string>("");

  // Track user speech
  useEffect(() => {
    if (transcript !== currentUserMessage) {
      setCurrentUserMessage(transcript);
    }
  }, [transcript]);

  // Add user message when processing starts (PTT: user pressed stop)
  useEffect(() => {
    if (currentUserMessage && state === "processing") {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          type: "user",
          text: currentUserMessage,
          timestamp: Date.now(),
        },
      ]);
      setCurrentUserMessage("");
    }
  }, [state, currentUserMessage]);

  // Track AI response
  useEffect(() => {
    if (aiText) {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.type === "ai" && Date.now() - lastMsg.timestamp < 5000) {
          if (lastMsg.text !== aiText) {
            return prev.slice(0, -1).concat({ ...lastMsg, text: aiText });
          }
          return prev;
        }
        const isDuplicate = prev
          .slice(-3)
          .some((msg) => msg.type === "ai" && msg.text.trim() === aiText.trim());
        if (isDuplicate) return prev;
        return [
          ...prev,
          { id: `ai-${Date.now()}`, type: "ai", text: aiText, timestamp: Date.now() },
        ];
      });
    }
  }, [aiText]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  // ─── Resizable splitter ───
  const containerRef = useRef<HTMLDivElement>(null);
  const [aiPanelHeight, setAiPanelHeight] = useState(() => {
    try {
      const saved = localStorage.getItem("problemPanel:aiHeight");
      return saved ? Number(saved) : 320;
    } catch {
      return 320;
    }
  });
  const draggingRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem("problemPanel:aiHeight", String(aiPanelHeight));
    } catch {}
  }, [aiPanelHeight]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      const getY = (ev: MouseEvent | TouchEvent) =>
        "touches" in ev ? ev.touches[0]!.clientY : ev.clientY;

      const startY = "touches" in e ? e.touches[0]!.clientY : e.clientY;
      const startHeight = aiPanelHeight;

      const onMove = (ev: MouseEvent | TouchEvent) => {
        if (!draggingRef.current || !containerRef.current) return;
        const containerH = containerRef.current.getBoundingClientRect().height;
        const delta = startY - getY(ev);
        const newHeight = Math.max(200, Math.min(containerH - 120, startHeight + delta));
        setAiPanelHeight(newHeight);
      };

      const onEnd = () => {
        draggingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd);
    },
    [aiPanelHeight],
  );

  // ─── Loading / empty ───
  if (loading || !problem) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-text">Soru hazırlanıyor…</p>
            <p className="text-xs text-text-muted mt-1">Kod şablonları ve test case'ler yükleniyor</p>
          </div>
        </div>
      </div>
    );
  }

  const diff = difficultyConfig[problem.difficulty];
  const visibleTests = problem.testCases.filter((tc) => !tc.isHidden);

  // ─── PTT button state ───
  const isRecording = micActive && state === "listening";
  const isProcessing = state === "processing";
  const isSpeaking = state === "speaking";
  const isBusy = isProcessing || isSpeaking;

  // ─── Latency stats ───
  const latencyStats = latencyHistory.length > 0
    ? {
        avg: Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length),
        best: Math.min(...latencyHistory),
        count: latencyHistory.length,
      }
    : null;

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* ═══ Problem Content ═══ */}
      <div className="flex-1 min-h-[80px] overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-display text-lg font-bold text-text">{problem.title}</h2>
            <Badge variant={diff.variant}>{diff.label}</Badge>
            <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface-raised border border-border">
              {problem.category}
            </span>
          </div>
        </div>

        {/* Description (Markdown) */}
        <div
          className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed
          [&_h1]:text-text [&_h2]:text-text [&_h3]:text-text
          [&_strong]:text-text [&_a]:text-amber
          [&_code]:bg-surface-raised [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-amber [&_code]:text-xs [&_code]:font-mono
          [&_pre]:bg-surface-raised [&_pre]:border [&_pre]:border-border-subtle [&_pre]:rounded-lg [&_pre]:p-3
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-text-secondary"
        >
          <Markdown remarkPlugins={[remarkGfm]}>{problem.description}</Markdown>
        </div>

        {/* Test Cases */}
        {visibleTests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
              Örnekler
            </h3>
            <div className="space-y-2">
              {visibleTests.map((tc, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-border-subtle bg-surface-raised p-3 text-sm font-mono"
                >
                  <div className="mb-1">
                    <span className="text-text-muted text-xs">Girdi: </span>
                    <span className="text-text">{tc.input}</span>
                  </div>
                  <div>
                    <span className="text-text-muted text-xs">Çıktı: </span>
                    <span className="text-success">{tc.expectedOutput}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complexity hints */}
        {problem.timeComplexity && problem.spaceComplexity && (
          <div className="border-t border-border-subtle pt-3">
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
              Beklenen Karmaşıklık
            </h3>
            <div className="flex gap-4 text-xs">
              <span className="text-text-secondary flex items-center gap-1">
                <Clock size={11} />
                Zaman: <span className="text-text font-mono">{problem.timeComplexity}</span>
              </span>
              <span className="text-text-secondary flex items-center gap-1">
                <HardDrive size={11} />
                Alan: <span className="text-text font-mono">{problem.spaceComplexity}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Drag Handle ═══ */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="flex-shrink-0 h-2 bg-border-subtle hover:bg-amber/30 active:bg-amber/40
          transition-colors duration-150 cursor-row-resize
          flex items-center justify-center group"
      >
        <GripHorizontal
          size={12}
          className="text-text-muted/40 group-hover:text-amber/60 transition-colors"
        />
      </div>

      {/* ═══ AI Chat + PTT Section ═══ */}
      <div
        className="flex-shrink-0 bg-surface-raised/50 overflow-hidden flex flex-col"
        style={{ height: aiPanelHeight }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber to-orange flex items-center justify-center shadow">
              <Bot size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs text-text">AI Mülakatçı</h3>
              <p className="text-[10px] text-text-muted">
                {isSpeaking
                  ? "Konuşuyor…"
                  : isProcessing
                    ? "Düşünüyor…"
                    : isRecording
                      ? "Dinliyor…"
                      : connected
                        ? "Hazır"
                        : "Bağlanıyor…"}
              </p>
            </div>
          </div>

          {/* Hint button */}
          {totalHints > 0 && (
            <button
              onClick={onRequestHint}
              disabled={isBusy}
              className="px-2 py-1 rounded-md bg-amber/10 border border-amber/20 text-amber text-[10px] font-medium
                hover:bg-amber/15 transition-colors flex items-center gap-1 cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={10} />
              İpucu ({hintLevel}/{totalHints})
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
          <div className="space-y-2.5">
            {!voiceStarted && messages.length === 0 && (
              <div className="flex items-center justify-center h-full min-h-[80px]">
                <p className="text-xs text-text-muted/60 text-center">
                  Başla butonuna tıklayarak mülakatı başlatın
                </p>
              </div>
            )}

            <AnimatePresence>
              {messages.slice(-15).map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-2 ${msg.type === "user" ? "justify-end" : ""}`}
                >
                  {msg.type === "ai" && (
                    <div className="shrink-0 w-6 h-6 rounded-md bg-amber/15 flex items-center justify-center mt-0.5">
                      <Bot size={12} className="text-amber" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.type === "user" ? "text-right" : ""}`}>
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs leading-relaxed ${
                        msg.type === "ai"
                          ? "bg-surface border border-border-subtle text-text-secondary"
                          : "bg-success/15 border border-success/25 text-text"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                  {msg.type === "user" && (
                    <div className="shrink-0 w-6 h-6 rounded-md bg-success/15 flex items-center justify-center mt-0.5">
                      <User size={12} className="text-success" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Live transcript while recording */}
            {isRecording && transcript && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 justify-end"
              >
                <div className="max-w-[85%] text-right">
                  <div className="px-3 py-1.5 rounded-xl text-xs bg-success/10 border border-success/20 border-dashed text-text-muted">
                    {transcript}
                    <span className="inline-block w-1 h-3 bg-success/60 ml-0.5 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2"
              >
                <div className="shrink-0 w-6 h-6 rounded-md bg-amber/15 flex items-center justify-center">
                  <Bot size={12} className="text-amber" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-amber/60"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={scrollRef} />
          </div>
        </div>

        {/* ═══ Latency Display ═══ */}
        <AnimatePresence>
          {latency && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-shrink-0 border-t border-border-subtle/30 px-4 overflow-hidden"
            >
              <LatencyBar latency={latency} latencyHistory={latencyHistory} state={state} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ PTT Controls ═══ */}
        <div className="flex-shrink-0 border-t border-border-subtle/50 px-4 py-3">
          {!voiceStarted ? (
            /* ── Start Button ── */
            <div className="flex flex-col items-center gap-2">
              <motion.button
                onClick={onStartVoice}
                disabled={!connected}
                className="flex items-center gap-2.5 px-6 py-2.5 rounded-full
                  bg-gradient-to-r from-success/20 to-emerald-500/20
                  border-2 border-success/40 text-success
                  hover:border-success/60 hover:from-success/30 hover:to-emerald-500/30
                  hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]
                  transition-all duration-200 cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={connected ? { scale: 1.02 } : {}}
                whileTap={connected ? { scale: 0.97 } : {}}
              >
                <Volume2 size={18} strokeWidth={2} />
                <span className="text-sm font-semibold">Başla</span>
              </motion.button>
              <p className="text-[10px] text-text-muted">
                {connected ? "Mikrofon izni istenecektir" : "Bağlantı kuruluyor…"}
              </p>
            </div>
          ) : (
            /* ── PTT Button + Controls ── */
            <div className="flex items-center gap-3">
              {/* PTT Button */}
              <div className="flex-1 flex justify-center">
                <div className="relative">
                  {/* Volume ring when recording */}
                  {isRecording && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-success/15 pointer-events-none"
                      animate={{ scale: 1 + volume * 5, opacity: 0.3 + volume * 2 }}
                      transition={{ duration: 0.08 }}
                      style={{ margin: -6 }}
                    />
                  )}

                  <motion.button
                    onClick={() => {
                      // Always use onMicClick — it handles interrupt + start recording
                      // for speaking/processing state, and normal toggle for idle
                      onMicClick?.();
                    }}
                    disabled={!connected}
                    className={`
                      relative flex items-center gap-2 px-5 py-2.5 rounded-full
                      font-medium text-sm transition-all duration-200 cursor-pointer
                      disabled:opacity-40 disabled:cursor-not-allowed
                      ${
                        isSpeaking || isProcessing
                          ? "bg-danger/15 border-2 border-danger/40 text-danger hover:bg-danger/25"
                          : isRecording
                            ? "bg-success/20 border-2 border-success shadow-[0_0_20px_rgba(34,197,94,0.2)] text-success"
                            : "bg-surface border-2 border-border hover:border-amber/50 text-text-secondary hover:text-amber"
                      }
                    `}
                    whileTap={connected ? { scale: 0.96 } : {}}
                  >
                    {isSpeaking || isProcessing ? (
                      <>
                        <Hand size={16} strokeWidth={2} />
                        <span>Sustur</span>
                      </>
                    ) : isRecording ? (
                      <>
                        <Send size={16} strokeWidth={2} />
                        <span>Gönder</span>
                      </>
                    ) : (
                      <>
                        <Mic size={16} strokeWidth={2} />
                        <span>Bas ve Konuş</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Volume bar when recording */}
              {isRecording && (
                <div className="w-16">
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-success/60 to-success rounded-full"
                      style={{ width: `${Math.min(volume * 100, 100)}%` }}
                      transition={{ duration: 0.05 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Latency Bar (inline in PTT panel) ─────────────────

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

type Tier = "fast" | "ok" | "slow";
function getTier(ms: number): Tier {
  if (ms < 400) return "fast";
  if (ms <= 800) return "ok";
  return "slow";
}

const tierColor: Record<Tier, string> = {
  fast: "text-emerald-400",
  ok: "text-amber-400",
  slow: "text-rose-400",
};
const tierBg: Record<Tier, string> = {
  fast: "bg-emerald-400",
  ok: "bg-amber-400",
  slow: "bg-rose-400",
};

function LatencyBar({
  latency,
  latencyHistory,
  state,
}: {
  latency: LatencyReport;
  latencyHistory: number[];
  state: string;
}) {
  const stages = [
    { key: "stt", label: "STT", icon: "🎤", ms: latency.sttMs },
    { key: "llm", label: "LLM", icon: "🧠", ms: latency.llmFirstTokenMs },
    { key: "tts", label: "TTS", icon: "🔊", ms: latency.ttsFirstChunkMs },
  ];

  const avg =
    latencyHistory.length > 0
      ? Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length)
      : null;

  return (
    <div className="py-2 space-y-1.5">
      {/* Stage chips */}
      <div className="flex items-center gap-1.5">
        {stages.map((s, i) => {
          const tier = getTier(s.ms);
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-text-muted/20 text-[10px]">→</span>}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border-subtle/50">
                <span className="text-[10px]">{s.icon}</span>
                <span className={`text-[10px] font-mono font-semibold tabular-nums ${tierColor[tier]}`}>
                  {formatMs(s.ms)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Total */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber/10 border border-amber/20">
          <span className="text-[10px]">⚡</span>
          <span className={`text-[10px] font-mono font-bold tabular-nums ${tierColor[getTier(latency.totalMs / 3)]}`}>
            {formatMs(latency.totalMs)}
          </span>
        </div>
      </div>

      {/* Proportional bar */}
      <div className="flex h-1 rounded-full overflow-hidden bg-white/[0.03] gap-px">
        {stages.map((s) => {
          const pct = latency.totalMs > 0 ? (s.ms / latency.totalMs) * 100 : 33;
          const tier = getTier(s.ms);
          return (
            <motion.div
              key={s.key}
              className={`h-full ${tierBg[tier]} rounded-full opacity-60`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          );
        })}
      </div>

      {/* Avg */}
      {avg && (
        <p className="text-[9px] font-mono text-text-muted/50 text-right">
          son {latencyHistory.length} ort: {formatMs(avg)}
        </p>
      )}
    </div>
  );
}
