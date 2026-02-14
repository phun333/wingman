import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";
import { fontBody } from "../fonts";

type GlowBadgeProps = {
  text: string;
  delay?: number;
};

/**
 * Animated badge with amber glow — used for tags/labels
 */
export const GlowBadge: React.FC<GlowBadgeProps> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    delay,
    config: { damping: 200 },
  });

  const scale = interpolate(entrance, [0, 1], [0.8, 1]);
  const opacity = entrance;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        borderRadius: 100,
        border: `1px solid ${colors.amber}40`,
        background: `linear-gradient(135deg, ${colors.amber}15, ${colors.amber}08)`,
        backdropFilter: "blur(8px)",
        fontFamily: fontBody,
        fontSize: 18,
        fontWeight: 500,
        color: colors.amber,
        letterSpacing: "0.02em",
        opacity,
        transform: `scale(${scale})`,
        boxShadow: `0 0 20px ${colors.amberGlow}, inset 0 1px 0 ${colors.amber}20`,
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
      {text}
    </div>
  );
};
