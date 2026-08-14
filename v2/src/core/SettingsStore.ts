export type QualityPreset = "low" | "medium" | "high";
export type ColorAssist = "off" | "deuteranopia" | "protanopia" | "tritanopia";

export interface GameSettings {
  quality: QualityPreset;
  resolutionScale: number;
  fov: number;
  fpsCap: number;
  cameraDistance: number;
  mouseSensitivity: number;
  screenShake: boolean;
  damageNumbers: boolean;
  autoAttack: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  reducedMotion: boolean;
  highContrast: boolean;
  colorAssist: ColorAssist;
}

const STORAGE_KEY = "zegabonk_v2_settings";

export const DEFAULT_SETTINGS: GameSettings = {
  quality: "high",
  resolutionScale: 1,
  fov: 57,
  fpsCap: 0,
  cameraDistance: 11,
  mouseSensitivity: 1,
  screenShake: true,
  damageNumbers: true,
  autoAttack: true,
  masterVolume: 0.8,
  musicVolume: 0.65,
  sfxVolume: 0.85,
  reducedMotion: false,
  highContrast: false,
  colorAssist: "off",
};

export class SettingsStore {
  private value: GameSettings;

  constructor() {
    this.value = this.load();
  }

  get(): Readonly<GameSettings> {
    return this.value;
  }

  update(patch: Partial<GameSettings>): Readonly<GameSettings> {
    this.value = { ...this.value, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.value));
    return this.value;
  }

  reset(): Readonly<GameSettings> {
    this.value = { ...DEFAULT_SETTINGS };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.value));
    return this.value;
  }

  private load(): GameSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
}
