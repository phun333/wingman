import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Mic, Brain, Volume2, ChevronDown, Activity } from "lucide-react";
import type { LatencyReport, VoicePipelineState } from "@ffh/types";

// ─── Types ───────────────────────────────────────────────

interface LatencyPipelineProps {
  latency: LatencyReport | null;
  latencyHistory: number[];
  state: VoicePipelineState;
}

// ─── Color helpers ───────────────────────────────────────

type LatencyTier = "fast" | "ok" | "slow";

function getTier(ms: number): LatencyTier {
  if (ms < 400) return "fast";
  if (ms <= 800) return "ok";
  return "slow";
}

const tierColors: Record<LatencyTier, { dot: string; bar: string; text: string; glow: string }> = {
  fast: {
    dot: "bg-emerald-400",
    bar: "from-emerald-500/80 to-emerald-400/60",
    text: "text-emerald-400",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.3)]",
  },
  ok: {
    dot: "bg-amber-400",
    bar: "from-amber-500/80 to-amber-400/60",
    text: "text-amber-400",
    glow: "shadow-[0_0_8px_rgba(251,191,36,0.3)]",
  },
  slow: {
    dot: "bg-rose-400",
    bar: "from-rose-500/80 to-rose-400/60",
    text: "text-rose-400",
    glow: "shadow-[0_0_8px_rgba(251,113,133,0.3)]",
  },
};

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

// ─── Pipeline Stages ─────────────────────────────────────

interface StageConfig {
  key: string;
  icon: typeof Mic;
  label: string;
  shortLabel: string;
}

const stages: StageConfig[] = [
  { key: "stt", icon: Mic, label: "STT", shortLabel: "🎤" },
  { key: "llm", icon: Brain, label: "LLM (TTFT)", shortLabel: "🧠" },
  { key: "tts", icon: Volume2, label: "TTS (TTFB)", shortLabel: "🔊" },
];

// ─── Component ───────────────────────────────────────────

