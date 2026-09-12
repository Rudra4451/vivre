"use client";

import * as React from "react";
import type { Task, AuthoritativeProgressionState } from "@/types";
import { QuickAddQuest } from "./QuickAddQuest";
import { QuestCard } from "./QuestCard";
import { AllQuestsDrawer } from "./AllQuestsDrawer";
import { QuestEmptyState } from "./QuestEmptyState";
import { QuestErrorBanner } from "./QuestErrorBanner";
import { QuestUndoBanner } from "./QuestUndoBanner";
import { QuestCelebrationModal } from "./QuestCelebrationModal";
import { syncOfflineQueue, getLocalOfflineTasks } from "@/lib/game/offline-queue";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";

export interface QuestBoardProps {
  userId: string;
  initialTasks: Task[];
  initialCompletedTaskIds?: string[];
}

export function QuestBoard({
  userId,
  initialTasks,
  initialCompletedTaskIds = [],
}: QuestBoardProps) {
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [completedMap, setCompletedMap] = React.useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const id of initialCompletedTaskIds) {
      map[id] = true;
    }
    return map;
  });

  const reconcileServerState = useQuestBoardStore((s) => s.reconcileServerState);
  const setPendingSync = useQuestBoardStore((s) => s.setPendingSync);

  // Sync offline tasks and completions on mount and when connection is restored
  React.useEffect(() => {
    const handleSync = async () => {
      // 1. Load any pending local tasks
      const localTasks = await getLocalOfflineTasks();
      if (localTasks.length > 0) {
        setTasks((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const toAdd = localTasks.filter((t) => !existingIds.has(t.id));
          return [...toAdd, ...prev];
        });
      }

      // 2. Sync pending completions with server
      await syncOfflineQueue(
        (syncedState: AuthoritativeProgressionState) => {
          reconcileServerState(syncedState);
          setCompletedMap((prev) => ({ ...prev, [syncedState.task_id]: true }));
          setPendingSync(syncedState.task_id, false);
        },
        (oldId: string, newTask: Task) => {
          setTasks((prev) => prev.map((t) => (t.id === oldId ? newTask : t)));
        }
      );
    };

    handleSync();

    const onOnline = () => handleSync();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [reconcileServerState, setPendingSync]);

  const handleTaskAdded = (newTask: Task) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleCompletionReconciled = (res: AuthoritativeProgressionState) => {
    setCompletedMap((prev) => ({ ...prev, [res.task_id]: true }));
  };

  const handleUndoReconciled = (taskId: string) => {
    setCompletedMap((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  // Sort: uncompleted first, then completed today
  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aDone = !!completedMap[a.id];
      const bDone = !!completedMap[b.id];
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });
  }, [tasks, completedMap]);

  // Main board: maximum 7 visible by default
  const prioritizedQuests = sortedTasks.slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      <QuestErrorBanner />

      {/* Quick Add Form */}
      <QuickAddQuest userId={userId} onTaskAdded={handleTaskAdded} />

      {/* Main Quest Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 tracking-tight">
              Active Objectives
            </h2>
            <span className="font-mono text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
              {tasks.length} Total
            </span>
          </div>

          <span className="text-xs text-slate-400">
            Top {Math.min(7, prioritizedQuests.length)} prioritized
          </span>
        </div>

        {tasks.length === 0 ? (
          <QuestEmptyState />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prioritizedQuests.map((quest) => (
                <QuestCard
                  key={quest.id}
                  quest={quest}
                  isCompletedToday={!!completedMap[quest.id]}
                  onCompletionReconciled={handleCompletionReconciled}
                />
              ))}
            </div>

            {/* Secondary Collapsed View All */}
            <AllQuestsDrawer
              allQuests={sortedTasks}
              completedTaskIds={completedMap}
              onCompletionReconciled={handleCompletionReconciled}
            />
          </>
        )}
      </div>

      {/* 5-second Compensating Undo Notification Banner */}
      <QuestUndoBanner onUndoReconciled={handleUndoReconciled} />

      {/* Celebration Level-Up Modal */}
      <QuestCelebrationModal />
    </div>
  );
}
