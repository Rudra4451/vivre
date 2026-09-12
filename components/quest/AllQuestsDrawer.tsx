"use client";

import * as React from "react";
import type { Task, AuthoritativeProgressionState } from "@/types";
import { QuestCard } from "./QuestCard";

export interface AllQuestsDrawerProps {
  allQuests: Task[];
  completedTaskIds: Record<string, boolean>;
  onCompletionReconciled?: (result: AuthoritativeProgressionState) => void;
}

export function AllQuestsDrawer({
  allQuests,
  completedTaskIds,
  onCompletionReconciled,
}: AllQuestsDrawerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (allQuests.length <= 7) {
    return null;
  }

  const remainingQuests = allQuests.slice(7);

  return (
    <div className="space-y-4 pt-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-xl border border-atlas-line bg-atlas-surface px-4 py-2.5 text-xs font-semibold text-atlas-ink hover:bg-atlas-surface-hover transition-all"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="font-display">Secondary Atlas Log</span>
          <span className="font-mono text-[10px] bg-atlas-surface-elevated border border-atlas-line text-atlas-muted px-2 py-0.5 rounded">
            +{remainingQuests.length} directives
          </span>
        </span>
        <span
          className="text-atlas-muted transition-transform duration-200 text-[10px]"
          style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {remainingQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              isCompletedToday={!!completedTaskIds[quest.id]}
              onCompletionReconciled={onCompletionReconciled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
