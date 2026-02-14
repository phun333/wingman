import type React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";

/**
 * Animated dark background with subtle grain and floating amber orbs
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Slow-moving gradient orbs
  const orb1X = width * 0.3 + Math.sin(frame * 0.008) * 120;
  const orb1Y = height * 0.4 + Math.cos(frame * 0.006) * 80;
  const orb2X = width * 0.7 + Math.cos(frame * 0.01) * 100;
  const orb2Y = height * 0.6 + Math.sin(frame * 0.007) * 90;
  const orb3X = width * 0.5 + Math.sin(frame * 0.005) * 150;
  const orb3Y = height * 0.2 + Math.cos(frame * 0.009) * 60;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Amber glow orbs */}
      <div
        style={{
          position: "absolute",
          left: orb1X - 200,
          top: orb1Y - 200,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.amber}15 0%, transparent 70%)`,
          filter: "blur(80px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: orb2X - 250,
          top: orb2Y - 250,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.amber}10 0%, transparent 70%)`,
          filter: "blur(100px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: orb3X - 180,
          top: orb3Y - 180,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.purple}12 0%, transparent 70%)`,
          filter: "blur(90px)",
        }}
      />

      {/* Grid pattern overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          backgroundImage: `
            linear-gradient(${colors.border} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.border} 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, ${colors.bg} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
