// src/config/keybinds.ts
// Configurable keybinding definitions with duplicate conflict detection.

export interface KeybindConfig {
  moveLeft:  string;
  moveRight: string;
  jump:      string;
  punch:     string;
  block:     string;
  dash:      string;
  attack?:   string; // backwards compatibility synonym for punch
  emote1:    string;
  emote2:    string;
  emote3:    string;
  emote4:    string;
  emote5:    string;
  emote6:    string;
  perfHud:   string;
}

export const DEFAULT_KEYBINDS: KeybindConfig = {
  moveLeft:  'KeyA',
  moveRight: 'KeyD',
  jump:      'Space',
  punch:     'KeyJ',
  block:     'KeyK',
  dash:      'ShiftLeft',
  attack:    'KeyJ',
  emote1:    'Digit1',
  emote2:    'Digit2',
  emote3:    'Digit3',
  emote4:    'Digit4',
  emote5:    'Digit5',
  emote6:    'Digit6',
  perfHud:   'F3',
};

export const ACTION_LABELS: Record<keyof KeybindConfig, string> = {
  moveLeft:  'Move Left',
  moveRight: 'Move Right',
  jump:      'Jump',
  punch:     'Punch (J / Left Click)',
  block:     'Block (K / Right Click)',
  dash:      'Air Dash',
  attack:    'Punch / Tag',
  emote1:    'Emote 1 (😂)',
  emote2:    'Emote 2 (🔥)',
  emote3:    'Emote 3 (👑)',
  emote4:    'Emote 4 (⚡)',
  emote5:    'Emote 5 (👀)',
  emote6:    'Emote 6 (GG!)',
  perfHud:   'Toggle Perf HUD',
};

/**
 * Checks whether newKey is already assigned to another action in the keybind map.
 */
export function checkKeybindConflict(
  current: KeybindConfig,
  targetAction: keyof KeybindConfig,
  newKey: string,
): { hasConflict: boolean; conflictingAction?: keyof KeybindConfig } {
  for (const [action, key] of Object.entries(current)) {
    if (action !== targetAction && key.toLowerCase() === newKey.toLowerCase()) {
      return {
        hasConflict: true,
        conflictingAction: action as keyof KeybindConfig,
      };
    }
  }
  return { hasConflict: false };
}
