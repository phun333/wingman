import { motion } from "motion/react";
import type { VoicePipelineState } from "@ffh/types";

const stateLabels: Record<VoicePipelineState, string> = {
  idle: "Hazır",
  listening: "Dinliyor…",
  processing: "Düşünüyor…",
  speaking: "Konuşuyor…",
};

interface VoiceBarProps {
  state: VoicePipelineState;
  micActive: boolean;
  volume: number;
  connected: boolean;
  transcript: string;
  aiText: string;
  error: string | null;
  onMicClick: () => void;
}

export function VoiceBar({
  state,
  micActive,
  volume,
  connected,
  transcript,
  aiText,
  error,
  onMicClick,
}: VoiceBarProps) {
  return (
    <div className="border-t border-border-subtle bg-surface/80 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Mic button */}
        <div className="relative flex-shrink-0">
          {micActive && (
            <motion.div
              animate={{ scale: 1 + volume * 5, opacity: 0.3 + volume * 2 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 rounded-full bg-success/20 pointer-events-none"
              style={{ margin: -4 }}
            />
          )}
          <button
            onClick={onMicClick}
            disabled={!connected}
            className={`
              relative h-10 w-10 rounded-full flex items-center justify-center
              border-2 transition-all duration-200 cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              ${
                state === "speaking" || state === "processing"
                  ? "border-danger/60 bg-danger/15 text-danger hover:bg-danger/20"
                  : micActive
                    ? "border-success bg-success/15 text-success hover:bg-success/20"
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
            <span className="text-base" aria-hidden="true">
              {state === "speaking" || state === "processing" ? "✋" : "🎙"}
            </span>
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-2 w-2 rounded-full flex-shrink-0 ${
              state === "idle" ? "bg-text-muted" : ""
            } ${state === "listening" ? "bg-success animate-pulse" : ""}
              ${state === "processing" ? "bg-amber animate-pulse" : ""}
              ${state === "speaking" ? "bg-info animate-pulse" : ""}
            `}
          />
          <span className="text-xs text-text-secondary">{stateLabels[state]}</span>
          {!connected && (
            <span className="text-xs text-danger">Bağlantı yok</span>
          )}
        </div>

        {/* AI text or transcript */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {error ? (
            <p className="text-xs text-danger truncate">{error}</p>
          ) : aiText ? (
            <p className="text-xs text-text-secondary truncate">
              <span className="text-amber">AI:</span> {aiText}
            </p>
          ) : transcript ? (
            <p className="text-xs text-text-secondary truncate">
              <span className="text-info">Sen:</span> {transcript}
            </p>
          ) : (
            <p className="text-xs text-text-muted truncate">
              {!connected
                ? "Bağlantı kuruluyor…"
                : micActive
                  ? "Konuşun — sessizlikte otomatik gönderilir"
                  : "Mikrofonu açmak için butona tıklayın"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
