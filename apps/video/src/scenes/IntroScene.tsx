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

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo entrance — scale + rotate
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);
  const logoRotation = interpolate(logoSpring, [0, 1], [-15, 0]);

  // Logo glow
  const glowPulse = interpolate(
    frame,
    [30, 60, 90, 120],
    [0.3, 0.8, 0.5, 0.7],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Title
  const titleSpring = spring({ frame, fps, delay: 20, config: { damping: 200 } });
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Tagline
  const taglineSpring = spring({ frame, fps, delay: 35, config: { damping: 200 } });
  const taglineY = interpolate(taglineSpring, [0, 1], [20, 0]);

  // Line
  const lineSpring = spring({ frame, fps, delay: 45, config: { damping: 200 } });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 200]);

  // Badge
  const badgeSpring = spring({ frame, fps, delay: 55, config: { damping: 200 } });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.8, 1]);

  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {/* Logo */}
        <div
          style={{
            transform: `scale(${logoScale}) rotate(${logoRotation}deg)`,
            filter: `drop-shadow(0 0 ${40 * glowPulse}px ${colors.amber}60)`,
          }}
        >
          <Img
            src={staticFile("logo.png")}
            style={{ width: 120, height: 120, borderRadius: 28 }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 96,
            fontWeight: 800,
            color: colors.text,
            letterSpacing: "-0.03em",
            opacity: titleSpring,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1,
          }}
        >
          Wing<span style={{ color: colors.amber }}>man</span>
        </div>

        {/* Line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${colors.amber}, transparent)`,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontFamily: fontBody,
            fontSize: 28,
            fontWeight: 500,
            color: colors.textSecondary,
            opacity: taglineSpring,
            transform: `translateY(${taglineY}px)`,
            letterSpacing: "0.01em",
          }}
        >
          Yapay Zeka Destekli Sesli Teknik Mülakat Platformu
        </div>

        {/* Badge — no Sequence wrapper, animated inline */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 100,
            border: `1px solid ${colors.amber}40`,
            background: `linear-gradient(135deg, ${colors.amber}15, ${colors.amber}08)`,
            fontFamily: fontMono,
            fontSize: 16,
            fontWeight: 500,
            color: colors.amber,
            letterSpacing: "0.05em",
            opacity: badgeSpring,
            transform: `scale(${badgeScale})`,
            boxShadow: `0 0 20px ${colors.amberGlow}`,
            marginTop: 8,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: colors.amber,
              boxShadow: `0 0 8px ${colors.amber}`,
            }}
          />
          fal.ai Hackathon 2025
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
