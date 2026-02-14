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

const features = [
  {
    icon: "🎤",
    title: "Sesli AI Mülakatçı",
    description: "Freya STT/TTS + Gemini 2.5 Flash ile Türkçe gerçek zamanlı mülakat.",
    color: colors.amber,
  },
  {
    icon: "💻",
    title: "Canlı Kodlama",
    description: "Monaco editör ile kod yazma, çalıştırma ve AI analizi.",
    color: colors.info,
  },
  {
    icon: "🏗️",
    title: "Sistem Tasarımı",
    description: "tldraw beyaz tahta ile mimari tasarlama ve anlık geri bildirim.",
    color: colors.purple,
  },
  {
    icon: "📊",
    title: "Akıllı Öneri",
    description: "CV analizi ile kişiselleştirilmiş LeetCode çalışma planı.",
    color: colors.success,
  },
];

export const FeaturesScene: React.FC = () => {
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
          padding: "0 80px",
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
          Özellikler
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 56,
            fontWeight: 800,
            color: colors.text,
            letterSpacing: "-0.02em",
            textAlign: "center",
            opacity: titleSpring,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1.15,
          }}
        >
          Neler{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.amber}, ${colors.amberLight})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            sunuyoruz
          </span>
          ?
        </div>

        {/* Feature cards — 2x2 grid, each slides in from different direction */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            width: "100%",
            maxWidth: 840,
          }}
        >
          {features.map((feature, i) => {
            const cardDelay = 20 + i * 12;
            const cardSpring = spring({
              frame,
              fps,
              delay: cardDelay,
              config: { damping: 200 },
            });
            // Alternate directions: left, right, left, right
            const dirX = i % 2 === 0 ? -50 : 50;
            const cardX = interpolate(cardSpring, [0, 1], [dirX, 0]);
            const cardY = interpolate(cardSpring, [0, 1], [20, 0]);

            // Shimmer
            const shimmer = interpolate(
              frame,
              [cardDelay + 30, cardDelay + 60],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: 24,
                  borderRadius: 16,
                  border: `1px solid ${feature.color}${Math.round(interpolate(shimmer, [0, 1], [15, 40])).toString(16).padStart(2, "0")}`,
                  background: `linear-gradient(135deg, ${feature.color}08, ${colors.surface})`,
                  opacity: cardSpring,
                  transform: `translate(${cardX}px, ${cardY}px)`,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.3)`,
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    minWidth: 48,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${feature.color}15`,
                    border: `1px solid ${feature.color}25`,
                    fontSize: 24,
                  }}
                >
                  {feature.icon}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div
                    style={{
                      fontFamily: fontDisplay,
                      fontSize: 20,
                      fontWeight: 700,
                      color: colors.text,
                    }}
                  >
                    {feature.title}
                  </div>
                  <div
                    style={{
                      fontFamily: fontBody,
                      fontSize: 15,
                      color: colors.textSecondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {feature.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
