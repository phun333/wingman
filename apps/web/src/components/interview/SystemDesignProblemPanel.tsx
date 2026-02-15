import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import {
  Building2,
  Lightbulb,
  Bot,
  Mic,
  User,
  GripHorizontal,
  Hand,
  Send,
  Volume2,
} from "lucide-react";
import type { DesignProblem, LatencyReport } from "@ffh/types";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: number;
}

interface SystemDesignProblemPanelProps {
  problem: DesignProblem | null;
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

export function SystemDesignProblemPanel({
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
  interviewStatus,
  onStartInterview,
  latency = null,
  latencyHistory = [],
}: SystemDesignProblemPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserMessage, setCurrentUserMessage] = useState("");

  useEffect(() => {
    if (transcript !== currentUserMessage) setCurrentUserMessage(transcript);
  }, [transcript]);

  useEffect(() => {
    if (currentUserMessage && state === "processing") {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, type: "user", text: currentUserMessage, timestamp: Date.now() },
      ]);
      setCurrentUserMessage("");
    }
  }, [state, currentUserMessage]);

  useEffect(() => {
    if (aiText) {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.type === "ai" && Date.now() - lastMsg.timestamp < 5000) {
          if (lastMsg.text !== aiText) return prev.slice(0, -1).concat({ ...lastMsg, text: aiText });
          return prev;
        }
        if (prev.slice(-3).some((m) => m.type === "ai" && m.text.trim() === aiText.trim())) return prev;
        return [...prev, { id: `ai-${Date.now()}`, type: "ai", text: aiText, timestamp: Date.now() }];
      });
    }
  }, [aiText]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  // Resizable splitter
  const containerRef = useRef<HTMLDivElement>(null);
  const [aiPanelHeight, setAiPanelHeight] = useState(() => {
    try {
      const saved = localStorage.getItem("sdPanel:aiHeight");
      return saved ? Number(saved) : 320;
    } catch { return 320; }
  });
  const draggingRef = useRef(false);

  useEffect(() => {
    try { localStorage.setItem("sdPanel:aiHeight", String(aiPanelHeight)); } catch {}
  }, [aiPanelHeight]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      const getY = (ev: MouseEvent | TouchEvent) => "touches" in ev ? ev.touches[0]!.clientY : ev.clientY;
      const startY = "touches" in e ? e.touches[0]!.clientY : e.clientY;
      const startHeight = aiPanelHeight;
      const onMove = (ev: MouseEvent | TouchEvent) => {
        if (!draggingRef.current || !containerRef.current) return;
        const containerH = containerRef.current.getBoundingClientRect().height;
        setAiPanelHeight(Math.max(200, Math.min(containerH - 120, startHeight + (startY - getY(ev)))));
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

  const isRecording = micActive && state === "listening";
  const isProcessing = state === "processing";
  const isSpeaking = state === "speaking";
  const isBusy = isProcessing || isSpeaking;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <Building2 size={36} className="text-text-muted mx-auto" strokeWidth={1.2} />
          <p className="mt-3 text-sm text-text-muted">AI mülakatçı size bir sistem tasarımı sorusu soracak.</p>
          <p className="mt-1 text-xs text-text-muted/60">Sağdaki whiteboard'u kullanarak tasarımınızı çizin.</p>
        </div>
      </div>
    );
  }

  const diff = difficultyConfig[problem.difficulty];

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* ═══ Problem Content ═══ */}
      <div className="flex-1 min-h-[80px] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-surface/95 backdrop-blur-sm border-b border-border-subtle px-5 py-4 z-10">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={18} className="text-amber" strokeWidth={1.8} />
            <h2 className="font-display font-bold text-text text-base">{problem.title}</h2>
          </div>
          <Badge variant={diff.variant}>{diff.label}</Badge>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-text-secondary leading-relaxed">{problem.description}</p>

          <div>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Fonksiyonel Gereksinimler</h3>
            <ul className="space-y-1.5">
              {problem.requirements.functional.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-success mt-0.5 shrink-0">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Non-Fonksiyonel Gereksinimler</h3>
            <ul className="space-y-1.5">
              {problem.requirements.nonFunctional.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                  <span className="text-amber mt-0.5 shrink-0">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <details className="group">
            <summary className="text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors select-none flex items-center gap-1.5">
              <Lightbulb size={12} />
              Tartışma Noktaları
              <span className="ml-1 text-text-muted/50 group-open:hidden">(göster)</span>
            </summary>
            <ul className="mt-2 space-y-1.5">
              {problem.discussionPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                  <span className="text-info mt-0.5 shrink-0">?</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>

      {/* ═══ Drag Handle ═══ */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="flex-shrink-0 h-2 bg-border-subtle hover:bg-amber/30 active:bg-amber/40
          transition-colors duration-150 cursor-row-resize flex items-center justify-center group"
      >
        <GripHorizontal size={12} className="text-text-muted/40 group-hover:text-amber/60 transition-colors" />
      </div>

      {/* ═══ AI Chat + PTT Section ═══ */}
      <div className="flex-shrink-0 bg-surface-raised/50 overflow-hidden flex flex-col" style={{ height: aiPanelHeight }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber to-orange flex items-center justify-center shadow">
              <Bot size={14} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs text-text">AI Mülakatçı</h3>
              <p className="text-[10px] text-text-muted">
                {isSpeaking ? "Konuşuyor…" : isProcessing ? "Düşünüyor…" : isRecording ? "Dinliyor…" : connected ? "Hazır" : "Bağlanıyor…"}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
          <div className="space-y-2.5">
            {!voiceStarted && messages.length === 0 && (
              <div className="flex items-center justify-center h-full min-h-[80px]">
                <p className="text-xs text-text-muted/60 text-center">Başla butonuna tıklayarak mülakatı başlatın</p>
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
                    <div className={`px-3 py-1.5 rounded-xl text-xs leading-relaxed ${
                      msg.type === "ai"
                        ? "bg-surface border border-border-subtle text-text-secondary"
                        : "bg-success/15 border border-success/25 text-text"
                    }`}>
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

            {isRecording && transcript && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-end">
                <div className="max-w-[85%] text-right">
                  <div className="px-3 py-1.5 rounded-xl text-xs bg-success/10 border border-success/20 border-dashed text-text-muted">
                    {transcript}
                    <span className="inline-block w-1 h-3 bg-success/60 ml-0.5 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
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

        {/* Latency */}
        <AnimatePresence>
          {latency && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-shrink-0 border-t border-border-subtle/30 px-4 overflow-hidden"
            >
              <LatencyBar latency={latency} latencyHistory={latencyHistory} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* PTT Controls */}
        <div className="flex-shrink-0 border-t border-border-subtle/50 px-4 py-3">
          {!voiceStarted ? (
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
              <p className="text-[10px] text-text-muted">{connected ? "Mikrofon izni istenecektir" : "Bağlantı kuruluyor…"}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex justify-center">
                <div className="relative">
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
                      onMicClick?.();
                    }}
                    disabled={!connected}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSpeaking || isProcessing
                        ? "bg-danger/15 border-2 border-danger/40 text-danger hover:bg-danger/25"
                        : isRecording
                          ? "bg-success/20 border-2 border-success shadow-[0_0_20px_rgba(34,197,94,0.2)] text-success"
                          : "bg-surface border-2 border-border hover:border-amber/50 text-text-secondary hover:text-amber"
                    }`}
                    whileTap={connected ? { scale: 0.96 } : {}}
                  >
                    {isSpeaking || isProcessing ? (
                      <><Hand size={16} strokeWidth={2} /><span>Sustur</span></>
                    ) : isRecording ? (
                      <><Send size={16} strokeWidth={2} /><span>Gönder</span></>
                    ) : (
                      <><Mic size={16} strokeWidth={2} /><span>Bas ve Konuş</span></>
                    )}
                  </motion.button>
                </div>
              </div>
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

// ─── Latency Bar (same as ProblemPanel) ─────────────────

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

const tierColor: Record<Tier, string> = { fast: "text-emerald-400", ok: "text-amber-400", slow: "text-rose-400" };
const tierBg: Record<Tier, string> = { fast: "bg-emerald-400", ok: "bg-amber-400", slow: "bg-rose-400" };

function LatencyBar({ latency, latencyHistory }: { latency: LatencyReport; latencyHistory: number[] }) {
  const stages = [
    { key: "stt", icon: "🎤", ms: latency.sttMs },
    { key: "llm", icon: "🧠", ms: latency.llmFirstTokenMs },
    { key: "tts", icon: "🔊", ms: latency.ttsFirstChunkMs },
  ];
  const avg = latencyHistory.length > 0
    ? Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length)
    : null;

  return (
    <div className="py-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        {stages.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-text-muted/20 text-[10px]">→</span>}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface border border-border-subtle/50">
              <span className="text-[10px]">{s.icon}</span>
              <span className={`text-[10px] font-mono font-semibold tabular-nums ${tierColor[getTier(s.ms)]}`}>{formatMs(s.ms)}</span>
            </div>
          </div>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber/10 border border-amber/20">
          <span className="text-[10px]">⚡</span>
          <span className={`text-[10px] font-mono font-bold tabular-nums ${tierColor[getTier(latency.totalMs / 3)]}`}>{formatMs(latency.totalMs)}</span>
        </div>
      </div>
      <div className="flex h-1 rounded-full overflow-hidden bg-white/[0.03] gap-px">
        {stages.map((s) => (
          <motion.div
            key={s.key}
            className={`h-full ${tierBg[getTier(s.ms)]} rounded-full opacity-60`}
            initial={{ width: 0 }}
            animate={{ width: `${latency.totalMs > 0 ? (s.ms / latency.totalMs) * 100 : 33}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        ))}
      </div>
      {avg && <p className="text-[9px] font-mono text-text-muted/50 text-right">son {latencyHistory.length} ort: {formatMs(avg)}</p>}
    </div>
  );
}
