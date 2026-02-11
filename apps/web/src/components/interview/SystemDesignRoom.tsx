import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useVoice } from "@/lib/useVoice";
import { getInterview, completeInterview } from "@/lib/api";
import { WhiteboardCanvas } from "./whiteboard/WhiteboardCanvas";
import { DesignProblemPanel } from "./whiteboard/DesignProblemPanel";
import { ResizableSplitter } from "./ResizableSplitter";
import type {
  VoicePipelineState,
  Interview,
  DesignProblem,
  WhiteboardState,
} from "@ffh/types";
import type { Editor } from "tldraw";

const stateLabels: Record<VoicePipelineState, string> = {
  idle: "Hazır",
  listening: "Dinliyor…",
  processing: "Düşünüyor…",
  speaking: "Konuşuyor…",
};

interface SystemDesignRoomProps {
  interviewId: string;
}

export function SystemDesignRoom({ interviewId }: SystemDesignRoomProps) {
  const navigate = useNavigate();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [designProblem, setDesignProblem] = useState<DesignProblem | null>(null);
  const [problemLoading, setProblemLoading] = useState(true);
  const editorRef = useRef<Editor | null>(null);

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

  // Load interview
  useEffect(() => {
    getInterview(interviewId)
      .then((iv) => setInterview(iv))
      .catch((err) =>
        setLoadError(err instanceof Error ? err.message : "Mülakat bulunamadı"),
      );
  }, [interviewId]);

  // Design problem loaded from WS
  const handleDesignProblemLoaded = useCallback((p: DesignProblem) => {
    setDesignProblem(p);
    setProblemLoading(false);
  }, []);

  // Voice hook
  const {
    state,
    micActive,
    volume,
    transcript,
    aiText,
    error,
    connected,
    timeWarning,
    toggleMic,
    interrupt,
    sendWhiteboardUpdate,
  } = useVoice({
    interviewId,
    onDesignProblemLoaded: handleDesignProblemLoaded,
  });

  // Fallback: if no problem loaded in 8 seconds, stop loading spinner
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!designProblem) setProblemLoading(false);
    }, 8000);
    return () => clearTimeout(timeout);
  }, [designProblem]);

  // Whiteboard state change → send to backend
  const handleWhiteboardChange = useCallback(
    (wbState: WhiteboardState) => {
      sendWhiteboardUpdate(wbState);
    },
    [sendWhiteboardUpdate],
  );

  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
  }, []);

  // End interview
  const handleEnd = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await completeInterview(interviewId);
    } catch {
      // May already be completed
    }
    navigate(`/interview/${interviewId}/report`);
  }, [interviewId, navigate]);

  // Mic click
  function handleMicClick() {
    if (state === "speaking" || state === "processing") {
      interrupt();
      return;
    }
    toggleMic();
  }

  if (loadError) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <p className="text-danger text-lg font-medium">{loadError}</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            Dashboard'a Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Top bar */}
      <header className="flex h-12 items-center justify-between border-b border-border-subtle bg-surface/80 backdrop-blur-sm px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-md bg-amber/15 flex items-center justify-center">
            <span className="text-amber font-display text-xs font-bold">F</span>
          </div>
          <span className="text-sm font-medium text-text-secondary">
            System Design
          </span>
          {interview && (
            <span className="text-xs text-text-muted px-2 py-0.5 rounded-md bg-surface-raised border border-border">
              {interview.difficulty === "easy"
                ? "Kolay"
                : interview.difficulty === "medium"
                  ? "Orta"
                  : "Zor"}
            </span>
          )}
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-success" : "bg-danger animate-pulse"}`}
            title={connected ? "Bağlı" : "Bağlantı yok"}
          />
        </div>
        <div className="flex items-center gap-3">
          {timeWarning && (
            <span className="text-xs text-amber px-2 py-0.5 rounded-md bg-amber/10 border border-amber/20">
              ⏱ ~{timeWarning} dk kaldı
            </span>
          )}
          <span className="text-sm font-mono text-text-muted tabular-nums">
            {formatTime(elapsed)}
          </span>
          <Button variant="danger" size="sm" onClick={handleEnd}>
            Bitir
          </Button>
        </div>
      </header>

      {/* Main content: Problem panel | Whiteboard */}
      <div className="flex-1 overflow-hidden">
        <ResizableSplitter
          defaultLeftPercent={28}
          minLeftPercent={18}
          maxLeftPercent={45}
          left={
            <div className="h-full border-r border-border-subtle bg-surface">
              <DesignProblemPanel
                problem={designProblem}
                loading={problemLoading}
              />
            </div>
          }
          right={
            <div className="h-full relative">
              <WhiteboardCanvas
                onStateChange={handleWhiteboardChange}
                onEditorReady={handleEditorReady}
              />
            </div>
          }
        />
      </div>

      {/* Voice bar at bottom */}
      <div className="border-t border-border-subtle bg-surface/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4 px-5 py-3">
          {/* Mic button */}
          <div className="relative">
            {micActive && (
              <motion.div
                animate={{
                  scale: 1 + volume * 6,
                  opacity: 0.3 + volume * 2,
                }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 rounded-full bg-success/20 pointer-events-none"
                style={{ margin: -6 }}
              />
            )}
            <button
              onClick={handleMicClick}
              disabled={!connected}
              className={`
                relative h-12 w-12 rounded-full flex items-center justify-center
                border-2 transition-all duration-200 cursor-pointer
                disabled:opacity-40 disabled:cursor-not-allowed
                ${
                  state === "speaking" || state === "processing"
                    ? "border-danger/60 bg-danger/15 text-danger hover:bg-danger/20"
                    : micActive
                      ? "border-success bg-success/15 text-success shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:bg-success/20"
                      : "border-border bg-surface-raised text-text-muted hover:border-text-muted hover:text-text"
                }
              `}
            >
              <span className="text-lg" aria-hidden="true">
                {state === "speaking" || state === "processing" ? "✋" : "🎙"}
              </span>
            </button>
          </div>

          {/* Status + texts */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0
                  ${state === "idle" ? "bg-text-muted" : ""}
                  ${state === "listening" ? "bg-success animate-pulse" : ""}
                  ${state === "processing" ? "bg-amber animate-pulse" : ""}
                  ${state === "speaking" ? "bg-info animate-pulse" : ""}
                `}
              />
              <span className="text-xs text-text-muted">
                {stateLabels[state]}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {aiText && (
                <motion.p
                  key="ai"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-text-secondary truncate"
                >
                  🤖 {aiText}
                </motion.p>
              )}
              {!aiText && transcript && (
                <motion.p
                  key="user"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-text-muted truncate"
                >
                  🗣 {transcript}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <span className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-md px-2 py-1 shrink-0">
              {error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
