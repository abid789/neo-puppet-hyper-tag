// src/network/SnapshotCodec.ts
// Ultra-compact binary codec for 60Hz physics snapshots and client prediction inputs.
// Serializes puppets into typed ArrayBuffers at ~36 bytes per puppet (target <100 bytes).

import type { PuppetState, InputState } from '../types';

export const PACKET_SNAPSHOT = 0x01;
export const PACKET_INPUT    = 0x02;
export const PACKET_EVENT    = 0x03;

export interface PuppetSnapshotData {
  playerIndex:        number;
  state:              PuppetState;
  isIt:               boolean;
  hasCrown:           boolean;
  hasBomb:            boolean;
  isStunned:          boolean;
  hasTagGraceShield:  boolean;
  hasPhaseShield:     boolean;
  hasHyperSurge:      boolean;
  isDashing:          boolean;
  isGrounded:         boolean;
  facingRight:        boolean;
  lowGravity:         boolean;
  posX:               number;
  posY:               number;
  vx:                 number;
  vy:                 number;
  torsoRot:           number;
  headRot:            number;
  bombTimer:          number | null;
  tagGraceTimer:      number;
}

export interface WorldSnapshot {
  tick:          number;
  hostTimestamp: number;
  puppets:       PuppetSnapshotData[];
}

export interface ClientInputPacket {
  playerIndex: number;
  sequence:    number;
  clientTime:  number;
  input:       InputState;
}

export interface NetworkEventPacket {
  eventType: string;
  payload:   Record<string, unknown>;
}

const STATE_TO_ENUM: Record<PuppetState, number> = {
  idle:         0,
  walking:      1,
  jumping:      2,
  falling:      3,
  dashing:      4,
  backflipping: 5,
  tagged:       6,
  celebrating:  7,
  punching:     8,
  blocking:     9,
  staggered:    10,
};

const ENUM_TO_STATE: PuppetState[] = [
  'idle',
  'walking',
  'jumping',
  'falling',
  'dashing',
  'backflipping',
  'tagged',
  'celebrating',
  'punching',
  'blocking',
  'staggered',
];

const BYTES_PER_PUPPET = 36;
const SNAPSHOT_HEADER_BYTES = 14;

export class SnapshotCodec {
  private static readonly _textEncoder = new TextEncoder();
  private static readonly _textDecoder = new TextDecoder();

  /**
   * Encodes a complete authoritative world snapshot into a compact Uint8Array binary buffer.
   */
  public static encodeSnapshot(snapshot: WorldSnapshot): Uint8Array {
    const puppetCount = snapshot.puppets.length;
    const totalBytes = SNAPSHOT_HEADER_BYTES + puppetCount * BYTES_PER_PUPPET;
    const buffer = new ArrayBuffer(totalBytes);
    const view = new DataView(buffer);

    let offset = 0;

    // Header (14 bytes)
    view.setUint8(offset, PACKET_SNAPSHOT); offset += 1;
    view.setUint32(offset, snapshot.tick, true); offset += 4;
    view.setFloat64(offset, snapshot.hostTimestamp, true); offset += 8;
    view.setUint8(offset, puppetCount); offset += 1;

    // Puppets (36 bytes each)
    for (let i = 0; i < puppetCount; i++) {
      const p = snapshot.puppets[i];

      view.setUint8(offset, p.playerIndex); offset += 1;
      view.setUint8(offset, STATE_TO_ENUM[p.state] ?? 0); offset += 1;

      // Pack 11 boolean flags into a 16-bit bitmask
      let flags = 0;
      if (p.isIt)              flags |= (1 << 0);
      if (p.hasCrown)           flags |= (1 << 1);
      if (p.hasBomb)            flags |= (1 << 2);
      if (p.isStunned)          flags |= (1 << 3);
      if (p.hasTagGraceShield)  flags |= (1 << 4);
      if (p.hasPhaseShield)     flags |= (1 << 5);
      if (p.hasHyperSurge)      flags |= (1 << 6);
      if (p.isDashing)          flags |= (1 << 7);
      if (p.isGrounded)         flags |= (1 << 8);
      if (p.facingRight)        flags |= (1 << 9);
      if (p.lowGravity)         flags |= (1 << 10);

      view.setUint16(offset, flags, true); offset += 2;

      view.setFloat32(offset, p.posX, true); offset += 4;
      view.setFloat32(offset, p.posY, true); offset += 4;
      view.setFloat32(offset, p.vx, true); offset += 4;
      view.setFloat32(offset, p.vy, true); offset += 4;
      view.setFloat32(offset, p.torsoRot, true); offset += 4;
      view.setFloat32(offset, p.headRot, true); offset += 4;
      view.setFloat32(offset, p.bombTimer !== null ? p.bombTimer : -1.0, true); offset += 4;
      view.setFloat32(offset, p.tagGraceTimer, true); offset += 4;
    }

    return new Uint8Array(buffer);
  }

