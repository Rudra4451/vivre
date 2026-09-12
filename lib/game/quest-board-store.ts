import { create } from "zustand";
import type { AuthoritativeProgressionState, AuthoritativeReversalState } from "@/types";

export interface ActiveUndoState {
  completionId: string;
  taskId: string;
  expiresAt: number;
}

export interface AuthoritativeProfileOverride {
  level: number;
  currentXp: number;
  xpToNext: number;
  currentStreak: number;
  longestStreak: number;
  streakShieldAvailable: boolean;
  streakShieldRefillAt?: string | null;
}

export interface CelebrationData {
  xpAwarded: number;
  bonusRoll: string;
  multiplier?: number;
  leveledUp: boolean;
  newLevel?: number;
  category: string;
}

interface QuestBoardStoreState {
  // Set of task IDs currently completing (disables clicks)
  completingTaskIds: Record<string, boolean>;
  // Active 5-second undo state
  activeUndo: ActiveUndoState | null;
  // Offline pending sync tasks
  pendingSyncTaskIds: Record<string, boolean>;
  // In-theme retryable error banner
  activeError: string | null;
  // Authoritative server profile overrides
  authoritativeProfile: AuthoritativeProfileOverride | null;
  // Celebration notification modal / toast
  celebration: CelebrationData | null;

  // Actions
  startCompleting: (taskId: string) => boolean;
  finishCompleting: (taskId: string) => void;
  setUndo: (completionId: string, taskId: string, durationMs?: number) => void;
  clearUndo: () => void;
  setPendingSync: (taskId: string, isPending: boolean) => void;
  setActiveError: (error: string | null) => void;
  reconcileServerState: (
    data: AuthoritativeProgressionState | AuthoritativeReversalState
  ) => void;
  setCelebration: (data: CelebrationData | null) => void;
  clearCelebration: () => void;
}

export const useQuestBoardStore = create<QuestBoardStoreState>((set, get) => ({
  completingTaskIds: {},
  activeUndo: null,
  pendingSyncTaskIds: {},
  activeError: null,
  authoritativeProfile: null,
  celebration: null,

  startCompleting: (taskId: string) => {
    const current = get().completingTaskIds;
    if (current[taskId]) {
      // Already completing: reject repeat clicks
      return false;
    }
    set({
      completingTaskIds: { ...current, [taskId]: true },
      activeError: null,
    });
    return true;
  },

  finishCompleting: (taskId: string) => {
    const next = { ...get().completingTaskIds };
    delete next[taskId];
    set({ completingTaskIds: next });
  },

  setUndo: (completionId: string, taskId: string, durationMs = 5000) => {
    set({
      activeUndo: {
        completionId,
        taskId,
        expiresAt: Date.now() + durationMs,
      },
    });
  },

  clearUndo: () => {
    set({ activeUndo: null });
  },

  setPendingSync: (taskId: string, isPending: boolean) => {
    const next = { ...get().pendingSyncTaskIds };
    if (isPending) {
      next[taskId] = true;
    } else {
      delete next[taskId];
    }
    set({ pendingSyncTaskIds: next });
  },

  setActiveError: (error: string | null) => {
    set({ activeError: error });
  },

  reconcileServerState: (data) => {
    set({
      authoritativeProfile: {
        level: data.level,
        currentXp: data.current_xp,
        xpToNext: data.xp_to_next,
        currentStreak: data.current_streak,
        longestStreak: data.longest_streak,
        streakShieldAvailable: data.streak_shield_available,
      },
    });
  },

  setCelebration: (celebration: CelebrationData | null) => {
    set({ celebration });
  },

  clearCelebration: () => {
    set({ celebration: null });
  },
}));
