// src/network/NetSync.ts
// Client-side prediction, authoritative host simulation, and 50ms snapshot interpolation.

import type { Puppet } from '../entities/Puppet';
import type { Vec2, InputState, PuppetState } from '../types';
import { lerp, lerpAngle } from '../types';
import { NetworkManager } from './NetworkManager';
import type { WorldSnapshot, PuppetSnapshotData, ClientInputPacket } from './SnapshotCodec';

interface PredictionRecord {
  sequence:     number;
  input:        InputState;
  timestamp:    number;
  predictedPos: Vec2;
  predictedVel: Vec2;
}

interface StampedPuppetState {
  timestamp:     number;
  pos:           Vec2;
  vel:           Vec2;
  torsoRot:      number;
  headRot:       number;
  state:         PuppetState;
  isIt:          boolean;
  hasCrown:      boolean;
  hasBomb:       boolean;
  isStunned:     boolean;
  tagGrace:      boolean;
  phaseShield:   boolean;
  hyperSurge:    boolean;
  isDashing:     boolean;
  facingRight:   boolean;
  bombTimer:     number | null;
}

export class NetSync {
  private readonly _net: NetworkManager;
  private _puppets: Puppet[] = [];
  private _tick = 0;

  // Client Prediction state
  private _inputSequence = 0;
  private readonly _predictionHistory: PredictionRecord[] = [];
  private static readonly MAX_PREDICTION_HISTORY = 120;
  private static readonly RECONCILIATION_THRESHOLD_METRES = 0.08;

  // Remote Puppet Interpolation Buffers (50ms interpolation delay)
  public static readonly INTERPOLATION_DELAY_MS = 50;
  private readonly _remoteBuffers: Map<number, StampedPuppetState[]> = new Map();

  // Ping calculation
  private _pingMs = 0;
  private _onPingUpdatedCb: ((ping: number) => void) | null = null;

  constructor(net: NetworkManager = NetworkManager.getInstance()) {
    this._net = net;

    // Listen to authoritative snapshots from host
    this._net.onSnapshot((snap) => {
      this._handleIncomingSnapshot(snap);
    });

    // Host listens to client inputs
    this._net.onInput((inputPacket) => {
      this._handleIncomingClientInput(inputPacket);
    });
  }

  public setPuppets(puppets: Puppet[]): void {
    this._puppets = puppets;
    this._remoteBuffers.clear();
    for (let i = 0; i < puppets.length; i++) {
      this._remoteBuffers.set(i, []);
    }
  }

  public onPingUpdated(cb: (ping: number) => void): void {
    this._onPingUpdatedCb = cb;
  }

  public get ping(): number {
    return this._pingMs;
  }

  /**
   * Called during fixedUpdate (60Hz).
   */
  public fixedUpdate(dt: number): void {
    void dt;
    this._tick++;

    if (this._net.isHost) {
      // ── AUTHORITATIVE HOST: Broadcast snapshot to clients ──────────────────
      if (this._puppets.length > 0) {
        const snap = this._captureWorldSnapshot();
        this._net.sendSnapshot(snap);
      }
    } else {
      // ── CLIENT: Record prediction for local puppet ─────────────────────────
      const localIdx = this._net.localPlayerIndex;
      const localPuppet = this._puppets[localIdx];
      if (localPuppet) {
        this._inputSequence++;
        const curPos = localPuppet.getWorldPosition();
        const curVel = localPuppet.getLinvel();
        const curInput = localPuppet.getCurrentInput();

        // Sample current local input from puppet
        const record: PredictionRecord = {
          sequence: this._inputSequence,
          input: curInput,
          timestamp: performance.now(),
          predictedPos: { ...curPos },
          predictedVel: { ...curVel },
        };

        this._predictionHistory.push(record);
        if (this._predictionHistory.length > NetSync.MAX_PREDICTION_HISTORY) {
          this._predictionHistory.shift();
        }

        // Send input packet to Host
        this._net.sendInput({
          playerIndex: localIdx,
          sequence: this._inputSequence,
          clientTime: record.timestamp,
          input: record.input,
        });
      }
    }
  }

  /**
   * Client sends an active input command to the Host.
   */
  public sendClientInput(input: InputState): void {
    if (this._net.isHost) return;

    const localIdx = this._net.localPlayerIndex;
    this._inputSequence++;

    const packet: ClientInputPacket = {
      playerIndex: localIdx,
      sequence: this._inputSequence,
      clientTime: performance.now(),
      input,
    };

    this._net.sendInput(packet);
  }

  private _handleIncomingClientInput(packet: ClientInputPacket): void {
    if (!this._net.isHost) return;

    // Authoritative host applies client input directly to their physics puppet
    const p = this._puppets[packet.playerIndex];
    if (p) {
      p.setBotInput(packet.input);
    }
  }

