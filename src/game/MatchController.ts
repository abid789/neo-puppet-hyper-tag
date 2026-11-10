// src/game/MatchController.ts
// State machine managing match lifecycle:
// PRE_MATCH_INTRO -> COUNTDOWN_3_2_1 -> ACTIVE_ROUND -> ROUND_SUMMARY_PODIUM -> NEXT_MAP_VOTE.
// Enforces match durations, final-15s double points, live tag feed, MVP titles, and podium honors.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { Puppet } from '../entities/Puppet';
import type { GameMode } from './Modes/GameMode';
import { HunterPointRush } from './Modes/HunterPointRush';
import { HotBombTag } from './Modes/HotBombTag';
import { CrownKeepAway } from './Modes/CrownKeepAway';
import { TeamTag } from './Modes/TeamTag';
import { InfectionMode } from './Modes/InfectionMode';
import { LastSurvivor } from './Modes/LastSurvivor';
import { TagRulesEngine } from './TagRulesEngine';
import { ScoringEngine, type PlayerMatchStats } from './ScoringEngine';
import { MatchRecapManager } from './MatchRecap';
import { SessionHistory } from './SessionHistory';
import type { MapManager } from '../maps/MapManager';
import type { Camera } from '../graphics/Camera';
import type { Engine } from '../core/Engine';

export type MatchState =
  | 'PRE_MATCH_INTRO'
  | 'COUNTDOWN_3_2_1'
  | 'ACTIVE_ROUND'
  | 'ROUND_SUMMARY_PODIUM'
  | 'NEXT_MAP_VOTE';

export interface TagFeedItem {
  id:        number;
  text:      string;
  color:     string;
  timestamp: number;
}

export class MatchController {
  private readonly _camera: Camera;
  private readonly _mapManager: MapManager;
  private readonly _scoring: ScoringEngine;
  private readonly _tagRules: TagRulesEngine;
  private readonly _uiLayer: Container;

  private _puppets: Puppet[] = [];
  private _state: MatchState = 'PRE_MATCH_INTRO';
  private _stateTimer = 0;

  // Match configurations
  private _roundDuration = 60.0; // 60, 90, 120, or 180s
  private _roundTimeRemaining = 60.0;

  // Modes
  private readonly _modes: GameMode[] = [
    new HunterPointRush(),
    new HotBombTag(),
    new CrownKeepAway(),
    new TeamTag(),
    new InfectionMode(),
    new LastSurvivor(),
  ];
  private _currentModeIndex = 0;

  // Live Tag Feed
  private readonly _tagFeed: TagFeedItem[] = [];
  private _nextFeedId = 1;

  // UI Visual Graphics & Texts
  private readonly _overlayGfx: Graphics;
  private readonly _bannerText: Text;
  private readonly _timerText: Text;
  private readonly _feedTexts: Text[] = [];

  constructor(
    engine: Engine,
    camera: Camera,
    mapManager: MapManager,
    uiLayer: Container,
  ) {
    this._camera = camera;
    this._mapManager = mapManager;
    this._uiLayer = uiLayer;

    this._scoring = new ScoringEngine(uiLayer);
    this._tagRules = new TagRulesEngine(this._scoring, engine);

    this._overlayGfx = new Graphics();
    this._uiLayer.addChild(this._overlayGfx);

    // Banner Text (Countdowns, State transitions, MVP Awards)
    const bannerStyle = new TextStyle({
      fontFamily: 'Orbitron',
      fontSize: 32,
      fontWeight: '900',
      fill: '#00ffff',
      stroke: { color: '#000000', width: 4 },
      dropShadow: { alpha: 0.9, blur: 6, color: '#00ffff', distance: 0 },
    });
    this._bannerText = new Text({ text: '', style: bannerStyle });
    this._bannerText.anchor.set(0.5, 0.5);
    this._uiLayer.addChild(this._bannerText);

    // Top Match Clock
    const timerStyle = new TextStyle({
      fontFamily: 'Orbitron',
      fontSize: 18,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: { color: '#000000', width: 3 },
    });
    this._timerText = new Text({ text: '', style: timerStyle });
    this._timerText.anchor.set(0.5, 0);
    this._uiLayer.addChild(this._timerText);

    // Live Tag Feed entries in top right corner
    for (let i = 0; i < 4; i++) {
      const feedStyle = new TextStyle({
        fontFamily: 'Rajdhani',
        fontSize: 14,
        fontWeight: '600',
        fill: '#e0e0ff',
        stroke: { color: '#000000', width: 2 },
      });
      const t = new Text({ text: '', style: feedStyle });
      t.anchor.set(1.0, 0);
      this._uiLayer.addChild(t);
      this._feedTexts.push(t);
    }

    // Key listener: G = Cycle Mode, P = Force Next Match State
    window.addEventListener('keydown', this._onKeyDown);
  }

