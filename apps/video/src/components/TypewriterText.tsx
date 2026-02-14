import type React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

type TypewriterTextProps = {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  style?: React.CSSProperties;
  cursorColor?: string;
};

/**
 * Typewriter effect — reveals text character by character
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 0.5,
  style,
  cursorColor = "#e5a10e",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = Math.max(0, frame - startFrame);
  const charCount = Math.min(Math.floor(elapsed * charsPerFrame), text.length);
  const displayText = text.slice(0, charCount);
  const isComplete = charCount >= text.length;

  // Blinking cursor
  const cursorVisible = !isComplete || Math.floor(frame / (fps * 0.5)) % 2 === 0;

  return (
    <span style={style}>
      {displayText}
      {!isComplete && (
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: "0.9em",
            backgroundColor: cursorVisible ? cursorColor : "transparent",
            marginLeft: 2,
            verticalAlign: "text-bottom",
          }}
        />
      )}
    </span>
  );
};
