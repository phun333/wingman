import { useState, useEffect, useRef, useCallback } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Clock, HardDrive, Bot, Mic, MicOff, Volume2, Brain, MessageSquare, Sparkles, Zap, User, GripHorizontal, Hand } from "lucide-react";
import type { Problem } from "@ffh/types";

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
  onStartInterview
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

  // Add messages when processing starts
  useEffect(() => {
    if (currentUserMessage && state === "processing") {
      setMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        type: "user",
        text: currentUserMessage,
        timestamp: Date.now()
      }]);
      setCurrentUserMessage("");
    }
  }, [state, currentUserMessage]);

  // Track AI response
  useEffect(() => {
    if (aiText) {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.type === "ai" && Date.now() - lastMsg.timestamp < 5000) {
          if (lastMsg.text !== aiText) {
            return prev.slice(0, -1).concat({
              ...lastMsg,
              text: aiText
            });
          }
          return prev;
        }

        const isDuplicate = prev.slice(-3).some(msg =>
          msg.type === "ai" && msg.text.trim() === aiText.trim()
        );

        if (isDuplicate) return prev;

        return [...prev, {
          id: `ai-${Date.now()}`,
          type: "ai",
          text: aiText,
          timestamp: Date.now()
        }];
      });
    }
  }, [aiText]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber border-t-transparent" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-text-muted">Problem yükleniyor…</p>
      </div>
    );
  }

  const diff = difficultyConfig[problem.difficulty];
  const visibleTests = problem.testCases.filter((tc) => !tc.isHidden);

  // ─── Resizable splitter between Problem and AI Assistant ───
  const containerRef = useRef<HTMLDivElement>(null);
  const [aiPanelHeight, setAiPanelHeight] = useState(() => {
    try {
      const saved = localStorage.getItem("problemPanel:aiHeight");
      return saved ? Number(saved) : 280;
    } catch { return 280; }
  });
  const draggingRef = useRef(false);

  // Persist height
  useEffect(() => {
    try { localStorage.setItem("problemPanel:aiHeight", String(aiPanelHeight)); } catch {}
  }, [aiPanelHeight]);

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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
      const newHeight = Math.max(160, Math.min(containerH - 120, startHeight + delta));
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
  }, [aiPanelHeight]);

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Problem Content — takes remaining space */}
      <div className="flex-1 min-h-[80px] overflow-y-auto p-5 space-y-4">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-display text-lg font-bold text-text">
              {problem.title}
            </h2>
            <Badge variant={diff.variant}>{diff.label}</Badge>
            <span className="text-xs text-text-muted px-2 py-0.5 rounded bg-surface-raised border border-border">
              {problem.category}
            </span>
          </div>
        </div>

        {/* Description (Markdown) */}
        <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed
          [&_h1]:text-text [&_h2]:text-text [&_h3]:text-text
          [&_strong]:text-text [&_a]:text-amber
          [&_code]:bg-surface-raised [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-amber [&_code]:text-xs [&_code]:font-mono
          [&_pre]:bg-surface-raised [&_pre]:border [&_pre]:border-border-subtle [&_pre]:rounded-lg [&_pre]:p-3
          [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-text-secondary
        ">
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

        {/* Complexity hints - only show if both complexities exist */}
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

      {/* ─── Drag Handle ─── */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className="
          flex-shrink-0 h-2 bg-border-subtle hover:bg-amber/30 active:bg-amber/40
          transition-colors duration-150 cursor-row-resize
          flex items-center justify-center group
        "
      >
        <GripHorizontal size={12} className="text-text-muted/40 group-hover:text-amber/60 transition-colors" />
      </div>

      {/* AI Assistant Section — resizable height */}
      <div
        className="flex-shrink-0 bg-surface-raised/50 overflow-hidden flex flex-col"
        style={{ height: aiPanelHeight }}
      >
        <div className="p-4 flex flex-col h-full">
          {/* AI Header */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-orange flex items-center justify-center shadow">
                <Bot size={16} className="text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-text">AI Asistan</h3>
                <p className="text-[10px] text-text-muted">
                  {state === "speaking" ? "Konuşuyor" :
                   state === "processing" ? "Düşünüyor" :
                   state === "listening" ? "Dinliyor" :
                   connected ? "Hazır" : "Bağlanıyor..."}
                </p>
              </div>
            </div>

            {/* Hint button */}
            {totalHints > 0 && (
              <button
                onClick={onRequestHint}
                className="px-2 py-1 rounded-md bg-amber/10 border border-amber/20 text-amber text-[10px] font-medium hover:bg-amber/15 transition-colors flex items-center gap-1"
              >
                <Sparkles size={10} />
                İpucu ({hintLevel}/{totalHints})
              </button>
            )}
          </div>

          {/* Chat Messages — fills remaining space */}
          <div className="bg-bg/50 rounded-lg border border-border-subtle p-3 mb-3 flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-2">
              <AnimatePresence>
                {messages.slice(-10).map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex gap-2 ${msg.type === "user" ? "justify-end" : ""}`}
                  >
                    {msg.type === "ai" && (
                      <div className="shrink-0 w-6 h-6 rounded bg-amber/20 flex items-center justify-center">
                        <Bot size={12} className="text-amber" />
                      </div>
                    )}

                    <div className={`max-w-[80%] ${msg.type === "user" ? "text-right" : ""}`}>
                      <div className={`
                        px-2 py-1 rounded-lg text-xs
                        ${msg.type === "ai"
                          ? "bg-surface-raised border border-border"
                          : "bg-success/20 border border-success/30"}
                      `}>
                        <p className="text-text">{msg.text}</p>
                      </div>
                    </div>

                    {msg.type === "user" && (
                      <div className="shrink-0 w-6 h-6 rounded bg-success/20 flex items-center justify-center">
                        <User size={12} className="text-success" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>

            {/* Current transcript */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 px-2 py-1 rounded bg-surface-raised/50 border border-border-subtle"
              >
                <p className="text-[10px] text-text-muted">Dinleniyor...</p>
                <p className="text-xs text-text">{transcript}</p>
              </motion.div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3 flex-shrink-0">
            {!voiceStarted ? (
              /* ── Start voice session ── */
              <motion.button
                onClick={onStartVoice}
                disabled={!connected}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full
                  bg-success/15 border-2 border-success/40 text-success
                  hover:bg-success/25 hover:border-success/60
                  transition-all duration-200 cursor-pointer
                  disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={connected ? { scale: 1.03 } : {}}
                whileTap={connected ? { scale: 0.97 } : {}}
              >
                <Volume2 size={16} strokeWidth={2} />
                <span className="text-xs font-medium">Sesli mülakatı başlat</span>
              </motion.button>
            ) : (
              /* ── Mic + interrupt ── */
              <>
                {/* Main Mic Button */}
                <motion.button
                  onClick={onMicClick}
                  disabled={!connected}
                  className={`
                    relative w-14 h-14 rounded-full flex items-center justify-center
                    transition-all duration-300 shadow-lg
                    ${!connected
                      ? "bg-surface-raised border-2 border-border-subtle cursor-not-allowed opacity-50"
                      : micActive
                      ? "bg-gradient-to-br from-success to-emerald shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                      : "bg-surface-raised border-2 border-border hover:border-amber hover:shadow-md"
                    }
                  `}
                  whileHover={connected ? { scale: 1.05 } : {}}
                  whileTap={connected ? { scale: 0.95 } : {}}
                >
                  {!connected ? (
                    <MicOff size={18} className="text-text-muted" />
                  ) : micActive ? (
                    <Mic size={18} className="text-white" />
                  ) : (
                    <MicOff size={18} className="text-text-muted" />
                  )}
                </motion.button>

                {/* Volume indicator */}
                {micActive && (
                  <div className="w-20 h-1 bg-surface-raised rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-success to-amber"
                      style={{ width: `${volume * 100}%` }}
                      transition={{ duration: 0.05 }}
                    />
                  </div>
                )}

                {/* Interrupt button — visible when AI is speaking */}
                <AnimatePresence>
                  {(state === "speaking" || state === "processing") && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      onClick={onInterrupt}
                      className="h-10 px-3 rounded-full flex items-center gap-1.5
                        border-2 border-danger/40 bg-danger/10 text-danger
                        hover:bg-danger/20 hover:border-danger/60
                        transition-colors duration-150 cursor-pointer"
                      title="AI'ı sustur"
                    >
                      <Hand size={14} strokeWidth={2} />
                      <span className="text-[10px] font-medium">Sustur</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Start Interview Button */}
                {interviewStatus === "created" && onStartInterview && (
                  <motion.button
                    onClick={onStartInterview}
                    className="
                      px-4 py-2 rounded-lg
                      bg-gradient-to-r from-green-500 to-emerald-500
                      text-white text-xs font-medium
                      shadow-md hover:shadow-lg
                      transition-all duration-200
                      flex items-center gap-1.5
                    "
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Zap size={12} />
                    Başlat
                  </motion.button>
                )}
              </>
            )}
          </div>

          <p className="text-center text-[10px] text-text-muted mt-2 flex-shrink-0">
            {!voiceStarted
              ? connected
                ? "Mikrofon izni istenecektir"
                : "Bağlantı kuruluyor..."
              : state === "speaking" || state === "processing"
              ? "Konuşarak veya butona tıklayarak susturabilirsiniz"
              : state === "listening"
              ? "Konuşmaya devam edin..."
              : micActive
              ? "Konuşmaya başlayın"
              : "Mikrofon butonuna tıklayın"}
          </p>
        </div>
      </div>
    </div>
  );
}