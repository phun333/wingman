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

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, delay: 5, config: { damping: 12, stiffness: 100 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0, 1]);

  const titleSpring = spring({ frame, fps, delay: 15, config: { damping: 200 } });
  const titleY = interpolate(titleSpring, [0, 1], [20, 0]);

  const ctaSpring = spring({ frame, fps, delay: 30, config: { damping: 200 } });
  const ctaScale = interpolate(ctaSpring, [0, 1], [0.9, 1]);

  const glowPulse = interpolate(frame, [30, 60, 90, 120], [0.5, 1, 0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const footerSpring = spring({ frame, fps, delay: 45, config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <Background />

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(229,161,14,${0.06 * glowPulse}) 0%, transparent 70%)`,
          filter: "blur(100px)",
          pointerEvents: "none",
        }}
      />

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
        <div style={{ transform: `scale(${logoScale})` }}>
          <Img
            src={staticFile("logo.png")}
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              filter: `drop-shadow(0 0 30px ${colors.amber}50)`,
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: fontDisplay,
            fontSize: 72,
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

        {/* CTA */}
        <div
          style={{
            fontFamily: fontBody,
            fontSize: 24,
            fontWeight: 600,
            color: colors.bg,
            background: `linear-gradient(135deg, ${colors.amber}, ${colors.amberLight})`,
            padding: "16px 48px",
            borderRadius: 14,
            opacity: ctaSpring,
            transform: `scale(${ctaScale})`,
            boxShadow: `0 4px 24px ${colors.amber}40, 0 0 ${glowPulse * 40}px ${colors.amber}30`,
          }}
        >
          Mülakatına Hazır Ol →
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: fontBody,
            fontSize: 20,
            color: colors.textSecondary,
            opacity: ctaSpring,
            marginTop: 4,
          }}
        >
          Yapay zeka destekli teknik mülakat deneyimi
        </div>
      </AbsoluteFill>

      {/* Footer — absolute bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          opacity: footerSpring,
        }}
      >
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 14,
            color: colors.textMuted,
            letterSpacing: "0.05em",
          }}
        >
          fal.ai Hackathon 2025
        </span>
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            backgroundColor: colors.amber,
          }}
        />
        <span
          style={{
            fontFamily: fontMono,
            fontSize: 14,
            color: colors.textMuted,
          }}
        >
          Freya STT/TTS • OpenRouter • Convex
        </span>
      </div>
    </AbsoluteFill>
  );
};
