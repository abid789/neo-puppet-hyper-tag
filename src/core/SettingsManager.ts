// src/core/SettingsManager.ts
// Central settings manager for graphics presets, screen shake, audio volumes, and keybindings.
// Persists all values to localStorage and notifies listeners on change.

import { DEFAULT_KEYBINDS, type KeybindConfig } from '../config/keybinds';
import { Localization, type SupportedLanguage } from './Localization';

export type GraphicsPreset = 'Ultra' | 'High' | 'Esports';

export interface GameSettings {
  graphicsPreset: GraphicsPreset;
  screenShake:    number; // 0.0 to 1.0
  masterVolume:   number; // 0.0 to 1.0
  sfxVolume:      number; // 0.0 to 1.0
  musicVolume:    number; // 0.0 to 1.0
  keybinds:       KeybindConfig;
  language:       SupportedLanguage;
}

const STORAGE_KEY = 'neo-puppet-settings';

const DEFAULT_SETTINGS: GameSettings = {
  graphicsPreset: 'Ultra',
  screenShake:    1.0,
  masterVolume:   0.8,
  sfxVolume:      0.85,
  musicVolume:    0.7,
  keybinds:       { ...DEFAULT_KEYBINDS },
  language:       'en',
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
          graphicsPreset: parsed.graphicsPreset ?? DEFAULT_SETTINGS.graphicsPreset,
          screenShake:    parsed.screenShake ?? DEFAULT_SETTINGS.screenShake,
          masterVolume:   parsed.masterVolume ?? DEFAULT_SETTINGS.masterVolume,
          sfxVolume:      parsed.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume,
          musicVolume:    parsed.musicVolume ?? DEFAULT_SETTINGS.musicVolume,
          keybinds:       { ...DEFAULT_KEYBINDS, ...(parsed.keybinds ?? {}) },
          language:       parsed.language ?? Localization.getLanguage(),
        };
      }
    } catch (err) {
      console.warn('[SettingsManager] Failed to load settings from storage, using defaults:', err);
    }
    return { ...DEFAULT_SETTINGS, keybinds: { ...DEFAULT_KEYBINDS } };
  }

  public getSettings(): GameSettings {
    return {
      ...this._settings,
      keybinds: { ...this._settings.keybinds },
    };
  }

  public update(patch: Partial<GameSettings>): void {
    this._settings = {
      ...this._settings,
      ...patch,
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
    this._settings = {
      ...DEFAULT_SETTINGS,
      keybinds: { ...DEFAULT_KEYBINDS },
    };
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
