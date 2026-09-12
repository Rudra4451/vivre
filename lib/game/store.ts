import { create } from "zustand";

interface UIStoreState {
  soundEnabled: boolean;
  activeModal: string | null;
  toggleSound: () => void;
  setActiveModal: (modal: string | null) => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  soundEnabled: true,
  activeModal: null,
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setActiveModal: (modal) => set({ activeModal: modal }),
}));
