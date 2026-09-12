"use client";

import * as React from "react";
import type { Task, AuthoritativeProgressionState } from "@/types";
import { CATEGORY_METAS, type QuestCategory } from "@/lib/game/category-guesser";
import { completeTask } from "@/lib/game/actions";
import { queueOfflineCompletion } from "@/lib/game/offline-queue";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { Button } from "@/components/ui/Button";

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
      className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-200 ${
        isCompleting
          ? "border-atlas-line-subtle bg-atlas-surface-elevated scale-[0.99] ring-1 ring-atlas-line"
          : isCompletedToday
          ? "border-atlas-line/40 bg-atlas-surface/50 opacity-60"
          : "border-atlas-line bg-atlas-surface hover:border-atlas-muted/60 hover:bg-atlas-surface-hover shadow-xs"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-atlas-line bg-atlas-surface-elevated text-atlas-ink">
            <span>{meta.icon}</span>
            <span>{category}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {isPendingSync && (
              <span className="text-[10px] font-mono uppercase bg-atlas-surface-elevated border border-atlas-warning/40 text-atlas-warning px-2 py-0.5 rounded">
                Pending Sync
              </span>
            )}
            {/* Gold strictly for reward metric */}
            <span className="text-[11px] font-mono text-atlas-reward bg-atlas-reward-subtle px-2 py-0.5 rounded border border-atlas-reward/40 font-bold">
              +{meta.baseXp} XP
            </span>
          </div>
        </div>

        {/* Quest Title */}
        <h3
          className={`font-display text-base font-bold transition-colors leading-snug ${
            isCompletedToday
              ? "line-through text-atlas-muted"
              : "text-atlas-ink"
          }`}
        >
          {quest.title}
        </h3>

        {quest.is_recurring && (
          <span className="inline-block mt-1 text-[11px] font-mono text-atlas-muted">
            ↺ Recurring Routine
          </span>
        )}
      </div>

      {/* Bottom Completion Action */}
      <div className="mt-5 pt-3.5 border-t border-atlas-line-subtle flex items-center justify-between">
        <span className="text-[11px] text-atlas-muted font-mono">
          {isCompletedToday
            ? "Resolved Today"
            : isCompleting
            ? "Transmitting..."
            : isPendingSync
            ? "Queued Offline"
            : "Active Objective"}
        </span>

        <Button
          type="button"
          size="sm"
          variant={isCompletedToday ? "outline" : "secondary"}
          onClick={handleComplete}
          disabled={isLocked}
          aria-label={`Complete quest: ${quest.title}`}
          className="text-xs"
        >
          {isCompleting ? (
            <>
              <span className="h-3 w-3 rounded-full border-2 border-atlas-ink/30 border-t-atlas-ink animate-spin" />
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
        </Button>
      </div>
    </div>
  );
}
