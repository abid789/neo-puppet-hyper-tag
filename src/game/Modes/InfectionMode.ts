// src/game/Modes/InfectionMode.ts
// Infection mode: One player starts as Patient Zero (infected IT).
// Every tag infects a survivor into the zombie horde.
// Survivors accumulate points for each second they remain clean.
// Round ends when all puppets are infected or the clock expires.

import type { GameMode } from './GameMode';
import type { Puppet } from '../../entities/Puppet';
import type { TagRulesEngine } from '../TagRulesEngine';
import type { ScoringEngine } from '../ScoringEngine';

export class InfectionMode implements GameMode {
  public readonly id = 'infection_mode';
  public readonly name = 'INFECTION';
  public readonly description = 'Survive the viral outbreak! One player begins infected. Each tag spreads the virus. Can you be the last human standing?';

  private readonly _infectedSet: Set<number> = new Set();
  private _survivalTimer = 0;
  private _roundOver = false;

  public init(puppets: Puppet[]): void {
    this._infectedSet.clear();
    this._survivalTimer = 0;
    this._roundOver = false;

    if (puppets.length === 0) return;

    // Designate initial Patient Zero
    const patientZeroIdx = puppets[0].getPlayerIndex();
    this._infectedSet.add(patientZeroIdx);

    for (let i = 0; i < puppets.length; i++) {
      const p = puppets[i];
      const isInfected = this._infectedSet.has(p.getPlayerIndex());
      p.setIsIt(isInfected);
      p.setHasCrown(false);
      p.setBombTimer(null);
    }
  }

  public isInfected(playerIndex: number): boolean {
    return this._infectedSet.has(playerIndex);
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

    // 1. Survivor survival tick points: +20 pts every second alive and uninfected
    this._survivalTimer += dt;
    if (this._survivalTimer >= 1.0) {
      this._survivalTimer -= 1.0;
      for (let i = 0; i < puppets.length; i++) {
        const p = puppets[i];
        const pIdx = p.getPlayerIndex();
        if (!this._infectedSet.has(pIdx)) {
          const pos = p.getWorldPosition();
          scoring.addScore(pIdx, 20, 'SURVIVOR TIME', pos.x, pos.y, '#00ff88');
          scoring.recordSurvivalTime(pIdx, 1.0);
        }
      }
    }

    // 2. Check tags from all infected players against survivors
    const infectedPuppets = puppets.filter(p => this._infectedSet.has(p.getPlayerIndex()));
    const survivorPuppets = puppets.filter(p => !this._infectedSet.has(p.getPlayerIndex()));

    // Early termination if all survivors have already been converted
    if (survivorPuppets.length === 0 && puppets.length > 1) {
      this._roundOver = true;
      scoring.spawnFloatingText(0, -60, 'ALL PLAYERS INFECTED! HORDE WINS!', '#ff0033');
      return;
    }

    for (let i = 0; i < infectedPuppets.length; i++) {
      const infected = infectedPuppets[i];

      for (let j = 0; j < survivorPuppets.length; j++) {
        const survivor = survivorPuppets[j];

        // Mandatory near-miss check
        tagRules.checkNearMiss(infected, survivor);

        // Tag collision check
        if (tagRules.canTag(infected, survivor)) {
          const tagEvent = tagRules.executeTag(infected, survivor);
          this.onTag(infected, survivor, tagEvent.isAerial, scoring);
          break;
        }
      }
    }
  }

  public onTag(
    infected: Puppet,
    victim: Puppet,
    isAerial: boolean,
    scoring: ScoringEngine,
  ): void {
    const infectedIdx = infected.getPlayerIndex();
    const victimIdx = victim.getPlayerIndex();
    const pos = victim.getWorldPosition();

    // Reward the infector
    scoring.addScore(infectedIdx, 100, 'INFECTION SPREAD!', pos.x, pos.y, '#ff0055');
    if (isAerial) {
      scoring.addScore(infectedIdx, 50, 'AIR INFECTION!', pos.x, pos.y - 0.5, '#ffee00');
    }

    // Convert victim to infected
    this._infectedSet.add(victimIdx);
    victim.setIsIt(true);

    scoring.spawnFloatingText(pos.x * 50, pos.y * 50 - 30, `PLAYER ${victimIdx + 1} INFECTED!`, '#ff0055');
  }

  public getItPlayerIndex(): number | null {
    // Return first infected player for camera or HUD indicator
    const first = this._infectedSet.values().next().value;
    return first !== undefined ? first : null;
  }

  public getCrownHolderIndex(): number | null {
    return null;
  }

  public getBombTimer(): number | null {
    return null;
  }

  public reset(): void {
    this._infectedSet.clear();
    this._survivalTimer = 0;
    this._roundOver = false;
  }

  public destroy(): void {
    this.reset();
  }
}
