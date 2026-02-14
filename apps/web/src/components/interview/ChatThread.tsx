import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, User } from "lucide-react";
import Markdown from "react-markdown";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: number;
}

interface ChatThreadProps {
  transcript: string;
  aiText: string;
  state: "idle" | "listening" | "processing" | "speaking";
}

/**
 * Full-screen centered chat thread for voice-only interviews.
 * Messages scroll top-to-bottom, AI on left, user on right.
 */
export function ChatThread({ transcript, aiText, state }: ChatThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingUserText, setPendingUserText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStateRef = useRef(state);
  const lastTranscriptRef = useRef("");
  const aiAccumulatorRef = useRef("");
  // Track whether user message was committed this turn (prevents duplicates)
  const userCommittedRef = useRef(false);

  // Track user speech: buffer transcript, commit when processing starts
  useEffect(() => {
    if (transcript) {
      setPendingUserText(transcript);
      lastTranscriptRef.current = transcript;
    }
  }, [transcript]);

  // Commit user message when transcript arrives during processing/speaking
  // (PTT mode: transcript arrives AFTER state transitions to processing)
  useEffect(() => {
    if (transcript && !userCommittedRef.current && (state === "processing" || state === "speaking")) {
      userCommittedRef.current = true;
      setMessages((msgs) => [
        ...msgs,
        {
          id: `user-${Date.now()}`,
          type: "user",
          text: transcript,
          timestamp: Date.now(),
        },
      ]);
      setPendingUserText("");
      lastTranscriptRef.current = "";
      aiAccumulatorRef.current = "";
    }
  }, [transcript, state]);

  // Track AI text: accumulate
  useEffect(() => {
    if (aiText) {
      aiAccumulatorRef.current = aiText;
    }
  }, [aiText]);

  // Handle state transitions: commit user and AI messages
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    // Reset user committed flag when a new listening turn starts
    if (state === "listening") {
      userCommittedRef.current = false;
    }

    // Commit user message when state transitions to processing (VAD mode: transcript may already be available)
    if (state === "processing" && prev === "listening" && lastTranscriptRef.current && !userCommittedRef.current) {
      userCommittedRef.current = true;
      const text = lastTranscriptRef.current;
      setMessages((msgs) => [
        ...msgs,
        {
          id: `user-${Date.now()}`,
          type: "user",
          text,
          timestamp: Date.now(),
        },
      ]);
      setPendingUserText("");
      lastTranscriptRef.current = "";
      aiAccumulatorRef.current = "";
    }

    // Commit AI message when speaking/processing ends
    if (
      (state === "idle" || state === "listening") &&
      (prev === "speaking" || prev === "processing") &&
      aiAccumulatorRef.current
    ) {
      const text = aiAccumulatorRef.current;
      setMessages((msgs) => {
        // Avoid duplicates
        const last = msgs[msgs.length - 1];
        if (last?.type === "ai" && last.text === text) return msgs;

        return [
          ...msgs,
          {
            id: `ai-${Date.now()}`,
            type: "ai",
            text,
            timestamp: Date.now(),
          },
        ];
      });
      aiAccumulatorRef.current = "";
    }
  }, [state]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pendingUserText, aiText, state]);

  const isAIActive = state === "speaking" || state === "processing";
  const showLiveAI = isAIActive && aiText;
  const showLiveUser = state === "listening" && pendingUserText;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Committed messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.type === "ai" && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-amber/15 flex items-center justify-center mt-1">
                  <Bot size={16} className="text-amber" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.type === "ai"
                    ? "bg-surface-raised border border-border-subtle"
                    : "bg-amber/10 border border-amber/20"
                }`}
              >
                {msg.type === "ai" ? (
                  <div className="text-sm text-text prose prose-sm prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                ) : (
                  <p className="text-sm text-text">{msg.text}</p>
                )}
              </div>

              {msg.type === "user" && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-success/15 flex items-center justify-center mt-1">
                  <User size={16} className="text-success" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Live AI response (streaming) */}
        <AnimatePresence>
          {showLiveAI && (
            <motion.div
              key="live-ai"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-amber/15 flex items-center justify-center mt-1">
                <Bot size={16} className="text-amber" />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-surface-raised border border-amber/30">
                <div className="text-sm text-text prose prose-sm prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                  <Markdown>{aiText}</Markdown>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-amber"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <span className="text-[10px] text-amber/60">
                    {state === "processing" ? "Düşünüyor…" : "Konuşuyor…"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing indicator (no text yet) */}
        <AnimatePresence>
          {state === "processing" && !aiText && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-amber/15 flex items-center justify-center">
                <Bot size={16} className="text-amber" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-surface-raised border border-border-subtle">
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-amber/60"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-amber/60"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 rounded-full bg-amber/60"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live user speech (real-time transcript) */}
        <AnimatePresence>
          {showLiveUser && (
            <motion.div
              key="live-user"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 justify-end"
            >
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-amber/5 border border-amber/10">
                <p className="text-sm text-text/70 italic">{pendingUserText}</p>
                <div className="flex items-center justify-end gap-1.5 mt-1.5">
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-success"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-[10px] text-success/60">Dinliyor…</span>
                </div>
              </div>
              <div className="shrink-0 w-8 h-8 rounded-full bg-success/15 flex items-center justify-center mt-1">
                <User size={16} className="text-success" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
