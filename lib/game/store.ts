import { create } from "zustand";

const CALM_MODE_STORAGE_KEY = "vivre-calm-mode";
const SOUND_STORAGE_KEY = "vivre-sound-enabled";

interface UIStoreState {
  soundEnabled: boolean;
  calmMode: boolean;
  activeModal: string | null;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleCalmMode: () => void;
  setCalmMode: (enabled: boolean) => void;
  setActiveModal: (modal: string | null) => void;
}

export const useUIStore = create<UIStoreState>((set) => {
  // Read initial states safely in browser
  const initialCalm =
    typeof window !== "undefined"
      ? localStorage.getItem(CALM_MODE_STORAGE_KEY) === "true"
      : false;

  const initialSound =
    typeof window !== "undefined"
      ? localStorage.getItem(SOUND_STORAGE_KEY) !== "false"
      : true;

  return {
    soundEnabled: initialSound,
    calmMode: initialCalm,
    activeModal: null,

    toggleSound: () =>
      set((state) => {
        const next = !state.soundEnabled;
        try {
          localStorage.setItem(SOUND_STORAGE_KEY, String(next));
        } catch {}
        return { soundEnabled: next };
      }),

    setSoundEnabled: (enabled: boolean) => {
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
      } catch {}
      set({ soundEnabled: enabled });
    },

    toggleCalmMode: () =>
      set((state) => {
        const next = !state.calmMode;
        try {
          localStorage.setItem(CALM_MODE_STORAGE_KEY, String(next));
        } catch {}
        return { calmMode: next };
      }),

    setCalmMode: (enabled: boolean) => {
      try {
        localStorage.setItem(CALM_MODE_STORAGE_KEY, String(enabled));
      } catch {}
      set({ calmMode: enabled });
    },

    setActiveModal: (modal) => set({ activeModal: modal }),
  };
});
