import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GridDensity = "comfortable" | "compact";
export type ThumbnailSize = "hidden" | "small" | "medium" | "large";
export type CartPosition = "left" | "right";
export type CartWidth = "standard" | "wide";
export type CartDensity = "comfortable" | "compact";
export type PaymentMethod = "cash" | "card" | "none";
export type FontSize = "standard" | "large" | "extra-large";
export type SearchDefault = "barcode" | "text";

export interface PosSettings {
  // Product Grid
  gridDensity: GridDensity;
  thumbnailSize: ThumbnailSize;
  showSku: boolean;
  showStockCount: boolean;
  showCategoryLabel: boolean;

  // Cart Display
  cartPosition: CartPosition;
  cartWidth: CartWidth;
  cartDensity: CartDensity;

  // Payment Options
  showQuickActions: boolean;
  defaultPaymentMethod: PaymentMethod;

  // Visual & Accessibility
  fontSize: FontSize;
  highContrast: boolean;
  reducedMotion: boolean;

  // Workflow
  autoPrintReceipt: boolean;
  autoClearCart: boolean;
  searchDefault: SearchDefault;
}

interface PosSettingsStore {
  settings: PosSettings;
  updateSettings: (newSettings: Partial<PosSettings>) => void;
  resetSettings: () => void;
}

export const defaultSettings: PosSettings = {
  gridDensity: "comfortable",
  thumbnailSize: "medium",
  showSku: true,
  showStockCount: true,
  showCategoryLabel: true,
  cartPosition: "left",
  cartWidth: "standard",
  cartDensity: "comfortable",
  showQuickActions: true,
  defaultPaymentMethod: "none",
  fontSize: "standard",
  highContrast: false,
  reducedMotion: false,
  autoPrintReceipt: false,
  autoClearCart: true,
  searchDefault: "text",
};

export const usePosSettingsStore = create<PosSettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: "pos-settings-storage", // name of the item in the storage (must be unique)
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
