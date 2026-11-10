// src/core/SettingsManager.ts
// Central settings manager for graphics presets, mobile profiles, screen shake, audio volumes, and keybindings.
// Persists all values to localStorage and notifies listeners on change.

import { DEFAULT_KEYBINDS, type KeybindConfig } from '../config/keybinds';
import { Localization, type SupportedLanguage } from './Localization';
import { isTouchDevice } from './DeviceInfo';

export type TouchControlSetting = 'Auto' | 'On' | 'Off';

export type GraphicsPreset =
  | 'Max Quality'
  | 'Balanced'
  | 'Low Spec'
  | 'Mobile'
  | 'Custom'
  | 'Ultra'
  | 'High'
  | 'Esports';

export interface GameSettings {
  graphicsPreset:      GraphicsPreset;
  renderScale:         number; // 0.5 to 1.0
  targetFps:           number; // 30, 60, or uncapped (0)
  particleBudget:      number; // 300 to 2500
  bloom:               boolean;
  scanlines:           boolean;
  chromaticAberration: boolean;
  screenShake:         number; // 0.0 to 1.0
  masterVolume:        number; // 0.0 to 1.0
  sfxVolume:           number; // 0.0 to 1.0
  musicVolume:         number; // 0.0 to 1.0
  touchControls:       TouchControlSetting;
  keybinds:            KeybindConfig;
  language:            SupportedLanguage;
}

export interface PresetValues {
  renderScale:         number;
  targetFps:           number;
  particleBudget:      number;
  bloom:               boolean;
  scanlines:           boolean;
  chromaticAberration: boolean;
  screenShake:         number;
}

export const PRESET_DEFINITIONS: Record<string, PresetValues> = {
  'Max Quality': {
    renderScale: 1.0,
    targetFps: 60,
    particleBudget: 2500,
    bloom: true,
    scanlines: true,
    chromaticAberration: true,
    screenShake: 1.0,
  },
  'Ultra': {
    renderScale: 1.0,
    targetFps: 60,
    particleBudget: 2500,
    bloom: true,
    scanlines: true,
    chromaticAberration: true,
    screenShake: 1.0,
  },
  'Balanced': {
    renderScale: 1.0,
    targetFps: 60,
    particleBudget: 1200,
    bloom: true,
    scanlines: false,
    chromaticAberration: false,
    screenShake: 0.8,
  },
  'High': {
    renderScale: 1.0,
    targetFps: 60,
    particleBudget: 1200,
    bloom: true,
    scanlines: false,
    chromaticAberration: false,
    screenShake: 0.8,
  },
  'Low Spec': {
    renderScale: 0.75,
    targetFps: 30,
    particleBudget: 500,
    bloom: false,
    scanlines: false,
    chromaticAberration: false,
    screenShake: 0.5,
  },
  'Mobile': {
    renderScale: 0.75,
    targetFps: 30,
    particleBudget: 500,
    bloom: false,
    scanlines: false,
    chromaticAberration: false,
    screenShake: 0.5,
  },
  'Esports': {
    renderScale: 1.0,
    targetFps: 60,
    particleBudget: 800,
    bloom: false,
    scanlines: false,
    chromaticAberration: false,
    screenShake: 0.0,
  },
};

const STORAGE_KEY = 'neo-puppet-settings';

export { isTouchDevice };

const DEFAULT_SETTINGS: GameSettings = {
  graphicsPreset:      'Max Quality',
  renderScale:         1.0,
  targetFps:           60,
  particleBudget:      2500,
  bloom:               true,
  scanlines:           true,
  chromaticAberration: true,
  screenShake:         1.0,
  masterVolume:        0.8,
  sfxVolume:           0.85,
  musicVolume:         0.7,
  touchControls:       'Auto',
  keybinds:            { ...DEFAULT_KEYBINDS },
  language:            'en',
};

export class SettingsManager {
  private static _instance: SettingsManager | null = null;

  public static getInstance(): SettingsManager {
    if (!this._instance) {
      this._instance = new SettingsManager();
    }
    return this._instance;
  }

  private _settings: GameSettings;
  private readonly _listeners: ((settings: GameSettings) => void)[] = [];

  constructor() {
    this._settings = this._loadSettings();
    Localization.setLanguage(this._settings.language);
  }

