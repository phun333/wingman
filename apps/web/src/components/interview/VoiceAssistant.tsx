import { useState, useEffect } from "react";
import { motion } from "motion/react";

interface VoiceAssistantProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  audioLevel?: number;
  onStart?: () => void;
  onStop?: () => void;
}

export function VoiceAssistant({
  isListening = false,
  isSpeaking = false,
  audioLevel = 0,
  onStart,
  onStop,
}: VoiceAssistantProps) {
  const [isActive, setIsActive] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);

  useEffect(() => {
    setLocalAudioLevel(audioLevel);
  }, [audioLevel]);

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
      onStop?.();
    } else {
      setIsActive(true);
      onStart?.();
    }
  };

  // Calculate ring scales based on audio level
  const baseScale = 1;
  const pulseScale = isActive ? 1 + localAudioLevel * 0.3 : 1;
  const outerPulseScale = isActive ? 1 + localAudioLevel * 0.5 : 1;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] relative">
      {/* Outer rings for speaking/listening animation */}
      <div className="relative">
        {/* Outermost ring */}
        {(isListening || isSpeaking) && (
          <motion.div
            className="absolute inset-0 rounded-full border border-amber/10"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: outerPulseScale * 1.8,
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
            style={{
              width: "200px",
              height: "200px",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {/* Middle ring */}
        {(isListening || isSpeaking) && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber/20"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: pulseScale * 1.4,
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.2,
            }}
            style={{
              width: "200px",
              height: "200px",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {/* Inner ring */}
        {(isListening || isSpeaking) && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber/30"
            animate={{
              scale: pulseScale * 1.2,
              opacity: localAudioLevel > 0 ? 0.8 : 0.4,
            }}
            transition={{
              duration: 0.1,
              ease: "easeOut",
            }}
            style={{
              width: "200px",
              height: "200px",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        )}

        {/* Main button */}
        <motion.button
          onClick={handleToggle}
          className={`
            relative w-[200px] h-[200px] rounded-full
            bg-gradient-to-br from-zinc-900 to-black
            border-2 transition-all duration-300
            ${isActive ? "border-amber shadow-2xl shadow-amber/30" : "border-zinc-700 hover:border-zinc-600"}
            flex items-center justify-center
            cursor-pointer
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: baseScale,
          }}
        >
          {/* Inner gradient glow when active */}
          {isActive && (
            <motion.div
              className="absolute inset-2 rounded-full bg-gradient-to-br from-amber/20 to-orange-500/10 blur-xl"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Icon */}
          <div className="relative z-10">
            {isActive ? (
              // Listening/Speaking indicator
              <div className="flex items-center justify-center">
                <div className="flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-amber rounded-full"
                      animate={{
                        height: isListening
                          ? [12, 24, 12]
                          : isSpeaking
                          ? [8, 20, 8]
                          : 12,
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // Microphone icon
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            )}
          </div>
        </motion.button>
      </div>

      {/* Status text */}
      <div className="mt-8 text-center">
        <motion.p
          className="text-text-secondary text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isActive
            ? isListening
              ? "Dinliyorum..."
              : isSpeaking
              ? "Konuşuyorum..."
              : "Bağlanıyor..."
            : "Başlamak için mikrofona tıklayın"}
        </motion.p>
      </div>

      {/* Instructions */}
      {!isActive && (
        <motion.div
          className="mt-4 text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-text-muted text-xs">
            Mikrofon erişimi gereklidir. Başladıktan sonra AI asistan sizinle sesli olarak iletişim kuracaktır.
          </p>
        </motion.div>
      )}
    </div>
  );
}