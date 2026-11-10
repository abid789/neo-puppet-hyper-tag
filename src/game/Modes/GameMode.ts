// src/game/Modes/GameMode.ts
// Common interface for all NEO-PUPPET: HYPER TAG game modes.

import type { Puppet } from '../../entities/Puppet';
import type { TagRulesEngine } from '../TagRulesEngine';
import type { ScoringEngine } from '../ScoringEngine';

export interface GameMode {
  readonly id:          string;
  readonly name:        string;
  readonly description: string;

  init(puppets: Puppet[]): void;
  update(dt: number, puppets: Puppet[], tagRules: TagRulesEngine, scoring: ScoringEngine): void;
  onTag(tagger: Puppet, tagged: Puppet, isAerial: boolean, scoring: ScoringEngine): void;
  getItPlayerIndex(): number | null;
  getCrownHolderIndex(): number | null;
  getBombTimer(): number | null;
  reset(): void;
  destroy(): void;
}
