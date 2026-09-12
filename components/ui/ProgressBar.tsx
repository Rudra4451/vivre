import * as React from "react";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  label?: string;
  variant?: "default" | "reward" | "success";
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  value,
  label,
  variant = "default",
  size = "md",
  className = "",
  ...props
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  const fillClasses = {
    default: "bg-atlas-ink",
    reward: "bg-atlas-reward shadow-[0_0_10px_var(--atlas-reward-subtle)]",
    success: "bg-atlas-success",
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`} {...props}>
      {label && (
        <div className="flex justify-between text-xs text-atlas-muted font-medium">
          <span>{label}</span>
          <span className="font-mono">{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progress"}
        className={`w-full overflow-hidden rounded-full bg-atlas-surface-elevated border border-atlas-line p-0.5 ${sizeClasses[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${fillClasses[variant]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