  public setPuppets(puppets: Puppet[]): void {
    this._puppets = puppets;
    for (let i = 0; i < puppets.length; i++) {
      this._scoring.registerPlayer(puppets[i].getPlayerIndex());
    }
    this.startMatch();
  }

  public get currentMode(): GameMode {
    return this._modes[this._currentModeIndex];
  }

  public get currentState(): MatchState {
    return this._state;
  }

  public get scoringEngine(): ScoringEngine {
    return this._scoring;
  }

  public get roundTimeRemaining(): number {
    return this._roundTimeRemaining;
  }

  public startMatch(): void {
    this._scoring.reset();
    this._tagRules.reset();
    this._tagFeed.length = 0;
    MatchRecapManager.getInstance().startNewMatch();
    this.currentMode.init(this._puppets);

    this._transitionTo('PRE_MATCH_INTRO', 2.8);
  }

  public resetMatch(): void {
    this._scoring.reset();
    this._tagRules.reset();
    this._tagFeed.length = 0;
    for (let i = 0; i < this._puppets.length; i++) {
      this._puppets[i].resetMatchState();
    }
  }

  public setRoundDuration(seconds: number): void {
    this._roundDuration = seconds;
    this._roundTimeRemaining = seconds;
  }

  public setGameMode(index: number): void {
    if (index >= 0 && index < this._modes.length && index !== this._currentModeIndex) {
      this.currentMode.destroy();
      this._currentModeIndex = index;
      this.startMatch();
    }
  }

  public cycleGameMode(): void {
    this.currentMode.destroy();
    this._currentModeIndex = (this._currentModeIndex + 1) % this._modes.length;
    this.startMatch();
  }

  public fixedUpdate(dt: number): void {
    this._stateTimer -= dt;
    this._scoring.update(dt);
    this._tagRules.update(dt);

    switch (this._state) {
      case 'PRE_MATCH_INTRO':
        // Camera smooth introductory pan
        for (let i = 0; i < this._puppets.length; i++) {
          this._puppets[i].setInputFrozen(true);
        }
        if (this._stateTimer <= 0) {
          this._transitionTo('COUNTDOWN_3_2_1', 3.0);
        }
        break;

      case 'COUNTDOWN_3_2_1':
        for (let i = 0; i < this._puppets.length; i++) {
          this._puppets[i].setInputFrozen(true);
        }
        if (this._stateTimer <= 0) {
          for (let i = 0; i < this._puppets.length; i++) {
            this._puppets[i].setInputFrozen(false);
          }
          this._roundTimeRemaining = this._roundDuration;
          this._transitionTo('ACTIVE_ROUND', this._roundDuration);
        }
        break;

      case 'ACTIVE_ROUND':
        this._roundTimeRemaining = Math.max(0, this._roundTimeRemaining - dt);

        // Final 15 seconds double points alert
        if (this._roundTimeRemaining <= 15.0 && !this._scoring.isDoublePoints) {
          this._scoring.setDoublePoints(true);
          this._scoring.spawnFloatingText(0, -100, 'FINAL 15 SECONDS - DOUBLE POINTS!', '#ff0066');
          this._camera.shake(8, 0, 1);
        }

        // Run active mode logic
        this.currentMode.update(dt, this._puppets, this._tagRules, this._scoring);

        const earlyRoundOver = this.currentMode.isRoundOver?.() ?? false;

        if (this._roundTimeRemaining <= 0 || earlyRoundOver) {
          this._finalizeMatchRecap();
          this._transitionTo('ROUND_SUMMARY_PODIUM', 5.5);
        }
        break;

      case 'ROUND_SUMMARY_PODIUM':
        for (let i = 0; i < this._puppets.length; i++) {
          this._puppets[i].setInputFrozen(true);
        }
        if (this._stateTimer <= 0) {
          this._transitionTo('NEXT_MAP_VOTE', 3.0);
        }
        break;

      case 'NEXT_MAP_VOTE':
        if (this._stateTimer <= 0) {
          // Resolve next map and restart round
          this._mapManager.onRoundEnded();
          this.startMatch();
        }
        break;
    }
  }

