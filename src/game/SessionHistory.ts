// src/game/SessionHistory.ts
// Calendar day session tracking (localStorage: neo-puppet-session-YYYY-MM-DD),
// recording match results and computing per-pair head-to-head rivalry matrices.

export interface SessionPlayerResult {
  id:       string;
  name:     string;
  color:    string;
  score:    number;
  tagsMade: number;
}

export interface SessionMatchRecord {
  id:          string;
  dateIso:     string;
  timeFormatted: string;
  modeName:    string;
  mapName:     string;
  players:     SessionPlayerResult[];
  winnerName:  string;
  winnerScore: number;
  winnerColor: string;
}

export interface PairMatchSummary {
  playerA:     string;
  playerB:     string;
  sharedGames: number;
  winsA:       number;
  winsB:       number;
  ties:        number;
  leader:      string;
}

export class SessionHistory {
  private static _instance: SessionHistory | null = null;

  public static getInstance(): SessionHistory {
    if (!this._instance) {
      this._instance = new SessionHistory();
    }
    return this._instance;
  }

  /**
   * Generates calendar key formatted as neo-puppet-session-YYYY-MM-DD.
   */
  public static getTodaySessionKey(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `neo-puppet-session-${yyyy}-${mm}-${dd}`;
  }

  public recordMatch(data: {
    modeName: string;
    mapName:  string;
    players:  SessionPlayerResult[];
  }): SessionMatchRecord {
    const now = new Date();
    const timeFormatted = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Find champion
    const sorted = [...data.players].sort((a, b) => b.score - a.score);
    const champ = sorted[0] || { name: 'UNKNOWN', score: 0, color: '#00ffff' };

    const record: SessionMatchRecord = {
      id:          Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4),
      dateIso:     now.toISOString(),
      timeFormatted,
      modeName:    data.modeName,
      mapName:     data.mapName,
      players:     data.players,
      winnerName:  champ.name,
      winnerScore: champ.score,
      winnerColor: champ.color,
    };

    const key = SessionHistory.getTodaySessionKey();
    try {
      const existing = this.getTodayMatches();
      existing.push(record);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      console.warn('[SessionHistory] Failed to write session to localStorage:', err);
    }

    return record;
  }

  public getTodayMatches(): SessionMatchRecord[] {
    const key = SessionHistory.getTodaySessionKey();
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as SessionMatchRecord[];
      }
    } catch {
      /* noop */
    }
    return [];
  }

  /**
   * Computes per-pair rivalry summary for all matches shared today.
   */
  public getPairSummaries(): PairMatchSummary[] {
    const matches = this.getTodayMatches();
    const map = new Map<string, PairMatchSummary>();

    for (const match of matches) {
      const pList = match.players;
      if (pList.length < 2) continue;

      for (let i = 0; i < pList.length; i++) {
        for (let j = i + 1; j < pList.length; j++) {
          const p1 = pList[i];
          const p2 = pList[j];

          // Canonical alphabetic key so order doesn't duplicate
          const isP1First = p1.name.localeCompare(p2.name) <= 0;
          const nameA = isP1First ? p1.name : p2.name;
          const nameB = isP1First ? p2.name : p1.name;
          const scoreA = isP1First ? p1.score : p2.score;
          const scoreB = isP1First ? p2.score : p1.score;

          const pairKey = `${nameA}__vs__${nameB}`;
          let entry = map.get(pairKey);
          if (!entry) {
            entry = {
              playerA: nameA,
              playerB: nameB,
              sharedGames: 0,
              winsA: 0,
              winsB: 0,
              ties: 0,
              leader: 'TIED',
            };
            map.set(pairKey, entry);
          }

          entry.sharedGames++;
          if (scoreA > scoreB) {
            entry.winsA++;
          } else if (scoreB > scoreA) {
            entry.winsB++;
          } else {
            entry.ties++;
          }

          if (entry.winsA > entry.winsB) {
            entry.leader = entry.playerA;
          } else if (entry.winsB > entry.winsA) {
            entry.leader = entry.playerB;
          } else {
            entry.leader = 'TIED';
          }
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.sharedGames - a.sharedGames);
  }
}
