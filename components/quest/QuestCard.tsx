"use client";

import * as React from "react";
import type { Task } from "@/types";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface QuestCardProps {
  quest: Task;
  onSelect?: (questId: string) => void;
}

export function QuestCard({ quest, onSelect }: QuestCardProps) {
  const isCompleted = false; // We would need task_completions to know this
  const rewardXp = 100; // Default or calculated based on category

  return (
    <Card className="flex flex-col justify-between border-slate-800/80 bg-slate-900/40 hover:border-sky-500/30 transition-all">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
            {quest.category}
          </span>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            +{rewardXp} XP
          </span>
        </div>
        <CardTitle className="text-base text-slate-100">{quest.title}</CardTitle>
        <CardDescription className="mt-1 text-xs text-slate-400">
          A {quest.is_recurring ? "recurring" : "one-time"} task.
        </CardDescription>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Status: {isCompleted ? "Completed" : "Available"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect?.(quest.id)}
          disabled={isCompleted}
          className="text-xs"
        >
          {isCompleted ? "Resolved" : "Examine"}
        </Button>
      </div>
    </Card>
  );
}
