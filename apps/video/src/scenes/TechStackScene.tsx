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
import { AnimatedCounter } from "../components/AnimatedCounter";

const techItems = [
  { category: "Frontend", items: ["React 19", "Tailwind 4", "Vite", "Monaco", "tldraw"], color: colors.info },
  { category: "Backend", items: ["Bun", "Hono", "oRPC", "WebSocket"], color: colors.amber },
  { category: "AI / ML", items: ["Freya STT", "Freya TTS", "Gemini 2.5", "fal.ai SDK"], color: colors.purple },
  { category: "Veri", items: ["Convex", "better-auth", "Zod v4"], color: colors.success },
];

const stats = [
  { value: 1825, suffix: "+", label: "LeetCode Problemi" },
  { value: 7, suffix: "", label: "Scoring Kriteri" },
  { value: 3, suffix: "", label: "Mülakat Modu" },
];

export const TechStackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelSpring = spring({ frame, fps, delay: 5, config: { damping: 200 } });
  const titleSpring = spring({ frame, fps, delay: 10, config: { damping: 200 } });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 100px",
          gap: 36,
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
          Teknoloji
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
          }}
        >
          Modern{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.amber}, ${colors.amberLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Teknoloji Yığını
          </span>
        </div>

        {/* Tech grid — cards slide in from bottom */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            width: "100%",
            maxWidth: 920,
          }}
        >
          {techItems.map((tech, i) => {
            const cardDelay = 18 + i * 8;
            const cardSpring = spring({
              frame,
              fps,
              delay: cardDelay,
              config: { damping: 200 },
            });
            const cardY = interpolate(cardSpring, [0, 1], [40, 0]);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  padding: "20px 22px",
                  borderRadius: 14,
                  border: `1px solid ${tech.color}25`,
                  background: `linear-gradient(180deg, ${tech.color}08, ${colors.surface})`,
                  opacity: cardSpring,
                  transform: `translateY(${cardY}px)`,
                }}
              >
                <div
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 15,
                    fontWeight: 700,
                    color: tech.color,
                    letterSpacing: "0.02em",
                  }}
                >
                  {tech.category}
                </div>
                {tech.items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      fontFamily: fontMono,
                      fontSize: 13,
                      color: colors.textSecondary,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        backgroundColor: tech.color,
                        opacity: 0.6,
                      }}
                    />
                    {item}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Stats — count up */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 60,
            marginTop: 8,
          }}
        >
          {stats.map((stat, i) => {
            const statDelay = 50 + i * 10;
            const statSpring = spring({
              frame,
              fps,
              delay: statDelay,
              config: { damping: 200 },
            });
            const statScale = interpolate(statSpring, [0, 1], [0.8, 1]);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  opacity: statSpring,
                  transform: `scale(${statScale})`,
                }}
              >
                <div
                  style={{
                    fontFamily: fontDisplay,
                    fontSize: 44,
                    fontWeight: 800,
                    color: colors.amber,
                  }}
                >
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    delay={statDelay}
                  />
                </div>
                <div
                  style={{
                    fontFamily: fontBody,
                    fontSize: 15,
                    color: colors.textMuted,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
