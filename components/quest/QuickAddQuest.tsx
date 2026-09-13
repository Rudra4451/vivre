"use client";

import * as React from "react";
import { guessCategory, CATEGORY_METAS, type QuestCategory } from "@/lib/game/category-guesser";
import { createTaskAction } from "@/lib/game/actions";
import { saveLocalOfflineTask } from "@/lib/game/offline-queue";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { Button } from "@/components/ui/Button";
import type { Task } from "@/types";

export interface QuickAddQuestProps {
  userId: string;
  onTaskAdded?: (task: Task) => void;
}

const CATEGORIES: QuestCategory[] = ["Body", "Mind", "Discipline", "Craft", "Spirit"];

export function QuickAddQuest({ userId, onTaskAdded }: QuickAddQuestProps) {
  const [title, setTitle] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<QuestCategory>("Discipline");
  const [userManuallySelected, setUserManuallySelected] = React.useState(false);
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const setActiveError = useQuestBoardStore((s) => s.setActiveError);

  const effectiveCategory: QuestCategory = userManuallySelected
    ? selectedCategory
    : title.trim().length > 0
    ? guessCategory(title)
    : selectedCategory;

  const handleCategoryClick = (cat: QuestCategory) => {
    setSelectedCategory(cat);
    setUserManuallySelected(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!userManuallySelected && val.trim().length > 0) {
      setSelectedCategory(guessCategory(val));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || isSubmitting) return;

    setIsSubmitting(true);
    setActiveError(null);

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    if (isOffline) {
      const localTask: Task = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: cleanTitle,
        category: effectiveCategory,
        is_recurring: isRecurring,
        archived_at: null,
        created_at: new Date().toISOString(),
      };

      try {
        await saveLocalOfflineTask(localTask);
        onTaskAdded?.(localTask);
        setTitle("");
        setUserManuallySelected(false);
      } catch (err) {
        setActiveError("Failed to store task locally while offline");
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const res = await createTaskAction({
        title: cleanTitle,
        category: effectiveCategory,
        isRecurring,
      });

      if (!res.success || !res.task) {
        setActiveError(res.error ?? "Failed to initialize quest");
        return;
      }

      onTaskAdded?.(res.task);
      setTitle("");
      setUserManuallySelected(false);
    } catch (err) {
      setActiveError("An unexpected error occurred while adding the quest");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Quick assign new quest"
      className="rounded-xl border border-atlas-line bg-atlas-surface p-4 sm:p-5 shadow-xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Text Input with accessible label */}
        <div className="relative flex-1">
          <label htmlFor="quick-add-title" className="sr-only">
            New objective title
          </label>
          <input
            id="quick-add-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            aria-label="New objective title"
            placeholder="Assign new objective (e.g. 5km morning run, Deep reading 30 min, Ship feature...)"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-atlas-line bg-atlas-bg px-4 py-2 text-sm text-atlas-ink placeholder-atlas-muted/70 focus-visible:border-atlas-ink/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-atlas-ink/30 transition-colors"
          />
          {title.trim().length > 0 && !userManuallySelected && (
            <span className="absolute right-3 top-2 text-[10px] font-mono uppercase bg-atlas-surface border border-atlas-line text-atlas-muted px-2 py-0.5 rounded pointer-events-none">
              Auto: {effectiveCategory}
            </span>
          )}
        </div>

        {/* Submit Button (Primary Ink) */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting || !title.trim()}
          className="shrink-0"
          aria-label={isSubmitting ? "Assigning objective..." : "Assign objective to quest board"}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border-2 border-atlas-bg/30 border-t-atlas-bg animate-spin" />
              Assigning...
            </span>
          ) : (
            <span>+ Assign Objective</span>
          )}
        </Button>
      </div>

      {/* Category Pills & Recurring Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-atlas-line-subtle text-xs">
        <div
          role="group"
          aria-label="Quadrant Selection"
          className="flex flex-wrap items-center gap-1.5"
        >
          <span className="text-atlas-muted mr-1 text-[11px] font-mono uppercase tracking-wider">
            Quadrant:
          </span>
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_METAS[cat];
            const isSelected = effectiveCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Select ${cat} quadrant, awards ${meta.baseXp} XP`}
                onClick={() => handleCategoryClick(cat)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-mono text-xs transition-all focus-visible:ring-2 focus-visible:ring-atlas-ink/40 focus-visible:outline-none ${
                  isSelected
                    ? "bg-atlas-surface-elevated text-atlas-ink border border-atlas-line font-bold shadow-xs"
                    : "bg-atlas-surface text-atlas-muted hover:text-atlas-ink border border-transparent"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{cat}</span>
                <span className="opacity-60 text-[10px]">+{meta.baseXp}</span>
              </button>
            );
          })}
        </div>

        {/* Recurring Toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-atlas-muted hover:text-atlas-ink text-xs select-none font-mono">
          <input
            type="checkbox"
            checked={isRecurring}
            aria-label="Make this objective a recurring routine"
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-atlas-line bg-atlas-bg text-atlas-ink focus:ring-atlas-ink"
          />
          <span>Recurring Routine</span>
        </label>
      </div>
    </form>
  );
}
