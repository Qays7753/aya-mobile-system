import { describe, it, expect, beforeEach } from "vitest";
import { usePosSettingsStore, defaultSettings } from "../../stores/pos-settings";

describe("Pos Settings Store", () => {
  beforeEach(() => {
    // Clear the store and local storage before each test
    localStorage.clear();
    usePosSettingsStore.setState({ settings: defaultSettings });
  });

  it("initializes with default settings", () => {
    const state = usePosSettingsStore.getState();
    expect(state.settings).toEqual(defaultSettings);
  });

  it("updates partial settings correctly", () => {
    usePosSettingsStore.getState().updateSettings({
      gridDensity: "compact",
      autoPrintReceipt: true,
    });

    const state = usePosSettingsStore.getState();
    expect(state.settings.gridDensity).toBe("compact");
    expect(state.settings.autoPrintReceipt).toBe(true);
    // Other settings should remain unchanged
    expect(state.settings.thumbnailSize).toBe(defaultSettings.thumbnailSize);
  });

  it("resets settings to default", () => {
    usePosSettingsStore.getState().updateSettings({ gridDensity: "compact" });

    // verify it changed
    expect(usePosSettingsStore.getState().settings.gridDensity).toBe("compact");

    usePosSettingsStore.getState().resetSettings();

    // verify it reset
    expect(usePosSettingsStore.getState().settings.gridDensity).toBe("comfortable");
    expect(usePosSettingsStore.getState().settings).toEqual(defaultSettings);
  });
});