  public render(screenWidth: number, screenHeight: number): void {
    const cx = screenWidth / 2;
    const cy = screenHeight / 2;

    this._overlayGfx.clear();
    this._bannerText.x = cx;
    this._bannerText.y = cy - 40;

    this._timerText.x = cx;
    this._timerText.y = 16;

    // Render Mode & Timer Header
    if (this._state === 'ACTIVE_ROUND') {
      const mins = Math.floor(this._roundTimeRemaining / 60);
      const secs = Math.floor(this._roundTimeRemaining % 60);
      const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
      const isCritical = this._roundTimeRemaining <= 15.0;

      if (this.currentMode.id === 'team_tag') {
        const teamScores = this.currentMode.getTeamScores?.(this._scoring);
        if (teamScores) {
          this._timerText.text = `[RED: ${teamScores.red} | BLUE: ${teamScores.blue}]   TIME: ${formatted}`;
        } else {
          this._timerText.text = `[${this.currentMode.name}]   TIME: ${formatted}`;
        }
      } else if (this.currentMode.id === 'last_survivor') {
        const cullSec = this.currentMode.getEliminationCountdown?.();
        const cullText = cullSec !== undefined && cullSec !== null ? `  [CULL: ${Math.ceil(cullSec)}s]` : '';
        this._timerText.text = `[LAST SURVIVOR]${cullText}   TIME: ${formatted}`;
      } else {
        this._timerText.text = `[${this.currentMode.name}]   TIME: ${formatted}`;
      }
      this._timerText.style.fill = isCritical ? '#ff0066' : '#00ffff';
      this._timerText.visible = true;

      if (isCritical) {
        // Red flashing header pulse
        this._timerText.scale.set(1.0 + Math.sin(performance.now() * 0.01) * 0.08);
      } else {
        this._timerText.scale.set(1.0);
      }
    } else {
      this._timerText.visible = false;
    }

    // Render State Banner
    switch (this._state) {
      case 'PRE_MATCH_INTRO':
        this._bannerText.visible = true;
        this._bannerText.text = `${this.currentMode.name}\n${this._mapManager.currentMap.name}`;
        this._bannerText.style.fontSize = 24;
        this._bannerText.style.fill = '#00ffff';
        break;

      case 'COUNTDOWN_3_2_1':
        this._bannerText.visible = true;
        const count = Math.ceil(this._stateTimer);
        this._bannerText.text = count > 0 ? `${count}` : 'GO!';
        this._bannerText.style.fontSize = 54;
        this._bannerText.style.fill = count === 1 ? '#00ff88' : '#ffee00';
        break;

      case 'ACTIVE_ROUND':
        if (this._roundTimeRemaining > this._roundDuration - 1.5) {
          this._bannerText.visible = true;
          this._bannerText.text = 'GO!';
          this._bannerText.style.fontSize = 48;
          this._bannerText.style.fill = '#00ff88';
        } else if (this._roundTimeRemaining <= 15.0 && this._roundTimeRemaining > 12.5) {
          this._bannerText.visible = true;
          this._bannerText.text = 'FINAL 15 SECONDS!\nDOUBLE POINTS!';
          this._bannerText.style.fontSize = 28;
          this._bannerText.style.fill = '#ff0066';
        } else {
          this._bannerText.visible = false;
        }
        break;

      case 'ROUND_SUMMARY_PODIUM':
        this._bannerText.visible = true;
        const stats = this._scoring.getAllStats();
        const winner = stats[0];

        // Award MVPs
        const mvpLines = this._calculateMvpTitles(stats);
        this._bannerText.text = `ROUND COMPLETE!\nWINNER: PLAYER ${winner ? winner.playerIndex + 1 : 1} (${winner ? winner.score : 0} PTS)\n\n${mvpLines.join('\n')}`;
        this._bannerText.style.fontSize = 18;
        this._bannerText.style.fill = '#ffee00';
        break;

      case 'NEXT_MAP_VOTE':
        this._bannerText.visible = true;
        this._bannerText.text = 'ROTATING TO NEXT ARENA…';
        this._bannerText.style.fontSize = 22;
        this._bannerText.style.fill = '#00ff88';
        break;
    }

    // Render Live Tag Feed (Top Right)
    const feedX = screenWidth - 20;
    let feedY = 20;
    for (let i = 0; i < this._feedTexts.length; i++) {
      const feedItem = this._tagFeed[this._tagFeed.length - 1 - i];
      if (feedItem) {
        this._feedTexts[i].text = feedItem.text;
        this._feedTexts[i].style.fill = feedItem.color;
        this._feedTexts[i].x = feedX;
        this._feedTexts[i].y = feedY;
        this._feedTexts[i].visible = true;
        feedY += 22;
      } else {
        this._feedTexts[i].visible = false;
      }
    }
  }

