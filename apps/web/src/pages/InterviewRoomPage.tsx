import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import type { VoicePipelineState } from "@ffh/types";

const stateLabels: Record<VoicePipelineState, string> = {
  idle: "Hazır",
  listening: "Dinliyor…",
  processing: "Düşünüyor…",
  speaking: "Konuşuyor…",
};

const stateColors: Record<VoicePipelineState, string> = {
  idle: "bg-text-muted",
  listening: "bg-success",
  processing: "bg-amber",
  speaking: "bg-info",
};

export function InterviewRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pipelineState, setPipelineState] = useState<VoicePipelineState>("idle");
  const [micActive, setMicActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  // Timer
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

  function toggleMic() {
    setMicActive((prev) => {
      const next = !prev;
      setPipelineState(next ? "listening" : "idle");
      return next;
    });
  }

  function handleEnd() {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate("/");
  }

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
              ${pipelineState === "speaking" ? "h-[600px] w-[600px] bg-info/8" : ""}
              ${pipelineState === "listening" ? "h-[500px] w-[500px] bg-success/6" : ""}
              ${pipelineState === "processing" ? "h-[550px] w-[550px] bg-amber/6" : ""}
              ${pipelineState === "idle" ? "h-[400px] w-[400px] bg-surface-raised/50" : ""}
            `}
          />
        </div>

        {/* AI Orb */}
        <motion.div
          animate={{
            scale:
              pipelineState === "speaking"
                ? [1, 1.08, 1]
                : pipelineState === "processing"
                  ? [1, 1.03, 1]
                  : 1,
          }}
          transition={{
            duration: pipelineState === "speaking" ? 1.2 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative z-10"
        >
          <div
            className={`
              h-32 w-32 rounded-full border-2 flex items-center justify-center
              transition-all duration-500
              ${pipelineState === "idle" ? "border-border bg-surface-raised" : ""}
              ${pipelineState === "listening" ? "border-success/40 bg-success/5 shadow-[0_0_40px_rgba(34,197,94,0.15)]" : ""}
              ${pipelineState === "processing" ? "border-amber/40 bg-amber/5 glow-amber" : ""}
              ${pipelineState === "speaking" ? "border-info/40 bg-info/5 shadow-[0_0_40px_rgba(59,130,246,0.2)]" : ""}
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
            className={`h-2 w-2 rounded-full ${stateColors[pipelineState]} ${pipelineState !== "idle" ? "animate-pulse" : ""}`}
          />
          <span className="text-sm text-text-secondary">
            {stateLabels[pipelineState]}
          </span>
        </div>

        {/* AI text subtitle */}
        <AnimatePresence mode="wait">
          {aiText && (
            <motion.p
              key={aiText}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative z-10 mt-6 max-w-lg text-center text-text-secondary text-sm px-6"
            >
              {aiText}
            </motion.p>
          )}
        </AnimatePresence>

        {/* User transcript */}
        <AnimatePresence mode="wait">
          {transcript && (
            <motion.div
              key={transcript}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 max-w-md"
            >
              <div className="rounded-xl bg-surface-overlay/80 backdrop-blur-sm border border-border px-4 py-3">
                <p className="text-sm text-text">{transcript}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-border-subtle bg-surface/80 backdrop-blur-sm py-5">
        <div className="flex items-center justify-center gap-6">
          {/* Mic button */}
          <button
            onClick={toggleMic}
            className={`
              h-16 w-16 rounded-full flex items-center justify-center
              border-2 transition-all duration-200 cursor-pointer
              ${
                micActive
                  ? "border-success bg-success/15 text-success shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:bg-success/20"
                  : "border-border bg-surface-raised text-text-muted hover:border-text-muted hover:text-text"
              }
            `}
            aria-label={micActive ? "Mikrofonu kapat" : "Mikrofonu aç"}
          >
            <span className="text-2xl" aria-hidden="true">
              {micActive ? "🎙" : "🎙"}
            </span>
          </button>
        </div>
        <p className="text-center text-xs text-text-muted mt-3">
          {micActive
            ? "Mikrofon açık — konuşmaya başlayın"
            : "Mikrofonu açmak için butona tıklayın"}
        </p>
      </div>
    </div>
  );
}
