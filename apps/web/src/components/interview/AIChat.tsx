import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Bot, User, Clock, MicOff, VolumeX, Square } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: number;
  latency?: number; // in milliseconds
}

interface AIChatProps {
  transcript: string;
  aiText: string;
  micActive: boolean;
  state: "idle" | "listening" | "processing" | "speaking";
  volume: number;
  onMicClick: () => void;
  connected: boolean;
  onMute?: () => void;
  onStop?: () => void;
  isMuted?: boolean;
}

export function AIChat({
  transcript,
  aiText,
  micActive,
  state,
  volume,
  onMicClick,
  connected,
  onMute,
  onStop,
  isMuted
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserStart, setCurrentUserStart] = useState<number | null>(null);
  const [currentAIStart, setCurrentAIStart] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track user speech
  useEffect(() => {
    if (transcript && !currentUserStart) {
      setCurrentUserStart(Date.now());
    }
  }, [transcript]);

  // Handle message creation when processing starts
  useEffect(() => {
    if (transcript && currentUserStart && state === "processing") {
      const latency = Date.now() - currentUserStart;
      setMessages(prev => [...prev, {
        id: `user-${Date.now()}`,
        type: "user",
        text: transcript,
        timestamp: currentUserStart,
        latency
      }]);
      setCurrentUserStart(null);
      setCurrentAIStart(Date.now());
    }
  }, [state, transcript, currentUserStart]);

  // Track AI response
  useEffect(() => {
    if (aiText && currentAIStart && (state === "idle" || aiText.length > 100)) {
      const latency = currentAIStart ? Date.now() - currentAIStart : undefined;
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        // Check if we should update existing AI message or create new one
        if (lastMsg?.type === "ai" && Date.now() - lastMsg.timestamp < 5000) {
          // Only update if text is actually different (avoid duplicates)
          if (lastMsg.text !== aiText) {
            return prev.slice(0, -1).concat({
              ...lastMsg,
              text: aiText
            });
          }
          return prev; // No change needed
        }

        // Check for duplicate text in recent messages
        const isDuplicate = prev.slice(-3).some(msg =>
          msg.type === "ai" && msg.text.trim() === aiText.trim()
        );

        if (isDuplicate) {
          return prev; // Skip duplicate
        }

        // Add new AI message
        return [...prev, {
          id: `ai-${Date.now()}`,
          type: "ai",
          text: aiText,
          timestamp: Date.now(),
          latency
        }];
      });

      if (state === "idle") {
        setCurrentAIStart(null);
      }
    }
  }, [aiText, state, currentAIStart]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Calculate pulse size based on volume
  const pulseScale = 1 + (volume * 2);

  return (
    <div className="fixed bottom-4 left-4 w-96 flex flex-col gap-3">
      {/* Chat History */}
      <div className="bg-surface/95 backdrop-blur-md border border-border-subtle rounded-xl p-3 max-h-72 overflow-y-auto">
        <div className="space-y-2">
          <AnimatePresence>
            {messages.slice(-5).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex gap-2 ${msg.type === "ai" ? "" : "justify-end"}`}
              >
                {msg.type === "ai" && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-amber/20 flex items-center justify-center">
                    <Bot size={12} className="text-amber" />
                  </div>
                )}

                <div className={`flex-1 ${msg.type === "ai" ? "" : "text-right"}`}>
                  <p className={`text-sm ${msg.type === "ai" ? "text-text" : "text-text-secondary"}`}>
                    {msg.text}
                  </p>
                  {msg.latency && (
                    <span className="text-xs text-text-muted mt-0.5 flex items-center gap-1 ${msg.type === 'ai' ? '' : 'justify-end'}">
                      <Clock size={10} />
                      {msg.latency}ms
                    </span>
                  )}
                </div>

                {msg.type === "user" && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                    <User size={12} className="text-success" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>
      </div>

      {/* AI Orb */}
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16">
          {/* Pulse effect when speaking */}
          <AnimatePresence>
            {state === "speaking" && (
              <motion.div
                className="absolute inset-0 rounded-full bg-amber/30"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{
                  scale: [1, pulseScale, 1],
                  opacity: [0.5, 0.2, 0.5]
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            )}
          </AnimatePresence>

          {/* Multiple rings when processing */}
          {state === "processing" && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-amber/40"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.6, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-amber/40"
                animate={{
                  scale: [1, 1.5],
                  opacity: [0.6, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.3
                }}
              />
            </>
          )}

          {/* Main orb */}
          <motion.div
            onClick={onMicClick}
            className={`
              relative w-full h-full rounded-full flex items-center justify-center
              transition-all duration-300 cursor-pointer
              ${!connected
                ? "bg-gradient-to-br from-surface-raised to-surface border border-border-subtle"
                : micActive
                ? "bg-gradient-to-br from-success to-success/80 shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                : state === "speaking"
                ? "bg-gradient-to-br from-amber to-orange shadow-[0_0_30px_rgba(251,191,36,0.4)]"
                : state === "processing"
                ? "bg-gradient-to-br from-amber/80 to-orange/80"
                : "bg-gradient-to-br from-surface-raised to-surface border border-border-subtle hover:border-text-muted"
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {!connected ? (
              <MicOff size={24} className="text-text-muted" />
            ) : micActive ? (
              <Mic size={24} className="text-background" />
            ) : state === "speaking" || state === "processing" ? (
              <Bot size={24} className="text-background" />
            ) : (
              <Mic size={24} className="text-text-muted" />
            )}
          </motion.div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${
              state === "speaking" ? "text-amber" :
              state === "processing" ? "text-amber/70" :
              state === "listening" ? "text-success" :
              "text-text-muted"
            }`}>
              {state === "speaking" ? "Konuşuyor" :
               state === "processing" ? "Düşünüyor" :
               state === "listening" ? "Dinliyor" :
               "Hazır"}
            </span>

            {/* Current latency display */}
            {currentAIStart && state === "speaking" && (
              <span className="text-xs text-text-muted">
                {Date.now() - currentAIStart}ms
              </span>
            )}
          </div>

          {/* Volume meter */}
          {micActive && (
            <div className="mt-1 h-1 bg-surface-raised rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-success to-amber"
                style={{ width: `${volume * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      {connected && (onMute || onStop) && (
        <div className="flex gap-2 justify-center">
          {onMute && (
            <motion.button
              onClick={onMute}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-200
                ${isMuted
                  ? "bg-red-500/20 border border-red-500/40 text-red-400"
                  : "bg-surface-raised border border-border-subtle text-text-muted hover:border-text-muted"
                }
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
            >
              <VolumeX size={14} />
            </motion.button>
          )}

          {onStop && (
            <motion.button
              onClick={onStop}
              className="
                w-8 h-8 rounded-full flex items-center justify-center
                bg-red-500/20 border border-red-500/40 text-red-400
                hover:bg-red-500/30 transition-all duration-200
              "
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Durdur"
            >
              <Square size={12} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}