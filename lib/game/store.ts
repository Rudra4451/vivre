import { create } from "zustand";
import { updateSoundSettingsAction } from "./actions";

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
  hydrateFromProfile: (soundEnabled: boolean, calmMode: boolean) => void;
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
        // Persist to database server-side asynchronously
        updateSoundSettingsAction({ soundEnabled: next }).catch(() => {});
        return { soundEnabled: next };
      }),

    setSoundEnabled: (enabled: boolean) => {
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
      } catch {}
      updateSoundSettingsAction({ soundEnabled: enabled }).catch(() => {});
      set({ soundEnabled: enabled });
    },

    toggleCalmMode: () =>
      set((state) => {
        const next = !state.calmMode;
        try {
          localStorage.setItem(CALM_MODE_STORAGE_KEY, String(next));
          if (typeof document !== "undefined") {
            document.documentElement.dataset.calmMode = String(next);
            document.documentElement.classList.toggle("calm-mode", next);
          }
        } catch {}
        // Persist to database server-side asynchronously
        updateSoundSettingsAction({ calmMode: next }).catch(() => {});
        return { calmMode: next };
      }),

    setCalmMode: (enabled: boolean) => {
      try {
        localStorage.setItem(CALM_MODE_STORAGE_KEY, String(enabled));
        if (typeof document !== "undefined") {
          document.documentElement.dataset.calmMode = String(enabled);
          document.documentElement.classList.toggle("calm-mode", enabled);
        }
      } catch {}
      updateSoundSettingsAction({ calmMode: enabled }).catch(() => {});
      set({ calmMode: enabled });
    },

    hydrateFromProfile: (soundEnabled: boolean, calmMode: boolean) => {
      try {
        localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
        localStorage.setItem(CALM_MODE_STORAGE_KEY, String(calmMode));
        if (typeof document !== "undefined") {
          document.documentElement.dataset.calmMode = String(calmMode);
          document.documentElement.classList.toggle("calm-mode", calmMode);
        }
      } catch {}
      set({ soundEnabled, calmMode });
    },

    setActiveModal: (modal) => set({ activeModal: modal }),
  };
});