  private _loadSettings(): GameSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GameSettings>;
        return {
          graphicsPreset:      parsed.graphicsPreset ?? DEFAULT_SETTINGS.graphicsPreset,
          renderScale:         parsed.renderScale ?? DEFAULT_SETTINGS.renderScale,
          targetFps:           parsed.targetFps ?? DEFAULT_SETTINGS.targetFps,
          particleBudget:      parsed.particleBudget ?? DEFAULT_SETTINGS.particleBudget,
          bloom:               parsed.bloom ?? DEFAULT_SETTINGS.bloom,
          scanlines:           parsed.scanlines ?? DEFAULT_SETTINGS.scanlines,
          chromaticAberration: parsed.chromaticAberration ?? DEFAULT_SETTINGS.chromaticAberration,
          screenShake:         parsed.screenShake ?? DEFAULT_SETTINGS.screenShake,
          masterVolume:        parsed.masterVolume ?? DEFAULT_SETTINGS.masterVolume,
          sfxVolume:           parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume,
          musicVolume:         parsed.musicVolume ?? DEFAULT_SETTINGS.musicVolume,
          touchControls:       parsed.touchControls ?? DEFAULT_SETTINGS.touchControls,
          keybinds:            { ...DEFAULT_KEYBINDS, ...(parsed.keybinds ?? {}) },
          language:            parsed.language ?? Localization.getLanguage(),
        };
      }
    } catch (err) {
      console.warn('[SettingsManager] Failed to load settings from storage, using defaults:', err);
    }

    // First load: auto-apply Mobile preset on touch devices
    if (isTouchDevice()) {
      const mobileVals = PRESET_DEFINITIONS['Mobile'];
      return {
        ...DEFAULT_SETTINGS,
        graphicsPreset: 'Mobile',
        ...mobileVals,
        keybinds: { ...DEFAULT_KEYBINDS },
      };
    }

    return { ...DEFAULT_SETTINGS, keybinds: { ...DEFAULT_KEYBINDS } };
  }

  public shouldShowTouchControls(): boolean {
    if (this._settings.touchControls === 'On') return true;
    if (this._settings.touchControls === 'Off') return false;
    return isTouchDevice();
  }

  public getSettings(): GameSettings {
    return {
      ...this._settings,
      keybinds: { ...this._settings.keybinds },
    };
  }

  /**
   * Applies a named preset with all documented performance reductions/enhancements.
   */
  public applyPreset(preset: GraphicsPreset): void {
    const vals = PRESET_DEFINITIONS[preset];
    if (vals) {
      this._settings = {
        ...this._settings,
        graphicsPreset: preset,
        renderScale: vals.renderScale,
        targetFps: vals.targetFps,
        particleBudget: vals.particleBudget,
        bloom: vals.bloom,
        scanlines: vals.scanlines,
        chromaticAberration: vals.chromaticAberration,
        screenShake: vals.screenShake,
      };
    } else {
      this._settings.graphicsPreset = preset;
    }

    this._save();
    this._notify();
  }

  /**
   * Updates settings. If individual visual/performance fields are changed manually without
   * specifying a preset, automatically switches graphicsPreset label to 'Custom'.
   */
  public update(patch: Partial<GameSettings>): void {
    let nextPreset = patch.graphicsPreset ?? this._settings.graphicsPreset;

    // Check if an individual performance setting was altered manually
    const alteredIndividualSetting =
      (patch.renderScale !== undefined && patch.renderScale !== this._settings.renderScale) ||
      (patch.targetFps !== undefined && patch.targetFps !== this._settings.targetFps) ||
      (patch.particleBudget !== undefined && patch.particleBudget !== this._settings.particleBudget) ||
      (patch.bloom !== undefined && patch.bloom !== this._settings.bloom) ||
      (patch.scanlines !== undefined && patch.scanlines !== this._settings.scanlines) ||
      (patch.chromaticAberration !== undefined && patch.chromaticAberration !== this._settings.chromaticAberration) ||
      (patch.screenShake !== undefined && patch.screenShake !== this._settings.screenShake);

    if (alteredIndividualSetting && patch.graphicsPreset === undefined) {
      nextPreset = 'Custom';
    }

    this._settings = {
      ...this._settings,
      ...patch,
      graphicsPreset: nextPreset,
      keybinds: patch.keybinds ? { ...patch.keybinds } : this._settings.keybinds,
    };

    if (patch.language) {
      Localization.setLanguage(patch.language);
    }

    this._save();
    this._notify();
  }

  public setKeybind(action: keyof KeybindConfig, key: string): void {
    this._settings.keybinds[action] = key;
    this._save();
    this._notify();
  }

  public resetToDefaults(): void {
    const isTouch = isTouchDevice();
    if (isTouch) {
      const mobileVals = PRESET_DEFINITIONS['Mobile'];
      this._settings = {
        ...DEFAULT_SETTINGS,
        graphicsPreset: 'Mobile',
        ...mobileVals,
        keybinds: { ...DEFAULT_KEYBINDS },
      };
    } else {
      this._settings = {
        ...DEFAULT_SETTINGS,
        keybinds: { ...DEFAULT_KEYBINDS },
      };
    }
    Localization.setLanguage('en');
    this._save();
    this._notify();
  }

  public onSettingsChanged(cb: (settings: GameSettings) => void): void {
    this._listeners.push(cb);
  }

  private _save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings));
    } catch {
      /* noop */
    }
  }

  private _notify(): void {
    const copy = this.getSettings();
    for (let i = 0; i < this._listeners.length; i++) {
      this._listeners[i](copy);
    }
  }
}
