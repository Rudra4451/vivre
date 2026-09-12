import * as React from "react";
import type { QuestDefinition } from "@/types";
import { QuestCard } from "./QuestCard";

export interface QuestListProps {
  quests: QuestDefinition[];
}

export function QuestList({ quests }: QuestListProps) {
  if (quests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">
        No active quests detected in this quadrant.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {quests.map((quest) => (
        <QuestCard key={quest.id} quest={quest} />
      ))}
    </div>
  );
}
