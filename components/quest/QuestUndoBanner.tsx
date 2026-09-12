"use client";

import * as React from "react";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { reverseCompletion } from "@/lib/game/actions";

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

      // Reconcile server state
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
      <div className="relative overflow-hidden rounded-2xl border border-sky-500/40 bg-slate-900/95 p-4 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.5)] border-t-sky-400">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm">
              ✓
            </span>
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Quest Completed!
              </div>
              <div className="text-xs text-slate-400">
                Authoritative record saved ({seconds}s)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={isReversing}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md hover:from-amber-400 hover:to-rose-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50 transition-all"
            >
              {isReversing ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Reversing...</span>
                </>
              ) : (
                <>
                  <span>↺</span>
                  <span>Undo</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={clearUndo}
              className="text-slate-500 hover:text-slate-300 p-1 text-xs"
              aria-label="Dismiss undo notification"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 5-second countdown progress line */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
