// src/game/Modes/CrownKeepAway.ts
// Crown Keep-Away: Touching the crown holder steals the crown.
// The holder accumulates +25 points per second and gains 20% reduced dash cooldown.

import type { GameMode } from './GameMode';
import type { Puppet } from '../../entities/Puppet';
import type { TagRulesEngine } from '../TagRulesEngine';
import type { ScoringEngine } from '../ScoringEngine';

export class CrownKeepAway implements GameMode {
  public readonly id = 'crown_keep_away';
  public readonly name = 'CROWN KEEP-AWAY';
  public readonly description = 'Possess the Golden Crown to generate +25 pts/sec and 20% faster dashes!';

  private _crownHolderIndex = 0;
  private _holdScoreTimer = 0;

  public init(puppets: Puppet[]): void {
    if (puppets.length === 0) return;

    // Designate initial crown holder
    this._crownHolderIndex = puppets[0].getPlayerIndex();
    this._holdScoreTimer = 0;

    for (let i = 0; i < puppets.length; i++) {
      const p = puppets[i];
      const hasCrown = p.getPlayerIndex() === this._crownHolderIndex;
      p.setHasCrown(hasCrown);
      p.setIsIt(hasCrown);
      p.setBombTimer(null);
    }
  }

  public update(
    dt: number,
    puppets: Puppet[],
    tagRules: TagRulesEngine,
    scoring: ScoringEngine,
  ): void {
    const holder = puppets.find(p => p.getPlayerIndex() === this._crownHolderIndex);
    if (!holder) return;

    // Crown possession score rate: +25 points per second
    this._holdScoreTimer += dt;
    scoring.recordHoldTime(this._crownHolderIndex, dt);

    if (this._holdScoreTimer >= 1.0) {
      this._holdScoreTimer -= 1.0;
      const pos = holder.getWorldPosition();
      scoring.addScore(this._crownHolderIndex, 25, 'CROWN HOLD', pos.x, pos.y, '#ffee00');
    }

    // Check steal attempts by challengers
    for (let i = 0; i < puppets.length; i++) {
      const challenger = puppets[i];
      if (challenger.getPlayerIndex() === this._crownHolderIndex) continue;

      // Near miss check
      tagRules.checkNearMiss(challenger, holder);

      // Crown steal check: challenger touches crown holder
      if (tagRules.canTag(challenger, holder)) {
        const tagEvent = tagRules.executeTag(challenger, holder);
        this.onTag(challenger, holder, tagEvent.isAerial, scoring);
        break;
      }
    }
  }

  public onTag(
    challenger: Puppet,
    previousHolder: Puppet,
    isAerial: boolean,
    scoring: ScoringEngine,
  ): void {
    const challengerIdx = challenger.getPlayerIndex();
    const cPos = challenger.getWorldPosition();

    // Reward successful crown heist
    scoring.addScore(challengerIdx, 50, 'CROWN STOLEN!', cPos.x, cPos.y, '#ffee00');
    if (isAerial) {
      scoring.addScore(challengerIdx, 50, 'AIR HIJACK!', cPos.x, cPos.y - 0.5, '#00ffff');
    }

    // Transfer crown
    this._crownHolderIndex = challengerIdx;
    previousHolder.setHasCrown(false);
    previousHolder.setIsIt(false);

    challenger.setHasCrown(true);
    challenger.setIsIt(true);

    this._holdScoreTimer = 0;
  }

  public getItPlayerIndex(): number | null {
    return this._crownHolderIndex;
  }

  public getCrownHolderIndex(): number | null {
    return this._crownHolderIndex;
  }

  public getBombTimer(): number | null {
    return null;
  }

  public reset(): void {
    this._crownHolderIndex = 0;
    this._holdScoreTimer = 0;
  }

  public destroy(): void {
    this.reset();
  }
}
