import * as React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "✧",
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-atlas-line bg-atlas-surface/60 p-8 sm:p-12 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-atlas-line bg-atlas-surface text-xl text-atlas-muted mb-3 font-mono">
        {icon}
      </div>
      <h3 className="font-display text-base font-bold text-atlas-ink">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-xs text-atlas-muted leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
