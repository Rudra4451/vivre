import { create } from "zustand";

export interface AnnouncementItem {
  id: string;
  message: string;
  priority: "polite" | "assertive";
  timestamp: number;
}

interface AnnouncementStoreState {
  currentPolite: string;
  currentAssertive: string;
  history: AnnouncementItem[];
  announce: (message: string, priority?: "polite" | "assertive") => void;
  clear: () => void;
}

export const useAnnouncementStore = create<AnnouncementStoreState>((set) => ({
  currentPolite: "",
  currentAssertive: "",
  history: [],

  announce: (message: string, priority = "polite") => {
    const item: AnnouncementItem = {
      id: crypto.randomUUID(),
      message,
      priority,
      timestamp: Date.now(),
    };

    set((state) => ({
      currentPolite: priority === "polite" ? message : state.currentPolite,
      currentAssertive: priority === "assertive" ? message : state.currentAssertive,
      history: [item, ...state.history].slice(0, 20),
    }));
  },

  clear: () => set({ currentPolite: "", currentAssertive: "" }),
}));

/**
 * High-level helper methods for authoritative game events.
 */
export const AtlasAnnounce = {
  xpGained: (amount: number, category: string) => {
    useAnnouncementStore.getState().announce(
      `Earned ${amount} XP in ${category} quadrant.`,
      "polite"
    );
  },

  criticalBonus: (multiplier: number = 1.0, rollName: string) => {
    useAnnouncementStore.getState().announce(
      `Critical alignment achieved! ${rollName} roll awarded a ${multiplier}x multiplier.`,
      "polite"
    );
  },

  levelUp: (newLevel: number) => {
    useAnnouncementStore.getState().announce(
      `Ascension confirmed! You have reached Level ${newLevel}. New coordinates unlocked in the star atlas.`,
      "assertive"
    );
  },

  streakShieldUsed: (streakCount: number) => {
    useAnnouncementStore.getState().announce(
      `Streak shield deployed! Your ${streakCount}-day celestial streak is preserved.`,
      "polite"
    );
  },
};
