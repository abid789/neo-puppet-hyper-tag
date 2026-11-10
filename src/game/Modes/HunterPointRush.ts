// src/game/Modes/HunterPointRush.ts
// Hunter Point Rush mode: Hunters tag survivors for +100 pts (+50 aerial bonus),
// with streak multipliers (1.5x @ 3, 2.0x @ 5). Survivors earn +10 pts every 3s of evasion.

import type { GameMode } from './GameMode';
import type { Puppet } from '../../entities/Puppet';
import type { TagRulesEngine } from '../TagRulesEngine';
import type { ScoringEngine } from '../ScoringEngine';

export class HunterPointRush implements GameMode {
  public readonly id = 'hunter_point_rush';
  public readonly name = 'HUNTER POINT RUSH';
  public readonly description = 'Tag survivors for 100 pts. Aerial bonus +50. Survivors earn points for evading.';

  private _hunterIndex = 0;
  private _evasionTimers: Map<number, number> = new Map(); // playerIndex -> elapsed evasion time

  public init(puppets: Puppet[]): void {
    if (puppets.length === 0) return;

    // Designate initial hunter
    this._hunterIndex = puppets[0].getPlayerIndex();

    for (let i = 0; i < puppets.length; i++) {
      const p = puppets[i];
      const isHunter = p.getPlayerIndex() === this._hunterIndex;
      p.setIsIt(isHunter);
      p.setHasCrown(false);
      p.setBombTimer(null);
      this._evasionTimers.set(p.getPlayerIndex(), 0);
    }
  }

  public update(
    dt: number,
    puppets: Puppet[],
    tagRules: TagRulesEngine,
    scoring: ScoringEngine,
  ): void {
    const hunter = puppets.find(p => p.getPlayerIndex() === this._hunterIndex);
    if (!hunter) return;

    // Check tags & near misses against all survivors
    for (let i = 0; i < puppets.length; i++) {
      const survivor = puppets[i];
      const sIdx = survivor.getPlayerIndex();
      if (sIdx === this._hunterIndex) continue;

      // 1. Near miss check
      tagRules.checkNearMiss(hunter, survivor);

      // 2. Tag collision check
      if (tagRules.canTag(hunter, survivor)) {
        const tagEvent = tagRules.executeTag(hunter, survivor);
        this.onTag(hunter, survivor, tagEvent.isAerial, scoring);
        break; // Tagger transferred
      }

      // 3. Evasion survival points (+10 pts every 3 seconds)
      let time = (this._evasionTimers.get(sIdx) ?? 0) + dt;
      if (time >= 3.0) {
        time -= 3.0;
        const pos = survivor.getWorldPosition();
        scoring.addScore(sIdx, 10, 'EVASION', pos.x, pos.y, '#00ff88');
        scoring.recordSurvivalTime(sIdx, 3.0);
      }
      this._evasionTimers.set(sIdx, time);
    }
  }

  public onTag(
    hunter: Puppet,
    tagged: Puppet,
    isAerial: boolean,
    scoring: ScoringEngine,
  ): void {
    const hunterIdx = hunter.getPlayerIndex();
    const taggedIdx = tagged.getPlayerIndex();
    const hPos = hunter.getWorldPosition();

    // Base tag score: +100
    scoring.addScore(hunterIdx, 100, 'HUNTER TAG', hPos.x, hPos.y, '#00ffff');

    // Aerial bonus: +50 if both players were airborne
    if (isAerial) {
      scoring.addScore(hunterIdx, 50, 'AIR TAG BONUS!', hPos.x, hPos.y - 0.6, '#ffee00');
    }

    // Role transfer: the tagged player becomes the new hunter!
    this._hunterIndex = taggedIdx;
    hunter.setIsIt(false);
    tagged.setIsIt(true);

    // Reset evasion timer for the new hunter
    this._evasionTimers.set(taggedIdx, 0);
  }

  public getItPlayerIndex(): number | null {
    return this._hunterIndex;
  }

  public getCrownHolderIndex(): number | null {
    return null;
  }

  public getBombTimer(): number | null {
    return null;
  }

  public reset(): void {
    this._hunterIndex = 0;
    this._evasionTimers.clear();
  }

  public destroy(): void {
    this.reset();
  }
}
