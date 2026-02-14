import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontBody, fontMono } from "../fonts";
import { Background } from "../components/Background";

const steps = [
  { icon: "🎙️", label: "Ses Kaydı", detail: "WebSocket ile\ngerçek zamanlı", color: colors.info },
  { icon: "📝", label: "Freya STT", detail: "Sesden metne\nTürkçe dönüştürme", color: colors.amber },
  { icon: "🧠", label: "Gemini LLM", detail: "Akıllı cevap\nüretimi (stream)", color: colors.purple },
  { icon: "🔊", label: "Freya TTS", detail: "Metinden sese\nTürkçe sentez", color: colors.success },
  { icon: "👂", label: "Yanıt", detail: "Gerçek zamanlı\nses aktarımı", color: colors.amberLight },
];

export const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelSpring = spring({ frame, fps, delay: 5, config: { damping: 200 } });
  const titleSpring = spring({ frame, fps, delay: 10, config: { damping: 200 } });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Data packet animating through pipeline
  const packetProgress = interpolate(frame, [40, 140], [0, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Latency badge
  const latencySpring = spring({ frame, fps, delay: 100, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 60px",
          gap: 48,
        }}
      >
        {/* Label */}
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 14,
            fontWeight: 500,
            color: colors.amber,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: labelSpring,
          }}
        >
          Mimari
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 52,
            fontWeight: 800,
            color: colors.text,
            letterSpacing: "-0.02em",
            textAlign: "center",
            opacity: titleSpring,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1.15,
          }}
        >
          Sesli Mülakat <span style={{ color: colors.amber }}>Pipeline</span>
        </div>

        {/* Pipeline row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
          }}
        >
          {steps.map((step, i) => {
            const stepDelay = 18 + i * 10;
            const stepSpring = spring({
              frame,
              fps,
              delay: stepDelay,
              config: { damping: 200 },
            });
            // Each step slides in from bottom
            const stepY = interpolate(stepSpring, [0, 1], [40, 0]);

            const isActive = packetProgress >= i - 0.3 && packetProgress <= i + 0.7;

            return (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center" }}
              >
                {/* Step card */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                    padding: "20px 24px",
                    borderRadius: 14,
                    border: `1.5px solid ${isActive ? step.color : colors.border}`,
                    background: isActive
                      ? `linear-gradient(180deg, ${step.color}15, ${colors.surface})`
                      : colors.surface,
                    opacity: stepSpring,
                    transform: `translateY(${stepY}px)`,
                    boxShadow: isActive
                      ? `0 0 30px ${step.color}25, 0 4px 20px rgba(0,0,0,0.3)`
                      : "0 4px 20px rgba(0,0,0,0.3)",
                    width: 150,
                  }}
                >
                  <span style={{ fontSize: 32 }}>{step.icon}</span>
                  <span
                    style={{
                      fontFamily: fontDisplay,
                      fontSize: 15,
                      fontWeight: 700,
                      color: isActive ? step.color : colors.text,
                      textAlign: "center",
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    style={{
                      fontFamily: fontBody,
                      fontSize: 11,
                      color: colors.textMuted,
                      textAlign: "center",
                      lineHeight: 1.4,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {step.detail}
                  </span>
                </div>

                {/* Arrow */}
                {i < steps.length - 1 && (
                  <div style={{ display: "flex", alignItems: "center", padding: "0 6px" }}>
                    <div
                      style={{
                        width: 28,
                        height: 2,
                        background: packetProgress > i
                          ? `linear-gradient(90deg, ${step.color}, ${steps[i + 1]?.color ?? colors.amber})`
                          : colors.border,
                      }}
                    />
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderTop: "5px solid transparent",
                        borderBottom: "5px solid transparent",
                        borderLeft: packetProgress > i
                          ? `7px solid ${steps[i + 1]?.color ?? colors.amber}`
                          : `7px solid ${colors.border}`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Latency badge */}
        <div
          style={{
            fontFamily: fontMono,
            fontSize: 16,
            color: colors.success,
            opacity: latencySpring,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 20 }}>⚡</span>
          LLM + TTS paralel çalışır → Düşük gecikme
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
