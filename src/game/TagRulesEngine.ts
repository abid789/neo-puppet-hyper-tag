// src/game/TagRulesEngine.ts
// Shared tag collision detection, mandatory fair-play rules, grace periods, and near-miss detection.

import { PPM } from '../types';
import type { Puppet } from '../entities/Puppet';
import type { ScoringEngine } from './ScoringEngine';
import type { Engine } from '../core/Engine';

export interface TagEvent {
  taggerIndex: number;
  taggedIndex: number;
  isAerial:    boolean;
  timestamp:   number;
}

export class TagRulesEngine {
  private readonly _scoring: ScoringEngine;
  private readonly _engine: Engine;

  // Fair-play rule constants
  public static readonly STUN_DURATION = 0.6;       // 0.6s stun on newly tagged player
  public static readonly RE_TAG_GRACE_TIME = 1.8;   // 1.8s anti-tagback immunity window
  public static readonly NEAR_MISS_DIST_PX = 45;    // 45px proximity threshold

  // Map of `${taggerIdx}_${victimIdx}` -> remaining immunity time
  private _reTagImmunityMap: Map<string, number> = new Map();

  // Cooldown to prevent multi-triggering near-misses on the same pass
  private _nearMissCooldownMap: Map<string, number> = new Map();

  constructor(scoring: ScoringEngine, engine: Engine) {
    this._scoring = scoring;
    this._engine = engine;
  }

  public update(dt: number): void {
    // Decay re-tag immunity timers
    for (const [key, t] of this._reTagImmunityMap.entries()) {
      if (t <= dt) {
        this._reTagImmunityMap.delete(key);
      } else {
        this._reTagImmunityMap.set(key, t - dt);
      }
    }

    // Decay near-miss cooldown timers
    for (const [key, t] of this._nearMissCooldownMap.entries()) {
      if (t <= dt) {
        this._nearMissCooldownMap.delete(key);
      } else {
        this._nearMissCooldownMap.set(key, t - dt);
      }
    }
  }

  public checkNearMiss(
    tagger: Puppet,
    survivor: Puppet,
  ): boolean {
    const tIdx = tagger.getPlayerIndex();
    const sIdx = survivor.getPlayerIndex();
    const pairKey = `${tIdx}_${sIdx}`;

    if (this._nearMissCooldownMap.has(pairKey)) return false;

    // Tagger must be actively lunging (dashing or high horizontal velocity)
    const tVel = tagger.getLinvel();
    const isLunging = tagger.isDashing() || Math.hypot(tVel.x, tVel.y) > 6.0;
    if (!isLunging) return false;

    const tPos = tagger.getWorldPosition();
    const sPos = survivor.getWorldPosition();
    const distPx = Math.hypot(tPos.x - sPos.x, tPos.y - sPos.y) * PPM;

    // Near-miss threshold is within 45px but without direct collision (> 24px)
    if (distPx <= TagRulesEngine.NEAR_MISS_DIST_PX && distPx > 26) {
      this._nearMissCooldownMap.set(pairKey, 1.2); // 1.2s cooldown per pair

      // Slow-motion micro-pulse: 0.3s at 40% speed
      this._engine.setTimeScale(0.4, 0.3);

      // Record score and trigger UI popup
      this._scoring.recordNearMiss(sIdx, sPos.x, sPos.y);

      return true;
    }

    return false;
  }

  public canTag(tagger: Puppet, target: Puppet): boolean {
    const tIdx = tagger.getPlayerIndex();
    const targetIdx = target.getPlayerIndex();

    // Cannot tag self
    if (tIdx === targetIdx) return false;

    // Target has active phase shield? Will absorb tag, but check passes
    // Target has anti-tagback immunity against this tagger?
    const immunityKey = `${targetIdx}_${tIdx}`;
    if (this._reTagImmunityMap.has(immunityKey)) {
      return false; // Anti-tagback grace active
    }

    // Check physical distance between torsos
    const tPos = tagger.getWorldPosition();
    const targetPos = target.getWorldPosition();
    const dist = Math.hypot(tPos.x - targetPos.x, tPos.y - targetPos.y);

    const tagReachM = 0.85; // 42.5 px
    return dist <= tagReachM;
  }

  public executeTag(tagger: Puppet, tagged: Puppet): TagEvent {
    const taggerIdx = tagger.getPlayerIndex();
    const taggedIdx = tagged.getPlayerIndex();

    const isAerial = tagger.isAirborne() && tagged.isAirborne();

    // 1. Mandatory Fair-Play: 0.6s Stun on newly tagged player
    tagged.setStun(TagRulesEngine.STUN_DURATION);

    // 2. Mandatory Fair-Play: 1.8s Re-tag immunity against previous tagger
    // Key: tagged cannot re-tag previous tagger
    const immunityKey = `${taggedIdx}_${taggerIdx}`;
    this._reTagImmunityMap.set(immunityKey, TagRulesEngine.RE_TAG_GRACE_TIME);

    // 3. Flashing holographic shield ring on newly tagged player
    tagged.setTagGraceShield(TagRulesEngine.RE_TAG_GRACE_TIME);

    // 4. Update Puppet physical states
    tagged.applyTag();

    // 5. Scoring & stats update
    this._scoring.recordTagMade(taggerIdx);
    this._scoring.recordTagged(taggedIdx);

    return {
      taggerIndex: taggerIdx,
      taggedIndex: taggedIdx,
      isAerial,
      timestamp: performance.now(),
    };
  }

  public reset(): void {
    this._reTagImmunityMap.clear();
    this._nearMissCooldownMap.clear();
  }
}