export function LatencyPipeline({ latency, latencyHistory, state }: LatencyPipelineProps) {
  const [expanded, setExpanded] = useState(false);

  const stageValues = useMemo(() => {
    if (!latency) return null;
    return [
      { ...stages[0]!, ms: latency.sttMs },
      { ...stages[1]!, ms: latency.llmFirstTokenMs },
      { ...stages[2]!, ms: latency.ttsFirstChunkMs },
    ];
  }, [latency]);

  const stats = useMemo(() => {
    if (latencyHistory.length === 0) return null;
    const avg = Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length);
    const best = Math.min(...latencyHistory);
    return { avg, best, count: latencyHistory.length };
  }, [latencyHistory]);

  const totalTier = latency ? getTier(latency.totalMs / 3) : "ok"; // Use per-stage average for total color

  // Pulse animation for active pipeline stage
  const isPulsing = state === "processing" || state === "speaking";

  // Don't render anything if no data and pipeline hasn't started
  if (!latency && !isPulsing) return null;

  return (
    <div className="relative">
      {/* ── Compact Mode (always visible) ── */}
      <motion.button
        onClick={() => setExpanded(!expanded)}
        className={`
          flex items-center gap-2 px-2.5 py-1.5 rounded-lg
          border transition-all duration-200 cursor-pointer select-none
          ${latency
            ? "border-border/50 bg-surface-raised/60 hover:bg-surface-raised hover:border-border"
            : "border-border/30 bg-surface-raised/30"
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Lightning icon */}
        <Zap
          size={12}
          className={`${latency ? "text-amber" : "text-text-muted/40"} shrink-0`}
          strokeWidth={2.5}
          fill={latency ? "currentColor" : "none"}
        />

        {/* Total latency or placeholder */}
        {latency ? (
          <span className={`text-xs font-mono font-semibold tabular-nums ${tierColors[getTier(latency.totalMs / 3)].text}`}>
            {formatMs(latency.totalMs)}
          </span>
        ) : (
          <span className="text-[11px] font-mono text-text-muted/40">--</span>
        )}

        {/* Stage indicator dots */}
        <div className="flex items-center gap-0.5">
          {stages.map((stage, i) => {
            const stageMs = stageValues ? stageValues[i]!.ms : 0;
            const tier = stageMs > 0 ? getTier(stageMs) : "ok";
            const isActiveStage =
              (state === "processing" && stage.key === "stt") ||
              (state === "processing" && stage.key === "llm") ||
              (state === "speaking" && stage.key === "tts");

            return (
              <div key={stage.key} className="flex items-center">
                {i > 0 && (
                  <div className="w-1.5 h-px bg-text-muted/15 mx-px" />
                )}
                <motion.div
                  className={`w-1.5 h-1.5 rounded-full ${
                    stageMs > 0
                      ? tierColors[tier].dot
                      : isActiveStage
                        ? "bg-amber/60"
                        : "bg-text-muted/20"
                  }`}
                  animate={
                    isActiveStage && !latency
                      ? { opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }
                      : { opacity: 1, scale: 1 }
                  }
                  transition={
                    isActiveStage && !latency
                      ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.3 }
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Expand chevron */}
        {latency && (
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={10} className="text-text-muted/40" />
          </motion.div>
        )}
      </motion.button>

      {/* ── Expanded Panel ── */}
      <AnimatePresence>
        {expanded && latency && stageValues && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-full right-0 mt-2 z-50 w-[320px]
              rounded-xl border border-border/60 bg-[#0f1117]/95 backdrop-blur-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.05)]
              overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-amber" strokeWidth={2.5} />
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-text-secondary">
                  Pipeline Performansı
                </span>
              </div>
              <span className={`text-xs font-mono font-bold tabular-nums ${tierColors[totalTier].text}`}>
                {formatMs(latency.totalMs)}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mx-3" />

            {/* Stage bars */}
            <div className="px-4 py-3 space-y-2.5">
              {stageValues.map((stage, i) => {
                const tier = getTier(stage.ms);
                const colors = tierColors[tier];
                const widthPercent = latency.totalMs > 0
                  ? Math.max(8, (stage.ms / latency.totalMs) * 100)
                  : 33;

                const isActiveStage =
                  (state === "processing" && (stage.key === "stt" || stage.key === "llm")) ||
                  (state === "speaking" && stage.key === "tts");

                const Icon = stage.icon;

                return (
                  <div key={stage.key} className="space-y-1">
                    {/* Label row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon size={11} className={colors.text} strokeWidth={2} />
                        <span className="text-[11px] font-mono text-text-muted">
                          {stage.label}
                        </span>
                      </div>
                      <span className={`text-[11px] font-mono font-semibold tabular-nums ${colors.text}`}>
                        {formatMs(stage.ms)}
                      </span>
                    </div>

                    {/* Bar */}
                    <div className="h-[6px] rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
                      >
                        {isActiveStage && (
                          <motion.div
                            className="h-full w-full rounded-full bg-white/20"
                            animate={{ opacity: [0, 0.3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mx-3" />

            {/* Total bar */}
            <div className="px-4 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Zap size={11} className="text-amber" strokeWidth={2.5} fill="currentColor" />
                  <span className="text-[11px] font-mono font-medium text-text-secondary">
                    Toplam E2E
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold tabular-nums ${tierColors[totalTier].text}`}>
                  {formatMs(latency.totalMs)}
                </span>
              </div>
              <div className="h-[6px] rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber/60 to-amber/40"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
                />
              </div>
            </div>

            {/* Stats footer */}
            {stats && (
              <>
                <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mx-3" />
                <div className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-muted/50 font-mono">📊</span>
                    <span className="text-[10px] text-text-muted font-mono">
                      Son {stats.count} ort:
                    </span>
                    <span className={`text-[10px] font-mono font-semibold tabular-nums ${tierColors[getTier(stats.avg / 3)].text}`}>
                      {formatMs(stats.avg)}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-border/30" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-muted font-mono">
                      En iyi:
                    </span>
                    <span className={`text-[10px] font-mono font-semibold tabular-nums ${tierColors[getTier(stats.best / 3)].text}`}>
                      {formatMs(stats.best)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
