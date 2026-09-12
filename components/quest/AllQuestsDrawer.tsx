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
        className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-900/60 transition-all"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span>Quadrant Archive</span>
          <span className="font-mono text-[10px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded-full">
            +{remainingQuests.length} secondary quests
          </span>
        </span>
        <span className="text-slate-400 transition-transform duration-200" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
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