  private _handleIncomingSnapshot(snap: WorldSnapshot): void {
    const now = performance.now();
    // Compute round-trip ping if client
    if (!this._net.isHost) {
      const rtt = Math.max(1, Math.round(now - snap.hostTimestamp));
      this._pingMs = Math.round(this._pingMs * 0.8 + rtt * 0.2);
      if (this._onPingUpdatedCb) {
        this._onPingUpdatedCb(this._pingMs);
      }
    }

    const localIdx = this._net.localPlayerIndex;

    for (let i = 0; i < snap.puppets.length; i++) {
      const data = snap.puppets[i];
      const pIdx = data.playerIndex;

      if (!this._net.isHost && pIdx === localIdx) {
        // ── Client-side Reconciliation for local puppet ──────────────────────
        this._reconcileLocalPuppet(data);
      } else {
        // ── Remote puppet snapshot interpolation buffer ───────────────────────
        let buf = this._remoteBuffers.get(pIdx);
        if (!buf) {
          buf = [];
          this._remoteBuffers.set(pIdx, buf);
        }

        buf.push({
          timestamp: snap.hostTimestamp,
          pos: { x: data.posX, y: data.posY },
          vel: { x: data.vx, y: data.vy },
          torsoRot: data.torsoRot,
          headRot: data.headRot,
          state: data.state,
          isIt: data.isIt,
          hasCrown: data.hasCrown,
          hasBomb: data.hasBomb,
          isStunned: data.isStunned,
          tagGrace: data.hasTagGraceShield,
          phaseShield: data.hasPhaseShield,
          hyperSurge: data.hasHyperSurge,
          isDashing: data.isDashing,
          facingRight: data.facingRight,
          bombTimer: data.bombTimer,
        });

        // Keep buffer trimmed to ~1 second
        if (buf.length > 60) {
          buf.shift();
        }
      }
    }
  }

  private _reconcileLocalPuppet(hostData: PuppetSnapshotData): void {
    const localPuppet = this._puppets[hostData.playerIndex];
    if (!localPuppet) return;

    const curPos = localPuppet.getWorldPosition();
    const dx = curPos.x - hostData.posX;
    const dy = curPos.y - hostData.posY;
    const err = Math.hypot(dx, dy);

    // If prediction diverged noticeably from host authority, reconcile!
    if (err > NetSync.RECONCILIATION_THRESHOLD_METRES) {
      localPuppet.teleport(hostData.posX, hostData.posY);
      const torso = localPuppet.getTorsoBody();
      torso.setLinvel({ x: hostData.vx, y: hostData.vy }, true);
    }
  }

  /**
   * Applies smooth 50ms snapshot interpolation to all remote puppets.
   */
  public interpolateRemotePuppets(): void {
    const renderTime = performance.now() - NetSync.INTERPOLATION_DELAY_MS;
    const localIdx = this._net.isHost ? -1 : this._net.localPlayerIndex;

    for (let i = 0; i < this._puppets.length; i++) {
      if (i === localIdx) continue; // Skip local predicted puppet

      const buf = this._remoteBuffers.get(i);
      if (!buf || buf.length < 2) continue;

      // Find two snapshots surrounding renderTime
      let s0: StampedPuppetState | null = null;
      let s1: StampedPuppetState | null = null;

      for (let j = 0; j < buf.length - 1; j++) {
        if (buf[j].timestamp <= renderTime && buf[j + 1].timestamp >= renderTime) {
          s0 = buf[j];
          s1 = buf[j + 1];
          break;
        }
      }

      // If renderTime is ahead of buffer, extrapolate slightly from the latest snapshot
      if (!s0 || !s1) {
        const latest = buf[buf.length - 1];
        const p = this._puppets[i];
        p.teleport(latest.pos.x, latest.pos.y);
        continue;
      }

      const totalSpan = s1.timestamp - s0.timestamp;
      const t = totalSpan > 0 ? (renderTime - s0.timestamp) / totalSpan : 0;

      const interpX = lerp(s0.pos.x, s1.pos.x, t);
      const interpY = lerp(s0.pos.y, s1.pos.y, t);
      const interpRot = lerpAngle(s0.torsoRot, s1.torsoRot, t);

      const puppet = this._puppets[i];
      puppet.teleport(interpX, interpY);
      puppet.getTorsoBody().setRotation(interpRot, true);

      // Apply network synchronized state indicators
      puppet.setIsIt(s1.isIt);
      puppet.setHasCrown(s1.hasCrown);
      puppet.setBombTimer(s1.bombTimer);
      if (s1.tagGrace && !puppet.hasTagGraceShield()) {
        puppet.setTagGraceShield(1.8);
      }
    }
  }

  private _captureWorldSnapshot(): WorldSnapshot {
    const puppetData: PuppetSnapshotData[] = [];

    for (let i = 0; i < this._puppets.length; i++) {
      const p = this._puppets[i];
      const pos = p.getWorldPosition();
      const vel = p.getLinvel();
      const torso = p.getTorsoBody();

      puppetData.push({
        playerIndex:       p.getPlayerIndex(),
        state:             p.getState(),
        isIt:              p.isIt(),
        hasCrown:          p.hasCrown(),
        hasBomb:           p.getBombTimer() !== null,
        isStunned:         p.isStunned(),
        hasTagGraceShield: p.hasTagGraceShield(),
        hasPhaseShield:    p.hasPhaseShield(),
        hasHyperSurge:     p.getActivePowerUp()?.type === 'hyper_surge',
        isDashing:         p.isDashing(),
        isGrounded:        !p.isAirborne(),
        facingRight:       vel.x >= 0,
        lowGravity:        false,
        posX:              pos.x,
        posY:              pos.y,
        vx:                vel.x,
        vy:                vel.y,
        torsoRot:          torso.rotation(),
        headRot:           torso.rotation() * 0.8,
        bombTimer:         p.getBombTimer(),
        tagGraceTimer:     p.hasTagGraceShield() ? 1.0 : 0.0,
      });
    }

    return {
      tick:          this._tick,
      hostTimestamp: performance.now(),
      puppets:       puppetData,
    };
  }
}
