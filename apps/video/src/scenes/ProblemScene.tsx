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

const problems = [
  { emoji: "😰", text: "Mülakat stresi ve hazırlık belirsizliği" },
  { emoji: "🤖", text: "Gerçekçi pratik ortamı eksikliği" },
  { emoji: "🌍", text: "Türkçe kaynak ve mentorluk yetersizliği" },
  { emoji: "📊", text: "Kişiselleştirilmiş geri bildirim yokluğu" },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Label
  const labelSpring = spring({ frame, fps, delay: 5, config: { damping: 200 } });

  // Title slides from right
  const titleSpring = spring({ frame, fps, delay: 10, config: { damping: 200 } });
  const titleX = interpolate(titleSpring, [0, 1], [80, 0]);

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 120px",
          gap: 40,
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
          Problem
        </div>

        {/* Title — slides from right */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 64,
            fontWeight: 800,
            color: colors.text,
            letterSpacing: "-0.02em",
            textAlign: "center",
            opacity: titleSpring,
            transform: `translateX(${titleX}px)`,
            lineHeight: 1.15,
          }}
        >
          Teknik mülakata hazırlanmak
          <br />
          neden bu kadar <span style={{ color: colors.danger }}>zor</span>?
        </div>

        {/* Problem items — stagger from left */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            width: "100%",
            maxWidth: 800,
          }}
        >
          {problems.map((problem, i) => {
            const itemDelay = 25 + i * 12;
            const itemSpring = spring({
              frame,
              fps,
              delay: itemDelay,
              config: { damping: 200 },
            });
            const itemX = interpolate(itemSpring, [0, 1], [-60, 0]);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "18px 28px",
                  borderRadius: 14,
                  border: `1px solid ${colors.border}`,
                  background: colors.surface,
                  opacity: itemSpring,
                  transform: `translateX(${itemX}px)`,
                }}
              >
                <span style={{ fontSize: 28 }}>{problem.emoji}</span>
                <span
                  style={{
                    fontFamily: fontBody,
                    fontSize: 22,
                    fontWeight: 500,
                    color: colors.text,
                  }}
                >
                  {problem.text}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
