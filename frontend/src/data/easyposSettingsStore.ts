export type EasyPosSettings = {
  darkMode: boolean;
  lastMerchantId: number | null;
};

const SETTINGS_KEY = "easypos-settings";

const defaultSettings: EasyPosSettings = {
  darkMode: true,
  lastMerchantId: null,
};

function hasWindow() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isSettings(value: unknown): value is EasyPosSettings {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.darkMode === "boolean" &&
    (candidate.lastMerchantId === null ||
      candidate.lastMerchantId === undefined ||
      typeof candidate.lastMerchantId === "number")
  );
}

export function loadEasyPosSettings(): EasyPosSettings {
  if (!hasWindow()) return defaultSettings;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return isSettings(parsed) ? parsed : defaultSettings;
  } catch {
    window.localStorage.removeItem(SETTINGS_KEY);
    return defaultSettings;
  }
}

export function saveEasyPosSettings(settings: EasyPosSettings) {
  if (!hasWindow()) return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
