"use client";

import * as React from "react";
import type { Task, AuthoritativeProgressionState } from "@/types";
import { CATEGORY_METAS, type QuestCategory } from "@/lib/game/category-guesser";
import { completeTask } from "@/lib/game/actions";
import { queueOfflineCompletion } from "@/lib/game/offline-queue";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";

export interface QuestCardProps {
  quest: Task;
  isCompletedToday?: boolean;
  onCompletionReconciled?: (result: AuthoritativeProgressionState) => void;
}

export function QuestCard({
  quest,
  isCompletedToday = false,
  onCompletionReconciled,
}: QuestCardProps) {
  const completingTaskIds = useQuestBoardStore((s) => s.completingTaskIds);
  const pendingSyncTaskIds = useQuestBoardStore((s) => s.pendingSyncTaskIds);
  const startCompleting = useQuestBoardStore((s) => s.startCompleting);
  const finishCompleting = useQuestBoardStore((s) => s.finishCompleting);
  const setUndo = useQuestBoardStore((s) => s.setUndo);
  const setPendingSync = useQuestBoardStore((s) => s.setPendingSync);
  const setActiveError = useQuestBoardStore((s) => s.setActiveError);
  const reconcileServerState = useQuestBoardStore((s) => s.reconcileServerState);
  const setCelebration = useQuestBoardStore((s) => s.setCelebration);

  const isCompleting = !!completingTaskIds[quest.id];
  const isPendingSync = !!pendingSyncTaskIds[quest.id];
  const isLocked = isCompleting || isCompletedToday;

  const category = (quest.category in CATEGORY_METAS
    ? quest.category
    : "Discipline") as QuestCategory;
  const meta = CATEGORY_METAS[category];

  const handleComplete = async () => {
    // 1. Guard against repeat / concurrent clicks
    const canProceed = startCompleting(quest.id);
    if (!canProceed) return;

    // 2. Generate cryptographically random UUID idempotency key
    const idempotencyKey = crypto.randomUUID();

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (isOffline) {
      // Offline mode: queue in IndexedDB, show "Pending sync"
      try {
        await queueOfflineCompletion(quest.id, idempotencyKey);
        setPendingSync(quest.id, true);
      } catch (err) {
        console.error("Failed to queue offline completion:", err);
      } finally {
        finishCompleting(quest.id);
      }
      return;
    }

    try {
      // 3. Call Server Action with idempotency key
      const response = await completeTask({
        taskId: quest.id,
        idempotencyKey,
      });

      if (!response.success || !response.data) {
        // Rollback completing state and show retryable error
        setActiveError(response.error ?? "Failed to complete quest.");
        finishCompleting(quest.id);
        return;
      }

      const authoritativeState = response.data;

      // 4. Reconcile strictly using authoritative server response (No client math!)
      reconcileServerState(authoritativeState);
      onCompletionReconciled?.(authoritativeState);

      // 5. Open 5-second server-authoritative Undo window
      if (authoritativeState.completion_id && !authoritativeState.is_duplicate) {
        setUndo(authoritativeState.completion_id, quest.id, 5000);
      }

      // 6. Trigger celebration if leveled up or gained XP
      if (authoritativeState.xp_awarded > 0 || authoritativeState.leveled_up) {
        setCelebration({
          xpAwarded: authoritativeState.xp_awarded,
          bonusRoll: authoritativeState.bonus_roll,
          multiplier: authoritativeState.multiplier,
          leveledUp: authoritativeState.leveled_up,
          newLevel: authoritativeState.level,
          category: quest.category,
        });
      }
    } catch (err) {
      console.error("[QuestCard] Completion network error:", err);
      setActiveError("A network error occurred. Please try again.");
    } finally {
      finishCompleting(quest.id);
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 backdrop-blur-md transition-all duration-300 ${
        isCompleting
          ? "border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_25px_rgba(16,185,129,0.2)] scale-[0.99]"
          : isCompletedToday
          ? "border-slate-800/40 bg-slate-950/40 opacity-60"
          : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 hover:shadow-lg"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText}`}
          >
            <span>{meta.icon}</span>
            <span>{category}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {isPendingSync && (
              <span className="text-[10px] font-mono uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded">
                Pending Sync
              </span>
            )}
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              +{meta.baseXp} XP
            </span>
          </div>
        </div>

        {/* Quest Title */}
        <h3
          className={`text-base font-semibold transition-colors ${
            isCompletedToday
              ? "line-through text-slate-500"
              : "text-slate-100 group-hover:text-white"
          }`}
        >
          {quest.title}
        </h3>

        {quest.is_recurring && (
          <span className="inline-block mt-1 text-[11px] text-slate-500">
            🔄 Recurring Routine
          </span>
        )}
      </div>

      {/* Bottom Completion Action */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-mono">
          {isCompletedToday
            ? "Status: Resolved Today"
            : isCompleting
            ? "Transmitting..."
            : isPendingSync
            ? "Queued Offline"
            : "Status: Active"}
        </span>

        <button
          type="button"
          onClick={handleComplete}
          disabled={isLocked}
          aria-label={`Complete quest: ${quest.title}`}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
            isCompletedToday
              ? "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/40"
              : isCompleting
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-wait animate-pulse"
              : "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-300 hover:from-emerald-500 hover:to-teal-500 hover:text-white hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
          }`}
        >
          {isCompleting ? (
            <>
              <span className="h-3 w-3 rounded-full border-2 border-emerald-400/30 border-t-emerald-400 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : isCompletedToday ? (
            <>
              <span>✓</span>
              <span>Completed</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Complete</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
