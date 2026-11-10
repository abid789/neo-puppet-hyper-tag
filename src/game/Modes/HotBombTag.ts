// src/game/Modes/HotBombTag.ts
// Hot Bomb Tag: The IT player carries a volatile Neon Core with a 15s countdown.
// Tagging passes the bomb and awards points. On timer expiration, holder explodes, loses 50 pts,
// and a new random holder is chosen.

import type { GameMode } from './GameMode';
import type { Puppet } from '../../entities/Puppet';
import type { TagRulesEngine } from '../TagRulesEngine';
import type { ScoringEngine } from '../ScoringEngine';

export class HotBombTag implements GameMode {
  public readonly id = 'hot_bomb_tag';
  public readonly name = 'HOT BOMB TAG';
  public readonly description = 'Pass the volatile Neon Core before the 15s detonation timer expires!';

  private _bombHolderIndex = 0;
  private _bombTimer = 15.0; // 15-second countdown

  public init(puppets: Puppet[]): void {
    if (puppets.length === 0) return;

    this._bombHolderIndex = puppets[0].getPlayerIndex();
    this._bombTimer = 15.0;

    for (let i = 0; i < puppets.length; i++) {
      const p = puppets[i];
      const isHolder = p.getPlayerIndex() === this._bombHolderIndex;
      p.setIsIt(isHolder);
      p.setHasCrown(false);
      p.setBombTimer(isHolder ? this._bombTimer : null);
    }
  }

  public update(
    dt: number,
    puppets: Puppet[],
    tagRules: TagRulesEngine,
    scoring: ScoringEngine,
  ): void {
    const holder = puppets.find(p => p.getPlayerIndex() === this._bombHolderIndex);
    if (!holder) return;

    // Countdown active
    this._bombTimer -= dt;
    holder.setBombTimer(this._bombTimer);

    // Check detonation
    if (this._bombTimer <= 0) {
      this._detonateBomb(holder, puppets, scoring);
      return;
    }

    // Check pass tags against survivors
    for (let i = 0; i < puppets.length; i++) {
      const target = puppets[i];
      if (target.getPlayerIndex() === this._bombHolderIndex) continue;

      // Near miss check
      tagRules.checkNearMiss(holder, target);

      // Pass tag check
      if (tagRules.canTag(holder, target)) {
        const tagEvent = tagRules.executeTag(holder, target);
        this.onTag(holder, target, tagEvent.isAerial, scoring);
        break;
      }
    }
  }

  public onTag(
    holder: Puppet,
    tagged: Puppet,
    isAerial: boolean,
    scoring: ScoringEngine,
  ): void {
    const holderIdx = holder.getPlayerIndex();
    const taggedIdx = tagged.getPlayerIndex();
    const pos = holder.getWorldPosition();

    // Reward player who successfully passed the hot bomb
    scoring.addScore(holderIdx, 75, 'BOMB PASSED!', pos.x, pos.y, '#00ff88');
    if (isAerial) {
      scoring.addScore(holderIdx, 50, 'AIR PASS!', pos.x, pos.y - 0.5, '#ffee00');
    }

    // Transfer bomb
    this._bombHolderIndex = taggedIdx;
    holder.setIsIt(false);
    holder.setBombTimer(null);

    tagged.setIsIt(true);
    // Add 2.5s bonus time to new holder so transfer isn't instantaneous instant-kill
    this._bombTimer = Math.min(15.0, this._bombTimer + 2.5);
    tagged.setBombTimer(this._bombTimer);
  }

  private _detonateBomb(holder: Puppet, puppets: Puppet[], scoring: ScoringEngine): void {
    const pos = holder.getWorldPosition();

    // Deduct 50 points
    scoring.deductScore(this._bombHolderIndex, 50, 'BOMB DETONATION', pos.x, pos.y);

    // Explode holder in ragdoll blast
    holder.applyTag();
    holder.applyImpulse({ x: 0, y: -16.0 });
    holder.triggerBackflip();
    holder.setIsIt(false);
    holder.setBombTimer(null);

    // Pick a new random bomb holder from remaining players
    const others = puppets.filter(p => p.getPlayerIndex() !== this._bombHolderIndex);
    if (others.length > 0) {
      const nextHolder = others[Math.floor(Math.random() * others.length)];
      this._bombHolderIndex = nextHolder.getPlayerIndex();
      this._bombTimer = 15.0;
      nextHolder.setIsIt(true);
      nextHolder.setBombTimer(this._bombTimer);

      const nextPos = nextHolder.getWorldPosition();
      scoring.spawnFloatingText(nextPos.x * 50, nextPos.y * 50 - 30, 'NEW BOMB HOLDER!', '#ff0033');
    } else {
      this._bombTimer = 15.0;
      holder.setIsIt(true);
      holder.setBombTimer(this._bombTimer);
    }
  }

  public getItPlayerIndex(): number | null {
    return this._bombHolderIndex;
  }

  public getCrownHolderIndex(): number | null {
    return null;
  }

  public getBombTimer(): number | null {
    return this._bombTimer;
  }

  public reset(): void {
    this._bombHolderIndex = 0;
    this._bombTimer = 15.0;
  }

  public destroy(): void {
    this.reset();
  }
}
