// src/game/ScoringEngine.ts
// Point tracking, streak multipliers, aerial bonuses, stats tracking, and floating score popups.

import { Container, Text, TextStyle } from 'pixi.js';
import { PPM } from '../types';

export interface PlayerMatchStats {
  playerIndex:        number;
  score:              number;
  tagsMade:           number;
  timesTagged:        number;
  nearMisses:         number;
  fallsCaused:        number;
  streak:             number;
  maxStreak:          number;
  powerUpsCollected:  number;
  holdTimeSec:        number;
  survivalTimeSec:    number;
}

export interface FloatingScorePopup {
  x:        number; // Screen pixels
  y:        number;
  text:     string;
  color:    string;
  life:     number;
  maxLife:  number;
  vy:       number;
  pixiText: Text;
}

export class ScoringEngine {
  private readonly _stats: Map<number, PlayerMatchStats> = new Map();
  private readonly _uiLayer: Container;
  private readonly _popups: FloatingScorePopup[] = [];
  private _isDoublePoints = false;

  constructor(uiLayer: Container) {
    this._uiLayer = uiLayer;
  }

  public registerPlayer(playerIndex: number): void {
    this._stats.set(playerIndex, {
      playerIndex,
      score: 0,
      tagsMade: 0,
      timesTagged: 0,
      nearMisses: 0,
      fallsCaused: 0,
      streak: 0,
      maxStreak: 0,
      powerUpsCollected: 0,
      holdTimeSec: 0,
      survivalTimeSec: 0,
    });
  }

  public setDoublePoints(active: boolean): void {
    this._isDoublePoints = active;
  }

  public get isDoublePoints(): boolean {
    return this._isDoublePoints;
  }

  public addScore(
    playerIndex: number,
    basePoints: number,
    label: string,
    worldX: number,
    worldY: number,
    color = '#00ffff',
  ): number {
    const stats = this._stats.get(playerIndex);
    if (!stats) return 0;

    // Apply streak multiplier
    let mult = 1.0;
    if (stats.streak >= 5) {
      mult = 2.0;
    } else if (stats.streak >= 3) {
      mult = 1.5;
    }

    if (this._isDoublePoints) {
      mult *= 2.0;
    }

    const earned = Math.round(basePoints * mult);
    stats.score += earned;

    const popupText = mult > 1.0 ? `+${earned} (${mult}x ${label})` : `+${earned} ${label}`;
    this.spawnFloatingText(worldX * PPM, worldY * PPM - 25, popupText, color);

    return earned;
  }

  public deductScore(
    playerIndex: number,
    points: number,
    label: string,
    worldX: number,
    worldY: number,
  ): void {
    const stats = this._stats.get(playerIndex);
    if (!stats) return;

    stats.score = Math.max(0, stats.score - points);
    stats.streak = 0;

    this.spawnFloatingText(worldX * PPM, worldY * PPM - 25, `-${points} ${label}`, '#ff0033');
  }

  public recordTagMade(playerIndex: number): void {
    const stats = this._stats.get(playerIndex);
    if (!stats) return;

    stats.tagsMade++;
    stats.streak++;
    if (stats.streak > stats.maxStreak) {
      stats.maxStreak = stats.streak;
    }
  }

  public recordTagged(playerIndex: number): void {
    const stats = this._stats.get(playerIndex);
    if (!stats) return;

    stats.timesTagged++;
    stats.streak = 0; // Reset streak
  }

  public recordNearMiss(playerIndex: number, worldX: number, worldY: number): void {
    const stats = this._stats.get(playerIndex);
    if (!stats) return;

    stats.nearMisses++;
    this.addScore(playerIndex, 25, 'NEAR MISS!', worldX, worldY, '#ffee00');
  }

  public recordFallCaused(playerIndex: number): void {
    const stats = this._stats.get(playerIndex);
    if (stats) stats.fallsCaused++;
  }

  public recordHoldTime(playerIndex: number, dt: number): void {
    const stats = this._stats.get(playerIndex);
    if (stats) stats.holdTimeSec += dt;
  }

  public recordSurvivalTime(playerIndex: number, dt: number): void {
    const stats = this._stats.get(playerIndex);
    if (stats) stats.survivalTimeSec += dt;
  }

  public getPlayerStats(playerIndex: number): PlayerMatchStats | undefined {
    return this._stats.get(playerIndex);
  }

  public getAllStats(): PlayerMatchStats[] {
    return Array.from(this._stats.values()).sort((a, b) => b.score - a.score);
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string): void {
    const style = new TextStyle({
      fontFamily: 'Orbitron',
      fontSize: 14,
      fontWeight: 'bold',
      fill: color,
      stroke: { color: '#000000', width: 3 },
      dropShadow: {
        alpha: 0.8,
        angle: Math.PI / 6,
        blur: 4,
        color: '#000000',
        distance: 2,
      },
    });

    const pixiText = new Text({ text, style });
    pixiText.x = x;
    pixiText.y = y;
    pixiText.anchor.set(0.5, 0.5);
    this._uiLayer.addChild(pixiText);

    this._popups.push({
      x,
      y,
      text,
      color,
      life: 0.9,
      maxLife: 0.9,
      vy: -45, // Rise upward
      pixiText,
    });
  }

  public update(dt: number): void {
    for (let i = this._popups.length - 1; i >= 0; i--) {
      const p = this._popups[i];
      p.life -= dt;
      p.y += p.vy * dt;
      p.pixiText.y = p.y;

      const normLife = Math.max(0, p.life / p.maxLife);
      p.pixiText.alpha = normLife;
      p.pixiText.scale.set(0.85 + (1 - normLife) * 0.35);

      if (p.life <= 0) {
        this._uiLayer.removeChild(p.pixiText);
        p.pixiText.destroy();
        this._popups.splice(i, 1);
      }
    }
  }

  public reset(): void {
    for (let i = 0; i < this._popups.length; i++) {
      this._uiLayer.removeChild(this._popups[i].pixiText);
      this._popups[i].pixiText.destroy();
    }
    this._popups.length = 0;
    this._isDoublePoints = false;

    for (const stats of this._stats.values()) {
      stats.score = 0;
      stats.tagsMade = 0;
      stats.timesTagged = 0;
      stats.nearMisses = 0;
      stats.fallsCaused = 0;
      stats.streak = 0;
      stats.maxStreak = 0;
      stats.powerUpsCollected = 0;
      stats.holdTimeSec = 0;
      stats.survivalTimeSec = 0;
    }
  }

  public destroy(): void {
    this.reset();
  }
}
