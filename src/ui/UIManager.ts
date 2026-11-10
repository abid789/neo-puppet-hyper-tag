// src/ui/UIManager.ts
// Screen router coordinating Menu, Lobby, Customizer, Match HUD, and Podium screens.

import { MainMenu } from './MainMenu';
import { LobbyScreen } from './LobbyScreen';
import { MatchCustomizer, type MatchCustomizerConfig } from './MatchCustomizer';
import { HUD } from './HUD';
import { PodiumScreen, type PodiumResultItem } from './PodiumScreen';
import { SettingsModal } from './SettingsModal';
import { CloudSetupModal } from './CloudSetupModal';
import { SoundEngine } from '../audio/SoundEngine';

export type ScreenState = 'MENU' | 'LOBBY' | 'MATCH' | 'PODIUM';

export class UIManager {
  private _state: ScreenState = 'MENU';

  public readonly menu:       MainMenu;
  public readonly lobby:      LobbyScreen;
  public readonly customizer: MatchCustomizer;
  public readonly hud:        HUD;
  public readonly podium:     PodiumScreen;
  public readonly settings:   SettingsModal;
  public readonly cloudSetup: CloudSetupModal;

  private _onStartGameCb:  ((cfg: MatchCustomizerConfig) => void) | null = null;
  private _onLeavePartyCb: (() => void) | null = null;

  constructor() {
    this.menu       = new MainMenu();
    this.lobby      = new LobbyScreen();
    this.customizer = new MatchCustomizer();
    this.hud        = new HUD();
    this.podium     = new PodiumScreen();
    this.settings   = new SettingsModal();
    this.cloudSetup = new CloudSetupModal();

    this._setupScreenWiring();
  }

  public get currentState(): ScreenState {
    return this._state;
  }

  public setCallbacks(callbacks: {
    onStartGame:  (cfg: MatchCustomizerConfig) => void;
    onLeaveParty: () => void;
  }): void {
    this._onStartGameCb  = callbacks.onStartGame;
    this._onLeavePartyCb = callbacks.onLeaveParty;
  }

  private _setupScreenWiring(): void {
    // 1. Main Menu Callbacks
    this.menu.setCallbacks({
      onQuickMatch: () => {
        SoundEngine.getInstance().playCountdownBeep(true);
        this.goToMatch();
        if (this._onStartGameCb) {
          this._onStartGameCb({
            mapIndex:      0,
            modeIndex:     0,
            durationSec:   120,
            modifier:      'normal',
            botCount:      3,
            botDifficulty: 'Pro',
          });
        }
      },
      onHostLobby: () => {
        SoundEngine.getInstance().playJump(false);
        this.goToLobby(true);
      },
      onJoinRoom: () => {
        SoundEngine.getInstance().playFootstep('metal');
        const code = prompt('ENTER ROOM CODE (e.g. TAG-8492):');
        if (code && code.trim()) {
          window.location.search = `?room=${code.trim().toUpperCase()}`;
        }
      },
      onCustomizer: () => {
        SoundEngine.getInstance().playFootstep('metal');
        this.customizer.show();
      },
      onSettings: () => {
        SoundEngine.getInstance().playFootstep('metal');
        this.settings.show();
      },
      onCloudSetup: () => {
        SoundEngine.getInstance().playFootstep('metal');
        this.cloudSetup.show();
      },
    });

    // 2. Lobby Callbacks
    this.lobby.setCallbacks(
      () => {
        // Start Game
        SoundEngine.getInstance().playCountdownBeep(true);
        this.goToMatch();
        if (this._onStartGameCb) {
          this._onStartGameCb({
            mapIndex:      0,
            modeIndex:     0,
            durationSec:   120,
            modifier:      'normal',
            botCount:      3,
            botDifficulty: 'Pro',
          });
        }
      },
      () => {
        this.customizer.show();
      },
      () => {
        // Leave Lobby
        this.goToMenu();
        if (this._onLeavePartyCb) this._onLeavePartyCb();
      },
      (ready) => {
        if (ready) SoundEngine.getInstance().playPowerUp();
      },
    );

    // 3. Podium Callbacks
    this.podium.setCallbacks(
      () => {
        // Play Again
        this.goToMatch();
        if (this._onStartGameCb) {
          this._onStartGameCb({
            mapIndex:      0,
            modeIndex:     0,
            durationSec:   120,
            modifier:      'normal',
            botCount:      3,
            botDifficulty: 'Pro',
          });
        }
      },
      () => {
        // Back to Menu
        this.goToMenu();
        if (this._onLeavePartyCb) this._onLeavePartyCb();
      },
    );
  }

  // ── Navigation Transitions ───────────────────────────────────────────────────

  public goToMenu(): void {
    this._state = 'MENU';
    this.lobby.hide();
    this.podium.hide();
    this.hud.setVisible(false);
    this.menu.show();
    SoundEngine.getInstance().stopMusic();
  }

  public goToLobby(isHost = true, roomCode = 'TAG-8492'): void {
    this._state = 'LOBBY';
    this.menu.hide();
    this.podium.hide();
    this.hud.setVisible(false);
    this.lobby.show(isHost, roomCode);
    SoundEngine.getInstance().startMusic();
  }

  public goToMatch(): void {
    this._state = 'MATCH';
    this.menu.hide();
    this.lobby.hide();
    this.podium.hide();
    this.hud.setVisible(true);
    SoundEngine.getInstance().startMusic();
  }

  public goToPodium(results: PodiumResultItem[]): void {
    this._state = 'PODIUM';
    this.menu.hide();
    this.lobby.hide();
    this.hud.setVisible(false);
    this.podium.show(results);
  }
}
