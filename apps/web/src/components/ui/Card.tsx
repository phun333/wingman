import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({
  children,
  hover = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl border border-border-subtle bg-surface p-5
        ${hover ? "transition-all duration-200 hover:border-amber/30 hover:glow-amber-sm cursor-pointer" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-lg font-semibold text-text">{children}</h3>
  );
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-secondary mt-1">{children}</p>;
}
