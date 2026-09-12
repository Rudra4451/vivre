import * as React from "react";

export interface ToastProps {
  type?: "info" | "success" | "warning" | "danger" | "reward";
  title: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({
  type = "info",
  title,
  message,
  onDismiss,
  className = "",
}: ToastProps) {
  const typeStyles = {
    info: "border-atlas-line bg-atlas-surface text-atlas-ink",
    success: "border-atlas-success/40 bg-atlas-surface text-atlas-ink",
    warning: "border-atlas-warning/40 bg-atlas-surface text-atlas-ink",
    danger: "border-atlas-danger/40 bg-atlas-surface text-atlas-ink",
    reward: "border-atlas-reward/50 bg-atlas-surface text-atlas-ink shadow-[0_0_20px_var(--atlas-reward-subtle)]",
  };

  const iconByType = {
    info: "✦",
    success: "✓",
    warning: "⚠️",
    danger: "✕",
    reward: "🌟",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 shadow-md backdrop-blur-none transition-all ${typeStyles[type]} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-atlas-surface-elevated text-xs">
          {iconByType[type]}
        </span>
        <div>
          <div className="text-xs font-semibold text-atlas-ink">{title}</div>
          {message && <div className="mt-0.5 text-xs text-atlas-muted">{message}</div>}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-atlas-muted hover:text-atlas-ink text-xs p-1"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
