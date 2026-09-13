import * as React from "react";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Telemetry Error",
  message,
  onRetry,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border border-atlas-danger/40 bg-atlas-surface p-5 text-atlas-ink shadow-xs ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-atlas-danger/10 text-atlas-danger text-sm font-bold">
            ⚠️
          </span>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-atlas-danger">
              {title}
            </h4>
            <p className="mt-1 text-xs text-atlas-muted leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0 text-xs">
            Retry Action
          </Button>
        )}
      </div>
    </div>
  );
}
