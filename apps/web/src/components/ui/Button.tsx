import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-amber text-bg hover:bg-amber-light active:bg-amber-dim font-semibold glow-amber-sm hover:glow-amber",
  secondary:
    "bg-surface-raised text-text border border-border hover:border-amber/40 hover:bg-surface-overlay",
  ghost:
    "bg-transparent text-text-secondary hover:text-text hover:bg-surface-raised",
  danger:
    "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-lg font-body
        transition-colors transition-shadow duration-150
        disabled:opacity-50 disabled:pointer-events-none
        cursor-pointer
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span>Yükleniyor…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