  /**
   * Decodes a binary buffer into a WorldSnapshot object.
   */
  public static decodeSnapshot(bytes: Uint8Array): WorldSnapshot {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;

    const packetType = view.getUint8(offset); offset += 1;
    if (packetType !== PACKET_SNAPSHOT) {
      throw new Error(`[SnapshotCodec] Invalid packet type for snapshot: 0x${packetType.toString(16)}`);
    }

    const tick = view.getUint32(offset, true); offset += 4;
    const hostTimestamp = view.getFloat64(offset, true); offset += 8;
    const puppetCount = view.getUint8(offset); offset += 1;

    const puppets: PuppetSnapshotData[] = [];

    for (let i = 0; i < puppetCount; i++) {
      const playerIndex = view.getUint8(offset); offset += 1;
      const stateIndex = view.getUint8(offset); offset += 1;
      const state = ENUM_TO_STATE[stateIndex] ?? 'idle';

      const flags = view.getUint16(offset, true); offset += 2;
      const isIt              = (flags & (1 << 0)) !== 0;
      const hasCrown           = (flags & (1 << 1)) !== 0;
      const hasBomb            = (flags & (1 << 2)) !== 0;
      const isStunned          = (flags & (1 << 3)) !== 0;
      const hasTagGraceShield  = (flags & (1 << 4)) !== 0;
      const hasPhaseShield     = (flags & (1 << 5)) !== 0;
      const hasHyperSurge      = (flags & (1 << 6)) !== 0;
      const isDashing          = (flags & (1 << 7)) !== 0;
      const isGrounded         = (flags & (1 << 8)) !== 0;
      const facingRight        = (flags & (1 << 9)) !== 0;
      const lowGravity         = (flags & (1 << 10)) !== 0;

      const posX = view.getFloat32(offset, true); offset += 4;
      const posY = view.getFloat32(offset, true); offset += 4;
      const vx = view.getFloat32(offset, true); offset += 4;
      const vy = view.getFloat32(offset, true); offset += 4;
      const torsoRot = view.getFloat32(offset, true); offset += 4;
      const headRot = view.getFloat32(offset, true); offset += 4;
      const rawBomb = view.getFloat32(offset, true); offset += 4;
      const tagGraceTimer = view.getFloat32(offset, true); offset += 4;

      puppets.push({
        playerIndex,
        state,
        isIt,
        hasCrown,
        hasBomb,
        isStunned,
        hasTagGraceShield,
        hasPhaseShield,
        hasHyperSurge,
        isDashing,
        isGrounded,
        facingRight,
        lowGravity,
        posX,
        posY,
        vx,
        vy,
        torsoRot,
        headRot,
        bombTimer: rawBomb >= 0 ? rawBomb : null,
        tagGraceTimer,
      });
    }

    return { tick, hostTimestamp, puppets };
  }

  /**
   * Encodes a client input packet into a 15-byte Uint8Array.
   */
  public static encodeInput(inputPacket: ClientInputPacket): Uint8Array {
    const buffer = new ArrayBuffer(15);
    const view = new DataView(buffer);

    let offset = 0;
    view.setUint8(offset, PACKET_INPUT); offset += 1;
    view.setUint8(offset, inputPacket.playerIndex); offset += 1;
    view.setUint32(offset, inputPacket.sequence, true); offset += 4;
    view.setFloat64(offset, inputPacket.clientTime, true); offset += 8;

    let bits = 0;
    if (inputPacket.input.moveLeft)  bits |= (1 << 0);
    if (inputPacket.input.moveRight) bits |= (1 << 1);
    if (inputPacket.input.jump)      bits |= (1 << 2);
    if (inputPacket.input.dash)      bits |= (1 << 3);
    if (inputPacket.input.attack || inputPacket.input.punch) bits |= (1 << 4);
    if (inputPacket.input.punch)     bits |= (1 << 5);
    if (inputPacket.input.block)     bits |= (1 << 6);
    if (inputPacket.input.fastFall)  bits |= (1 << 7);

    view.setUint8(offset, bits);

    return new Uint8Array(buffer);
  }

  /**
   * Decodes a client input packet from a Uint8Array.
   */
  public static decodeInput(bytes: Uint8Array): ClientInputPacket {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let offset = 0;

    const packetType = view.getUint8(offset); offset += 1;
    if (packetType !== PACKET_INPUT) {
      throw new Error(`[SnapshotCodec] Invalid packet type for input: 0x${packetType.toString(16)}`);
    }

    const playerIndex = view.getUint8(offset); offset += 1;
    const sequence = view.getUint32(offset, true); offset += 4;
    const clientTime = view.getFloat64(offset, true); offset += 8;
    const bits = view.getUint8(offset);

    const punch = (bits & (1 << 5)) !== 0 || (bits & (1 << 4)) !== 0;
    const input: InputState = {
      moveLeft:  (bits & (1 << 0)) !== 0,
      moveRight: (bits & (1 << 1)) !== 0,
      jump:      (bits & (1 << 2)) !== 0,
      dash:      (bits & (1 << 3)) !== 0,
      attack:    punch,
      punch,
      block:     (bits & (1 << 6)) !== 0,
      fastFall:  (bits & (1 << 7)) !== 0,
    };

    return { playerIndex, sequence, clientTime, input };
  }

  /**
   * Encodes a network event (e.g. EMOTE, MATCH_STATE) with UTF-8 JSON payload.
   */
  public static encodeEvent(eventType: string, payload: Record<string, unknown>): Uint8Array {
    const jsonStr = JSON.stringify({ eventType, payload });
    const encodedStr = SnapshotCodec._textEncoder.encode(jsonStr);

    const buffer = new ArrayBuffer(1 + 2 + encodedStr.length);
    const view = new DataView(buffer);

    view.setUint8(0, PACKET_EVENT);
    view.setUint16(1, encodedStr.length, true);

    const result = new Uint8Array(buffer);
    result.set(encodedStr, 3);
    return result;
  }

  /**
   * Decodes a network event from binary bytes.
   */
  public static decodeEvent(bytes: Uint8Array): NetworkEventPacket {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const packetType = view.getUint8(0);
    if (packetType !== PACKET_EVENT) {
      throw new Error(`[SnapshotCodec] Invalid packet type for event: 0x${packetType.toString(16)}`);
    }

    const len = view.getUint16(1, true);
    const slice = bytes.subarray(3, 3 + len);
    const str = SnapshotCodec._textDecoder.decode(slice);
    return JSON.parse(str) as NetworkEventPacket;
  }
}
