/**
 * Wingman Design Tokens — mirroring the web app's design system
 */

export const colors = {
  bg: "#07070a",
  surface: "#0f0f14",
  surfaceRaised: "#16161d",
  surfaceOverlay: "#1c1c25",
  border: "#27272f",
  borderSubtle: "#1e1e26",

  text: "#ededef",
  textSecondary: "#8b8b96",
  textMuted: "#55555f",

  amber: "#e5a10e",
  amberLight: "#f5c842",
  amberDim: "#a3720a",
  amberGlow: "rgba(229, 161, 14, 0.12)",

  danger: "#ef4444",
  success: "#22c55e",
  info: "#3b82f6",
  purple: "#8b5cf6",
} as const;

export const fonts = {
  display: '"Bricolage Grotesque", serif',
  body: '"DM Sans", sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;
