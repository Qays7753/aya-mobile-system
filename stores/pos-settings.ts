import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type PosContrast = "off" | "soft" | "strong";

type PosSettingsState = {
  displaySize: number;
  contrast: PosContrast;
};

type PosSettingsStore = PosSettingsState & {
  hydrated: boolean;
  set: (next: Partial<PosSettingsState>) => void;
  reset: () => void;
};

export const POS_DISPLAY_SIZE_MIN = 1;
export const POS_DISPLAY_SIZE_MAX = 100;
export const POS_DISPLAY_SIZE_STEP = 5;

export const POS_SETTINGS_DEFAULTS: PosSettingsState = {
  displaySize: 50,
  contrast: "off"
};

export const POS_SETTINGS_STORAGE_KEY = "aya.pos-settings.v2";

function normalizeDisplaySize(value: number) {
  if (!Number.isFinite(value)) {
    return POS_SETTINGS_DEFAULTS.displaySize;
  }

  const clamped = Math.min(POS_DISPLAY_SIZE_MAX, Math.max(POS_DISPLAY_SIZE_MIN, value));

  if (clamped === POS_DISPLAY_SIZE_MIN) {
    return POS_DISPLAY_SIZE_MIN;
  }

  return Math.min(
    POS_DISPLAY_SIZE_MAX,
    Math.max(POS_DISPLAY_SIZE_MIN, Math.round(clamped / POS_DISPLAY_SIZE_STEP) * POS_DISPLAY_SIZE_STEP)
  );
}

export const usePosSettingsStore = create<PosSettingsStore>()(
  persist(
    (set) => ({
      ...POS_SETTINGS_DEFAULTS,
      hydrated: false,
      set(next) {
        set((state) => ({
          ...state,
          contrast: next.contrast ?? state.contrast,
          displaySize:
            next.displaySize === undefined
              ? state.displaySize
              : normalizeDisplaySize(next.displaySize)
        }));
      },
      reset() {
        set((state) => ({
          ...POS_SETTINGS_DEFAULTS,
          hydrated: state.hydrated
        }));
      }
    }),
    {
      name: POS_SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        displaySize: state.displaySize,
        contrast: state.contrast
      }),
      merge: (persistedState, currentState) => {
        const snapshot =
          persistedState && typeof persistedState === "object"
            ? (persistedState as Partial<PosSettingsState>)
            : {};

        return {
          ...currentState,
          contrast:
            snapshot.contrast === "soft" || snapshot.contrast === "strong"
              ? snapshot.contrast
              : currentState.contrast,
          displaySize:
            typeof snapshot.displaySize === "number"
              ? normalizeDisplaySize(snapshot.displaySize)
              : currentState.displaySize,
          hydrated: false
        };
      }
    }
  )
);
