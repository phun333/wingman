import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../theme";
import { fontDisplay, fontBody } from "../fonts";

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  delay?: number;
  index?: number;
};

/**
 * Animated feature card with icon, matching Wingman's UI aesthetic
 */
export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay = 0,
  index = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    delay,
    config: { damping: 200 },
  });

  const translateY = interpolate(entrance, [0, 1], [40, 0]);
  const opacity = entrance;

  // Subtle shimmer on border
  const shimmer = interpolate(
    frame,
    [delay, delay + 60, delay + 120],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const borderColor = interpolate(shimmer, [0, 1], [0.15, 0.4]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: 32,
        borderRadius: 16,
        border: `1px solid rgba(229, 161, 14, ${borderColor})`,
        background: `linear-gradient(180deg, ${colors.surfaceRaised} 0%, ${colors.surface} 100%)`,
        opacity,
        transform: `translateY(${translateY}px)`,
        width: 360,
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 ${shimmer * 30}px ${colors.amberGlow}`,
      }}
    >
      {/* Icon circle */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${colors.amber}20, ${colors.amber}08)`,
          border: `1px solid ${colors.amber}30`,
          fontSize: 28,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontFamily: fontDisplay,
          fontSize: 22,
          fontWeight: 700,
          color: colors.text,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontFamily: fontBody,
          fontSize: 16,
          fontWeight: 400,
          color: colors.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </div>
  );
};
