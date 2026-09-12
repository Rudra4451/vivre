import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "success" | "warning" | "danger" | "reward";
  size?: "sm" | "md";
}

export function Badge({
  className = "",
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantClasses = {
    default: "bg-atlas-surface text-atlas-ink border border-atlas-line",
    outline: "bg-transparent text-atlas-ink border border-atlas-line",
    success: "bg-atlas-surface text-atlas-success border border-atlas-success/40",
    warning: "bg-atlas-surface text-atlas-warning border border-atlas-warning/40",
    danger: "bg-atlas-surface text-atlas-danger border border-atlas-danger/40",
    // IMPORTANT: Gold is strictly reserved for rewards, milestones, and claims
    reward: "bg-atlas-reward-subtle text-atlas-reward border border-atlas-reward/50 font-bold",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-medium rounded-md uppercase tracking-wider ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
