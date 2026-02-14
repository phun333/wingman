import type React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontBody, fontMono } from "../fonts";
import { Background } from "../components/Background";

/**
 * Scene 3: "Meet Wingman" with animated browser mockup
 */
export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const labelSpring = spring({ frame, fps, delay: 5, config: { damping: 200 } });
  const titleSpring = spring({ frame, fps, delay: 12, config: { damping: 200 } });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Browser mockup slides up from bottom
  const mockupSpring = spring({ frame, fps, delay: 25, config: { damping: 15, stiffness: 80 } });
  const mockupY = interpolate(mockupSpring, [0, 1], [300, 0]);
  const mockupScale = interpolate(mockupSpring, [0, 1], [0.95, 1]);

  // Items inside mockup stagger in
  const makeItemSpring = (delay: number) => {
    const s = spring({ frame, fps, delay, config: { damping: 200 } });
    return { opacity: s, y: interpolate(s, [0, 1], [20, 0]) };
  };

  const item1 = makeItemSpring(45);
  const item2 = makeItemSpring(55);
  const item3 = makeItemSpring(65);

  // Subtitle
  const subSpring = spring({ frame, fps, delay: 75, config: { damping: 200 } });

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
          gap: 32,
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
          Çözüm
        </div>

        {/* Title with logo */}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{ width: 52, height: 52, borderRadius: 12 }}
          />
          <span>
            Wing<span style={{ color: colors.amber }}>man</span> ile tanışın
          </span>
        </div>

        {/* Browser mockup frame — slides up */}
        <div
          style={{
            width: 900,
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            overflow: "hidden",
            opacity: mockupSpring,
            transform: `translateY(${mockupY}px) scale(${mockupScale})`,
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${colors.amberGlow}`,
          }}
        >
          {/* Browser chrome bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              borderBottom: `1px solid ${colors.border}`,
              background: colors.surfaceRaised,
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#eab308" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
            <div
              style={{
                flex: 1,
                marginLeft: 12,
                padding: "6px 16px",
                borderRadius: 8,
                background: colors.bg,
                fontFamily: fontMono,
                fontSize: 13,
                color: colors.textMuted,
              }}
            >
              wingman.app
            </div>
          </div>

          {/* Content area — 3 mode cards */}
          <div
            style={{
              display: "flex",
              gap: 16,
              padding: 24,
              justifyContent: "center",
            }}
          >
            {/* Coding card */}
            <div
              style={{
                flex: 1,
                padding: 20,
                borderRadius: 12,
                border: `1px solid ${colors.info}30`,
                background: `linear-gradient(180deg, ${colors.info}10, ${colors.bg})`,
                opacity: item1.opacity,
                transform: `translateY(${item1.y}px)`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>💻</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                Canlı Kodlama
              </div>
              <div style={{ fontFamily: fontBody, fontSize: 12, color: colors.textMuted, lineHeight: 1.4 }}>
                Monaco Editor ile gerçek zamanlı kod yazma ve AI analizi
              </div>
            </div>

            {/* Voice card */}
            <div
              style={{
                flex: 1,
                padding: 20,
                borderRadius: 12,
                border: `1px solid ${colors.amber}30`,
                background: `linear-gradient(180deg, ${colors.amber}10, ${colors.bg})`,
                opacity: item2.opacity,
                transform: `translateY(${item2.y}px)`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎤</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                Sesli Mülakat
              </div>
              <div style={{ fontFamily: fontBody, fontSize: 12, color: colors.textMuted, lineHeight: 1.4 }}>
                Türkçe AI mülakatçısı ile gerçek zamanlı sesli etkileşim
              </div>
            </div>

            {/* System Design card */}
            <div
              style={{
                flex: 1,
                padding: 20,
                borderRadius: 12,
                border: `1px solid ${colors.purple}30`,
                background: `linear-gradient(180deg, ${colors.purple}10, ${colors.bg})`,
                opacity: item3.opacity,
                transform: `translateY(${item3.y}px)`,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏗️</div>
              <div style={{ fontFamily: fontDisplay, fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                Sistem Tasarımı
              </div>
              <div style={{ fontFamily: fontBody, fontSize: 12, color: colors.textMuted, lineHeight: 1.4 }}>
                tldraw beyaz tahta ile mimari tasarım ve geri bildirim
              </div>
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: fontBody,
            fontSize: 20,
            color: colors.textSecondary,
            textAlign: "center",
            opacity: subSpring,
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          Gerçek zamanlı Türkçe sesli AI mülakatçısı • Canlı kod editörü • Kişiselleştirilmiş geri bildirim
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
