import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, Bot, User, Volume2, Sparkles, Zap, Brain, MessageSquare } from "lucide-react";
import Markdown from "react-markdown";

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: number;
}

interface AIAssistantProps {
  transcript: string;
  aiText: string;
  micActive: boolean;
  state: "idle" | "listening" | "processing" | "speaking";
  volume: number;
  onMicClick: () => void;
  connected: boolean;
  hintLevel?: number;
  totalHints?: number;
  onRequestHint?: () => void;
  interviewStatus?: "created" | "in-progress" | "completed" | "evaluated";
  onStartInterview?: () => void;
}

export function AIAssistant({
  transcript,
  aiText,
  micActive,
  state,
  volume,
  onMicClick,
  connected,
  hintLevel = 0,
  totalHints = 0,
  onRequestHint,
  interviewStatus,
  onStartInterview
}: AIAssistantProps) {
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

  // Dynamic orb animations
  const orbScale = state === "listening" ? 1 + Math.min(volume * 4, 0.3) : 1;

  // Floating particles effect
  const particles = Array.from({ length: 6 });

  return (
    <div className="fixed bottom-4 left-4 w-[380px] max-h-[calc(100vh-200px)] flex flex-col" style={{ maxHeight: "400px" }}>
      {/* Glass Card Container */}
      <motion.div
        className="flex-1 bg-surface/90 backdrop-blur-xl border border-border-subtle rounded-2xl p-4 flex flex-col relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Background gradient effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-48 h-48 bg-amber/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange/20 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-orange flex items-center justify-center shadow-lg">
                <Bot size={16} className="text-white" />
              </div>
              {connected && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background" />
              )}
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

          {/* Hint indicator */}
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

        {/* Messages Container */}
        <div className="relative z-10 flex-1 overflow-y-auto mb-3 space-y-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent" style={{maxHeight: "150px"}}>
          <AnimatePresence>
            {messages.slice(-5).map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.type === "ai" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex gap-2 ${msg.type === "user" ? "justify-end" : ""}`}
              >
                {msg.type === "ai" && (
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-amber/20 to-orange/20 flex items-center justify-center">
                    <Bot size={14} className="text-amber" />
                  </div>
                )}

                <div className={`max-w-[85%] ${msg.type === "user" ? "text-right" : ""}`}>
                  <div className={`
                    px-3 py-2 rounded-xl text-sm
                    ${msg.type === "ai"
                      ? "bg-surface-raised border border-border"
                      : "bg-gradient-to-br from-success/20 to-emerald/20 border border-success/30"}
                  `}>
                    {msg.type === "ai" ? (
                      <div className="prose prose-sm prose-invert max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      <p className="text-text">{msg.text}</p>
                    )}
                  </div>
                </div>

                {msg.type === "user" && (
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-success/20 to-emerald/20 flex items-center justify-center">
                    <User size={14} className="text-success" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={scrollRef} />
        </div>

        {/* Current transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="relative z-10 mb-4 px-3 py-2 rounded-xl bg-surface-raised/50 border border-border-subtle"
            >
              <p className="text-xs text-text-muted mb-0.5">Dinleniyor...</p>
              <p className="text-sm text-text">{transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main AI Orb */}
        <div className="relative z-10 flex items-center justify-center mb-4">
          <div className="relative">
            {/* Floating particles */}
            <AnimatePresence>
              {(state === "speaking" || state === "processing") && particles.map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-amber rounded-full"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [0, (Math.random() - 0.5) * 100],
                    y: [0, (Math.random() - 0.5) * 100],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Pulse rings */}
            {state === "speaking" && (
              <>
                {[0, 0.4, 0.8].map((delay, i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-amber/30"
                    animate={{
                      scale: [1, 2.5],
                      opacity: [0.6, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </>
            )}

            {/* Processing animation */}
            {state === "processing" && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber rounded-full" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-orange rounded-full" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-amber rounded-full" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange rounded-full" />
              </motion.div>
            )}

            {/* Main orb button */}
            <motion.button
              onClick={onMicClick}
              disabled={!connected}
              className={`
                relative w-16 h-16 rounded-full flex items-center justify-center
                transition-all duration-300 shadow-xl
                ${!connected
                  ? "bg-gradient-to-br from-surface-raised to-surface border-2 border-border-subtle cursor-not-allowed opacity-50"
                  : micActive
                  ? "bg-gradient-to-br from-success to-emerald shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                  : state === "speaking"
                  ? "bg-gradient-to-br from-amber to-orange shadow-[0_0_40px_rgba(251,191,36,0.5)]"
                  : state === "processing"
                  ? "bg-gradient-to-br from-amber/80 to-orange/80 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
                  : "bg-gradient-to-br from-surface-raised to-surface border-2 border-border hover:border-amber hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                }
              `}
              whileHover={connected ? { scale: 1.05 } : {}}
              whileTap={connected ? { scale: 0.95 } : {}}
              animate={{ scale: orbScale }}
              transition={{ duration: 0.1 }}
            >
              {!connected ? (
                <Zap size={20} className="text-text-muted" />
              ) : micActive ? (
                <Mic size={20} className="text-white" />
              ) : state === "speaking" ? (
                <Volume2 size={20} className="text-white" />
              ) : state === "processing" ? (
                <Brain size={20} className="text-white" />
              ) : (
                <MessageSquare size={20} className="text-text-muted" />
              )}
            </motion.button>

            {/* Volume indicator */}
            {micActive && (
              <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-surface-raised rounded-full overflow-hidden"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-success to-amber"
                  style={{ width: `${volume * 100}%` }}
                  transition={{ duration: 0.05 }}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Action hints */}
        <div className="relative z-10 text-center">
          <p className="text-xs text-text-muted">
            {!connected
              ? "Bağlantı kuruluyor..."
              : state === "speaking"
              ? "AI konuşuyor, dinleyin..."
              : state === "processing"
              ? "Yanıt hazırlanıyor..."
              : state === "listening"
              ? "Konuşmaya devam edin..."
              : micActive
              ? "Konuşmaya başlayın"
              : "Asistanı etkinleştirmek için tıklayın"}
          </p>
        </div>

        {/* Start Interview Button */}
        {interviewStatus === "created" && onStartInterview && (
          <motion.button
            onClick={onStartInterview}
            className="
              relative z-10 mt-3 w-full py-2 rounded-lg
              bg-gradient-to-r from-green-500 to-emerald-500
              text-white text-sm font-medium
              shadow-md hover:shadow-lg
              transition-all duration-200
              flex items-center justify-center gap-1.5
            "
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap size={14} />
            Mülakatı Başlat
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}