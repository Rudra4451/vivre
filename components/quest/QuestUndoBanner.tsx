"use client";

import * as React from "react";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { reverseCompletion } from "@/lib/game/actions";
import { Button } from "@/components/ui/Button";

export interface QuestUndoBannerProps {
  onUndoReconciled?: (taskId: string) => void;
}

export function QuestUndoBanner({ onUndoReconciled }: QuestUndoBannerProps) {
  const activeUndo = useQuestBoardStore((s) => s.activeUndo);
  const clearUndo = useQuestBoardStore((s) => s.clearUndo);
  const reconcileServerState = useQuestBoardStore((s) => s.reconcileServerState);
  const setActiveError = useQuestBoardStore((s) => s.setActiveError);

  const [remainingMs, setRemainingMs] = React.useState(5000);
  const [isReversing, setIsReversing] = React.useState(false);

  React.useEffect(() => {
    if (!activeUndo) return;

    const updateTimer = () => {
      const remaining = Math.max(0, activeUndo.expiresAt - Date.now());
      setRemainingMs(remaining);

      if (remaining <= 0) {
        clearUndo();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [activeUndo, clearUndo]);

  if (!activeUndo || remainingMs <= 0) {
    return null;
  }

  const seconds = (remainingMs / 1000).toFixed(1);
  const progressPercent = Math.max(0, (remainingMs / 5000) * 100);

  const handleUndo = async () => {
    if (isReversing) return;
    setIsReversing(true);

    try {
      const res = await reverseCompletion({
        completionId: activeUndo.completionId,
      });

      if (!res.success || !res.data) {
        setActiveError(res.error ?? "Failed to reverse completion.");
        clearUndo();
        return;
      }

      reconcileServerState(res.data);
      onUndoReconciled?.(activeUndo.taskId);
      clearUndo();
    } catch (err) {
      console.error("[Undo] Reversal network error:", err);
      setActiveError("A network error occurred while reversing the quest.");
    } finally {
      setIsReversing(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <div className="relative overflow-hidden rounded-xl border border-atlas-line bg-atlas-surface p-4 text-atlas-ink shadow-lg transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-atlas-line bg-atlas-surface-elevated text-atlas-ink text-xs font-mono">
              ✓
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-atlas-ink">
                Objective Completed
              </div>
              <div className="text-[11px] font-mono text-atlas-muted">
                Authoritative record saved ({seconds}s)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={isReversing}
              className="text-xs font-mono"
            >
              {isReversing ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-atlas-ink/30 border-t-atlas-ink animate-spin" />
                  <span>Reversing...</span>
                </>
              ) : (
                <>
                  <span>↺</span>
                  <span>Undo</span>
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={clearUndo}
              className="text-atlas-muted hover:text-atlas-ink p-1 text-xs"
              aria-label="Dismiss undo notification"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 5-second countdown progress line */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-atlas-surface-elevated">
          <div
            className="h-full bg-atlas-ink transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
