import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useVoice } from "@/lib/useVoice";
import type { VoicePipelineState } from "@ffh/types";

const stateLabels: Record<VoicePipelineState, string> = {
  idle: "Hazır",
  listening: "Dinliyor…",
  processing: "Düşünüyor…",
  speaking: "Konuşuyor…",
};

export function InterviewRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    state,
    micActive,
    volume,
    transcript,
    aiText,
    error,
    connected,
    toggleMic,
    interrupt,
  } = useVoice();

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function handleEnd() {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate("/");
  }

  function handleMicClick() {
    // If AI is speaking/processing, interrupt first
    if (state === "speaking" || state === "processing") {
      interrupt();
      return;
    }
    toggleMic();
  }

  // Dynamic orb scale based on voice volume or AI state
  const orbScale =
    state === "listening"
      ? 1 + Math.min(volume * 8, 0.2)
      : state === "speaking"
        ? undefined // uses animation
        : 1;

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface/80 backdrop-blur-sm px-5">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-amber/15 flex items-center justify-center">
            <span className="text-amber font-display text-xs font-bold">F</span>
          </div>
          <span className="text-sm font-medium text-text-secondary">
            Mülakat #{id?.slice(0, 6) ?? "demo"}
          </span>
          {/* Connection indicator */}
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-danger animate-pulse"}`}
            title={connected ? "Bağlı" : "Bağlantı yok"}
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-text-muted tabular-nums">
            {formatTime(elapsed)}
          </span>
          <Button variant="danger" size="sm" onClick={handleEnd}>
            Bitir
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
              rounded-full blur-[150px] transition-all duration-1000
              ${state === "speaking" ? "h-[600px] w-[600px] bg-info/8" : ""}
              ${state === "listening" ? "h-[500px] w-[500px] bg-success/6" : ""}
              ${state === "processing" ? "h-[550px] w-[550px] bg-amber/6" : ""}
              ${state === "idle" ? "h-[400px] w-[400px] bg-surface-raised/50" : ""}
            `}
          />
        </div>

        {/* AI Orb */}
        <motion.div
          animate={
            state === "speaking"
              ? { scale: [1, 1.08, 1] }
              : state === "processing"
                ? { scale: [1, 1.04, 1] }
                : { scale: orbScale }
          }
          transition={
            state === "speaking"
              ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
              : state === "processing"
                ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.1 }
          }
          className="relative z-10"
        >
          <div
            className={`
              h-32 w-32 rounded-full border-2 flex items-center justify-center
              transition-all duration-500
              ${state === "idle" ? "border-border bg-surface-raised" : ""}
              ${state === "listening" ? "border-success/40 bg-success/5 shadow-[0_0_40px_rgba(34,197,94,0.15)]" : ""}
              ${state === "processing" ? "border-amber/40 bg-amber/5 glow-amber" : ""}
              ${state === "speaking" ? "border-info/40 bg-info/5 shadow-[0_0_40px_rgba(59,130,246,0.2)]" : ""}
            `}
          >
            <span className="font-display text-5xl font-bold text-amber/80">
              F
            </span>
          </div>
        </motion.div>

        {/* State label */}
        <div className="relative z-10 mt-6 flex items-center gap-2">
          <span
            className={`
              h-2 w-2 rounded-full
              ${state === "idle" ? "bg-text-muted" : ""}
              ${state === "listening" ? "bg-success animate-pulse" : ""}
              ${state === "processing" ? "bg-amber animate-pulse" : ""}
              ${state === "speaking" ? "bg-info animate-pulse" : ""}
            `}
          />
          <span className="text-sm text-text-secondary">
            {stateLabels[state]}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="relative z-10 mt-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-2 max-w-md">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* AI text */}
        <AnimatePresence mode="wait">
          {aiText && (
            <motion.div
              key="ai-text"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative z-10 mt-6 max-w-lg text-center px-6"
            >
              <p className="text-text-secondary text-sm leading-relaxed">
                {aiText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User transcript */}
        <AnimatePresence mode="wait">
          {transcript && (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 max-w-md"
            >
              <div className="rounded-xl bg-surface-overlay/80 backdrop-blur-sm border border-border px-4 py-3">
                <p className="text-xs text-text-muted mb-1">Sen</p>
                <p className="text-sm text-text">{transcript}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-border-subtle bg-surface/80 backdrop-blur-sm py-5">
        <div className="flex items-center justify-center gap-6">
          {/* Volume indicator (behind mic button) */}
          <div className="relative">
            {/* Volume ring */}
            {micActive && (
              <motion.div
                animate={{ scale: 1 + volume * 6, opacity: 0.3 + volume * 2 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 rounded-full bg-success/20 pointer-events-none"
                style={{ margin: -8 }}
              />
            )}

            {/* Mic button */}
            <button
              onClick={handleMicClick}
              disabled={!connected}
              className={`
                relative h-16 w-16 rounded-full flex items-center justify-center
                border-2 transition-all duration-200 cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  state === "speaking" || state === "processing"
                    ? "border-danger/60 bg-danger/15 text-danger hover:bg-danger/20"
                    : micActive
                      ? "border-success bg-success/15 text-success shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:bg-success/20"
                      : "border-border bg-surface-raised text-text-muted hover:border-text-muted hover:text-text"
                }
              `}
              aria-label={
                state === "speaking" || state === "processing"
                  ? "Sözünü kes"
                  : micActive
                    ? "Mikrofonu kapat"
                    : "Mikrofonu aç"
              }
            >
              <span className="text-2xl" aria-hidden="true">
                {state === "speaking" || state === "processing" ? "✋" : "🎙"}
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted mt-3">
          {!connected
            ? "Bağlantı kuruluyor…"
            : state === "speaking" || state === "processing"
              ? "Araya girmek için butona tıklayın"
              : micActive
                ? "Konuşun — sessizlikte otomatik gönderilir"
                : "Mikrofonu açmak için butona tıklayın"}
        </p>
      </div>
    </div>
  );
}
