// src/game/Modes/TeamTag.ts
// Team Tag mode: Two teams (Red & Blue).
// Players score when they tag an opposing team member. Team members cannot tag each other.
// Team score is the sum of member scores, displayed in the HUD.

import type { GameMode } from './GameMode';
import type { Puppet } from '../../entities/Puppet';
import type { TagRulesEngine } from '../TagRulesEngine';
import type { ScoringEngine } from '../ScoringEngine';

export type TeamSide = 'red' | 'blue';

export class TeamTag implements GameMode {
  public readonly id = 'team_tag';
  public readonly name = 'TEAM TAG';
  public readonly description = 'Red vs Blue! Tag players on the opposing team to rack up team points. Friendly fire is disabled.';

  private _teamMap: Map<number, TeamSide> = new Map(); // playerIndex -> team

  public init(puppets: Puppet[]): void {
    this._teamMap.clear();

    for (let i = 0; i < puppets.length; i++) {
      const p = puppets[i];
      const pIdx = p.getPlayerIndex();
      // Even indices -> Red Team, Odd indices -> Blue Team
      const team: TeamSide = pIdx % 2 === 0 ? 'red' : 'blue';
      this._teamMap.set(pIdx, team);

      p.setIsIt(false);
      p.setHasCrown(false);
      p.setBombTimer(null);
    }
  }

  public getTeam(playerIndex: number): TeamSide {
    return this._teamMap.get(playerIndex) ?? (playerIndex % 2 === 0 ? 'red' : 'blue');
  }

  public getTeamScores(scoring: ScoringEngine): { red: number; blue: number } {
    let red = 0;
    let blue = 0;
    const allStats = scoring.getAllStats();
    for (let i = 0; i < allStats.length; i++) {
      const st = allStats[i];
      const t = this.getTeam(st.playerIndex);
      if (t === 'red') {
        red += st.score;
      } else {
        blue += st.score;
      }
    }
    return { red, blue };
  }

  public update(
    dt: number,
    puppets: Puppet[],
    tagRules: TagRulesEngine,
    scoring: ScoringEngine,
  ): void {
    void dt;

    // Check tags & near misses between opposing teams
    for (let i = 0; i < puppets.length; i++) {
      const pA = puppets[i];
      const idxA = pA.getPlayerIndex();
      const teamA = this.getTeam(idxA);

      for (let j = 0; j < puppets.length; j++) {
        if (i === j) continue;
        const pB = puppets[j];
        const idxB = pB.getPlayerIndex();
        const teamB = this.getTeam(idxB);

        // Friendly fire disabled: teammates cannot tag or near-miss each other
        if (teamA === teamB) continue;

        // 1. Fair-play Near-Miss detector
        tagRules.checkNearMiss(pA, pB);

        // 2. Tag collision check (pA tags pB)
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
    _tagged: Puppet,
    isAerial: boolean,
    scoring: ScoringEngine,
  ): void {
    const taggerIdx = tagger.getPlayerIndex();
    const pos = tagger.getWorldPosition();
    const taggerTeam = this.getTeam(taggerIdx);
    const color = taggerTeam === 'red' ? '#ff0055' : '#00ffff';

    // Base tag score: +100 points
    scoring.addScore(taggerIdx, 100, `${taggerTeam.toUpperCase()} TEAM TAG!`, pos.x, pos.y, color);

    // Aerial acrobatic tag bonus
    if (isAerial) {
      scoring.addScore(taggerIdx, 50, 'AIR STRIKE BONUS!', pos.x, pos.y - 0.6, '#ffee00');
    }
  }

  public getItPlayerIndex(): number | null {
    return null;
  }

  public getCrownHolderIndex(): number | null {
    return null;
  }

  public getBombTimer(): number | null {
    return null;
  }

  public reset(): void {
    this._teamMap.clear();
  }

  public destroy(): void {
    this.reset();
  }
}
