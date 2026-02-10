import type { ReactNode } from "react";

type BadgeVariant = "default" | "amber" | "success" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-surface-raised text-text-secondary border-border",
  amber: "bg-amber/10 text-amber border-amber/20",
  success: "bg-success/10 text-success border-success/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  info: "bg-info/10 text-info border-info/20",
};

export function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-md border px-2 py-0.5
        text-xs font-medium
        ${variants[variant]}
      `}
    >
      {children}
    </span>
  );
}