  private _transitionTo(newState: MatchState, durationSec: number): void {
    this._state = newState;
    this._stateTimer = durationSec;

    console.log(`[MatchController] State -> ${newState} (${durationSec}s)`);
  }

  public addFeedEntry(text: string, color = '#00ffff'): void {
    this._tagFeed.push({
      id: this._nextFeedId++,
      text,
      color,
      timestamp: performance.now(),
    });
    if (this._tagFeed.length > 8) {
      this._tagFeed.shift();
    }
  }

  private _calculateMvpTitles(stats: PlayerMatchStats[]): string[] {
    if (stats.length === 0) return [];

    const mvpTitles: string[] = [];

    // Apex Hunter: Most tags made
    const apex = [...stats].sort((a, b) => b.tagsMade - a.tagsMade)[0];
    if (apex && apex.tagsMade > 0) {
      mvpTitles.push(`🏆 APEX HUNTER: Player ${apex.playerIndex + 1} (${apex.tagsMade} Tags)`);
    }

    // Untouchable: Fewest times tagged
    const untouchable = [...stats].sort((a, b) => a.timesTagged - b.timesTagged)[0];
    if (untouchable) {
      mvpTitles.push(`🛡️ UNTOUCHABLE: Player ${untouchable.playerIndex + 1} (${untouchable.timesTagged} Hits taken)`);
    }

    // Ankle Breaker: Most falls caused / near misses
    const ankle = [...stats].sort((a, b) => b.nearMisses - a.nearMisses)[0];
    if (ankle && ankle.nearMisses > 0) {
      mvpTitles.push(`⚡ ANKLE BREAKER: Player ${ankle.playerIndex + 1} (${ankle.nearMisses} Near Misses)`);
    }

    return mvpTitles;
  }

  private _finalizeMatchRecap(): void {
    const stats = this._scoring.getAllStats();
    const map = this._mapManager.currentMap;
    const winner = stats[0];
    const winnerSpawn = winner ? (map.spawns[winner.playerIndex % map.spawns.length]?.x ?? 0) : 0;

    const players = this._puppets.map(p => {
      const idx = p.getPlayerIndex();
      const st = this._scoring.getPlayerStats(idx);
      const hex = '#' + p.getColorPrimary().toString(16).padStart(6, '0');
      return {
        playerIndex:   idx,
        name:          `PILOT ${idx + 1}`,
        color:         hex,
        score:         st?.score ?? 0,
        tagsGiven:     st?.tagsMade ?? 0,
        timesTagged:   st?.timesTagged ?? 0,
        nearMisses:    st?.nearMisses ?? 0,
        fallsCaused:   st?.fallsCaused ?? 0,
        longestStreak: st?.maxStreak ?? 0,
      };
    });

    MatchRecapManager.getInstance().finalizeMatchRecap({
      mapId:        map.id,
      mapName:      map.name,
      modeName:     this.currentMode.name,
      durationSec:  this._roundDuration,
      players,
      winnerSpawnX: winnerSpawn,
    });

    SessionHistory.getInstance().recordMatch({
      modeName: this.currentMode.name,
      mapName:  map.name,
      players:  players.map(p => ({
        id:       `pilot_${p.playerIndex}`,
        name:     p.name,
        color:    p.color,
        score:    p.score,
        tagsMade: p.tagsGiven,
      })),
    });
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    // G = Cycle Game Mode
    if (e.code === 'KeyG') {
      this.cycleGameMode();
    }
    // P = Fast-forward to next match state for rapid testing
    if (e.code === 'KeyP') {
      this._stateTimer = 0.05;
    }
  };

  public destroy(): void {
    window.removeEventListener('keydown', this._onKeyDown);
    this.currentMode.destroy();
    this._scoring.destroy();
  }
}
