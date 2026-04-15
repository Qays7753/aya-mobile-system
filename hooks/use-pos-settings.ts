"use client";

import * as React from "react";
import { POS_SETTINGS_DEFAULTS, usePosSettingsStore } from "@/stores/pos-settings";

export function usePosSettings() {
  const displaySize = usePosSettingsStore((state) => state.displaySize);
  const contrast = usePosSettingsStore((state) => state.contrast);
  const hydrated = usePosSettingsStore((state) => state.hydrated);
  const set = usePosSettingsStore((state) => state.set);
  const reset = usePosSettingsStore((state) => state.reset);

  React.useEffect(() => {
    if (!usePosSettingsStore.getState().hydrated) {
      usePosSettingsStore.setState({ hydrated: true });
    }
  }, []);

  return {
    displaySize: hydrated ? displaySize : POS_SETTINGS_DEFAULTS.displaySize,
    contrast: hydrated ? contrast : POS_SETTINGS_DEFAULTS.contrast,
    hydrated,
    set,
    reset
  };
}
