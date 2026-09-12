"use client";

import * as React from "react";
import { guessCategory, CATEGORY_METAS, type QuestCategory } from "@/lib/game/category-guesser";
import { createTaskAction } from "@/lib/game/actions";
import { saveLocalOfflineTask } from "@/lib/game/offline-queue";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
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

  // Derived category: auto-guess from title unless pilot manually picked a category
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
      // Local-only task creation when offline
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
      className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 sm:p-5 backdrop-blur-md shadow-lg space-y-4"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Text Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Assign new objective (e.g. 5km morning run, Deep reading 30 min, Ship feature...)"
            disabled={isSubmitting}
            className="w-full rounded-xl border border-slate-700/70 bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
          />
          {title.trim().length > 0 && !userManuallySelected && (
            <span className="absolute right-3 top-2.5 text-[10px] font-mono uppercase bg-slate-800/80 text-sky-400 px-2 py-0.5 rounded border border-slate-700/60 pointer-events-none">
              Auto: {effectiveCategory}
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Assigning...
            </span>
          ) : (
            <span>+ Assign Quest</span>
          )}
        </button>
      </div>

      {/* Category Pills & Recurring Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/40 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 mr-1 text-[11px] font-medium uppercase tracking-wider">
            Quadrant:
          </span>
          {CATEGORIES.map((cat) => {
            const meta = CATEGORY_METAS[cat];
            const isSelected = effectiveCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all text-xs ${
                  isSelected
                    ? `${meta.badgeBg} ${meta.badgeBorder} ${meta.badgeText} border shadow-[0_0_10px_rgba(56,189,248,0.15)] ring-1 ring-white/10 font-semibold`
                    : "bg-slate-800/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{cat}</span>
                <span className="opacity-60 text-[10px]">+{meta.baseXp}</span>
              </button>
            );
          })}
        </div>

        {/* Recurring Switch */}
        <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 text-xs select-none">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
          />
          <span>Recurring Routine</span>
        </label>
      </div>
    </form>
  );
}
