// src/game/Modes/LastSurvivor.ts
// Last Survivor elimination mode:
// Every 20 seconds, the player with the lowest score (or the one tagged most recently on tie)
// is eliminated and ragdolls violently out of the arena.
// Last puppet standing wins! Round timer acts as backup.

import type { GameMode } from './GameMode';
import type { Puppet } from '../../entities/Puppet';
import type { TagRulesEngine } from '../TagRulesEngine';
import type { ScoringEngine } from '../ScoringEngine';

export class LastSurvivor implements GameMode {
  public readonly id = 'last_survivor';
  public readonly name = 'LAST SURVIVOR';
  public readonly description = 'Elimination tag! Every 20s, the lowest scorer is blasted out of the arena. Earn points by tagging opponents to stay alive!';

  public static readonly ELIMINATION_INTERVAL = 20.0; // 20-second cull cycle

  private readonly _aliveSet: Set<number> = new Set();
  private readonly _lastTaggedTimestamp: Map<number, number> = new Map();
  private _eliminationTimer = LastSurvivor.ELIMINATION_INTERVAL;
  private _roundOver = false;

  public init(puppets: Puppet[]): void {
    this._aliveSet.clear();
    this._lastTaggedTimestamp.clear();
    this._eliminationTimer = LastSurvivor.ELIMINATION_INTERVAL;
    this._roundOver = false;

    for (let i = 0; i < puppets.length; i++) {
      const p = puppets[i];
      const pIdx = p.getPlayerIndex();
      this._aliveSet.add(pIdx);
      p.resetElimination();
      p.setIsIt(false);
      p.setHasCrown(false);
      p.setBombTimer(null);
    }
  }

  public isEliminated(playerIndex: number): boolean {
    return !this._aliveSet.has(playerIndex);
  }

  public getEliminationCountdown(): number {
    return Math.max(0, this._eliminationTimer);
  }

  public isRoundOver(): boolean {
    return this._roundOver;
  }

  public update(
    dt: number,
    puppets: Puppet[],
    tagRules: TagRulesEngine,
    scoring: ScoringEngine,
  ): void {
    if (this._roundOver) return;

    // 1. Tick elimination countdown
    this._eliminationTimer -= dt;

    if (this._eliminationTimer <= 0) {
      this._eliminateLowestPlayer(puppets, scoring);
      this._eliminationTimer = LastSurvivor.ELIMINATION_INTERVAL;
      return;
    }

    // 2. Tags between all surviving active puppets
    const alivePuppets = puppets.filter(p => this._aliveSet.has(p.getPlayerIndex()));

    if (alivePuppets.length <= 1 && puppets.length > 1) {
      this._roundOver = true;
      const winner = alivePuppets[0];
      if (winner) {
        scoring.spawnFloatingText(0, -60, `PLAYER ${winner.getPlayerIndex() + 1} IS THE LAST SURVIVOR!`, '#00ff88');
      }
      return;
    }

    for (let i = 0; i < alivePuppets.length; i++) {
      const pA = alivePuppets[i];

      for (let j = 0; j < alivePuppets.length; j++) {
        if (i === j) continue;
        const pB = alivePuppets[j];

        // Fair-play near-miss detector
        tagRules.checkNearMiss(pA, pB);

        // Tag collision check
        if (tagRules.canTag(pA, pB)) {
          const tagEvent = tagRules.executeTag(pA, pB);
          this.onTag(pA, pB, tagEvent.isAerial, scoring);
          break;
        }
      }
    }
  }

  public onTag(
    tagger: Puppet,
    victim: Puppet,
    isAerial: boolean,
    scoring: ScoringEngine,
  ): void {
    const taggerIdx = tagger.getPlayerIndex();
    const victimIdx = victim.getPlayerIndex();
    const pos = tagger.getWorldPosition();

    // Reward the tagger with survival score points
    scoring.addScore(taggerIdx, 100, 'SURVIVOR TAG!', pos.x, pos.y, '#00ffff');
    if (isAerial) {
      scoring.addScore(taggerIdx, 50, 'AIR DODGE TAG!', pos.x, pos.y - 0.5, '#ffee00');
    }

    // Track timestamp for tie-breaker resolution
    this._lastTaggedTimestamp.set(victimIdx, performance.now());
  }

  private _eliminateLowestPlayer(puppets: Puppet[], scoring: ScoringEngine): void {
    const alivePuppets = puppets.filter(p => this._aliveSet.has(p.getPlayerIndex()));
    if (alivePuppets.length <= 1) {
      this._roundOver = true;
      return;
    }

    // Sort alive players:
    // 1. Ascending score (lowest score first)
    // 2. Descending last tagged timestamp (most recently tagged on tie)
    const sorted = [...alivePuppets].sort((a, b) => {
      const scoreA = scoring.getPlayerStats(a.getPlayerIndex())?.score ?? 0;
      const scoreB = scoring.getPlayerStats(b.getPlayerIndex())?.score ?? 0;
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      const tagTimeA = this._lastTaggedTimestamp.get(a.getPlayerIndex()) ?? 0;
      const tagTimeB = this._lastTaggedTimestamp.get(b.getPlayerIndex()) ?? 0;
      return tagTimeB - tagTimeA;
    });

    const victim = sorted[0];
    const victimIdx = victim.getPlayerIndex();

    // Eliminate puppet: ragdoll violently out of arena
    this._aliveSet.delete(victimIdx);
    victim.eliminate();

    scoring.spawnFloatingText(0, -50, `PLAYER ${victimIdx + 1} ELIMINATED!`, '#ff0033');

    // If only one remains, declare champion
    if (this._aliveSet.size <= 1) {
      this._roundOver = true;
      const winner = puppets.find(p => this._aliveSet.has(p.getPlayerIndex()));
      if (winner) {
        scoring.spawnFloatingText(0, -80, `CHAMPION: PLAYER ${winner.getPlayerIndex() + 1}!`, '#ffee00');
      }
    }
  }

  public getItPlayerIndex(): number | null {
    return null;
  }

  public getCrownHolderIndex(): number | null {
    return null;
  }

  public getBombTimer(): number | null {
    return this._eliminationTimer;
  }

  public reset(): void {
    this._aliveSet.clear();
    this._lastTaggedTimestamp.clear();
    this._eliminationTimer = LastSurvivor.ELIMINATION_INTERVAL;
    this._roundOver = false;
  }

  public destroy(): void {
    this.reset();
  }
}
