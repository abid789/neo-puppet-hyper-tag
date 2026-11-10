// src/game/MatchRecap.ts
// Comprehensive match recap tracking, session memory, and per-map win distribution statistics.
// Persists local match balance metrics to localStorage key 'neo-puppet-map-stats'.

export interface HighestScoringMoment {
  playerIndex:  number;
  playerName:   string;
  scoreEarned:  number;
  label:        string;
  timestampSec: number;
}

export interface PlayerRecapStats {
  playerIndex:   number;
  name:          string;
  color:         string;
  score:         number;
  tagsGiven:     number;
  timesTagged:   number;
  nearMisses:    number;
  fallsCaused:   number;
  longestStreak: number;
}

export interface MatchRecapData {
  mapId:         string;
  mapName:       string;
  modeName:      string;
  durationSec:   number;
  completedAt:   number;
  players:       PlayerRecapStats[];
  highestMoment: HighestScoringMoment | null;
  winnerIndex:   number;
}

export interface MapSpawnWinRecord {
  totalMatches:    number;
  leftSpawnWins:   number; // Spawns starting at x < 0
  rightSpawnWins:  number; // Spawns starting at x >= 0
  winsByPlayer:    Record<number, number>;
}

export type MapStatsStorage = Record<string, MapSpawnWinRecord>;

const MAP_STATS_STORAGE_KEY = 'neo-puppet-map-stats';

export class MatchRecapManager {
  private static _instance: MatchRecapManager | null = null;

  // Active in-match tracking
  private _highestMoment: HighestScoringMoment | null = null;
  private _matchStartTime = 0;

  // In-memory session recap
  private _latestRecap: MatchRecapData | null = null;

  private constructor() {}

  public static getInstance(): MatchRecapManager {
    if (!MatchRecapManager._instance) {
      MatchRecapManager._instance = new MatchRecapManager();
    }
    return MatchRecapManager._instance;
  }

  public startNewMatch(): void {
    this._highestMoment = null;
    this._matchStartTime = performance.now();
  }

  public recordScoreEvent(
    playerIndex: number,
    playerName: string,
    scoreEarned: number,
    label: string,
  ): void {
    const elapsedSec = (performance.now() - this._matchStartTime) / 1000;
    if (!this._highestMoment || scoreEarned > this._highestMoment.scoreEarned) {
      this._highestMoment = {
        playerIndex,
        playerName,
        scoreEarned,
        label,
        timestampSec: elapsedSec,
      };
    }
  }

  public finalizeMatchRecap(data: {
    mapId:       string;
    mapName:     string;
    modeName:    string;
    durationSec: number;
    players:     PlayerRecapStats[];
    winnerSpawnX: number;
  }): MatchRecapData {
    // Sort players descending by score
    const sorted = [...data.players].sort((a, b) => b.score - a.score);
    const winner = sorted[0];
    const winnerIdx = winner ? winner.playerIndex : 0;

    const recap: MatchRecapData = {
      mapId:         data.mapId,
      mapName:       data.mapName,
      modeName:      data.modeName,
      durationSec:   data.durationSec,
      completedAt:   Date.now(),
      players:       sorted,
      highestMoment: this._highestMoment,
      winnerIndex:   winnerIdx,
    };

    // Keep in session memory
    this._latestRecap = recap;

    // Record per-map win stats in localStorage
    this._recordMapWin(data.mapId, winnerIdx, data.winnerSpawnX);

    return recap;
  }

  public getLatestRecap(): MatchRecapData | null {
    return this._latestRecap;
  }

  // ── Persistent Map Statistics (localStorage) ──────────────────────────────
  public getMapStats(): MapStatsStorage {
    try {
      const raw = localStorage.getItem(MAP_STATS_STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as MapStatsStorage;
    } catch {
      return {};
    }
  }

  private _recordMapWin(mapId: string, winnerIndex: number, winnerSpawnX: number): void {
    try {
      const stats = this.getMapStats();
      if (!stats[mapId]) {
        stats[mapId] = {
          totalMatches:   0,
          leftSpawnWins:  0,
          rightSpawnWins: 0,
          winsByPlayer:   {},
        };
      }

      const entry = stats[mapId];
      entry.totalMatches++;

      if (winnerSpawnX < 0) {
        entry.leftSpawnWins++;
      } else {
        entry.rightSpawnWins++;
      }

      entry.winsByPlayer[winnerIndex] = (entry.winsByPlayer[winnerIndex] ?? 0) + 1;

      localStorage.setItem(MAP_STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch (e) {
      console.warn('[MatchRecapManager] Failed to persist map stats:', e);
    }
  }
}
