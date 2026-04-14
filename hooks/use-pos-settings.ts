import { useEffect, useState } from "react";
import { defaultSettings, usePosSettingsStore, type PosSettings } from "@/stores/pos-settings";

export function usePosSettings() {
  const [mounted, setMounted] = useState(false);
  const settingsStore = usePosSettingsStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Before hydration, return default settings to avoid SSR mismatch
  if (!mounted) {
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      resetSettings: () => {},
      isHydrated: false,
    };
  }

  return {
    settings: settingsStore.settings,
    updateSettings: settingsStore.updateSettings,
    resetSettings: settingsStore.resetSettings,
    isHydrated: true,
  };
}
