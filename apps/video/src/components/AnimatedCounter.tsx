import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  delay?: number;
  style?: React.CSSProperties;
};

/**
 * Animated counter that counts up to a target value
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  suffix = "",
  prefix = "",
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay,
    config: { damping: 50, stiffness: 80 },
  });

  const displayValue = Math.round(interpolate(progress, [0, 1], [0, value]));

  return (
    <span style={style}>
      {prefix}
      {displayValue.toLocaleString("tr-TR")}
      {suffix}
    </span>
  );
};
