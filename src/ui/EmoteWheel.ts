// src/ui/EmoteWheel.ts
// Holographic neon emote wheel triggered by keys 1-6 with network broadcasting.
// Emotes: 1: 😂 | 2: 🔥 | 3: 👑 | 4: ⚡ | 5: 👀 | 6: GG!

import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { PPM } from '../types';
import type { Puppet } from '../entities/Puppet';
import { NetworkManager } from '../network/NetworkManager';

export interface EmoteDef {
  key:   string;
  digit: number;
  icon:  string;
  label: string;
}

export const EMOTE_LIST: EmoteDef[] = [
  { key: 'Digit1', digit: 1, icon: '😂', label: 'Laugh' },
  { key: 'Digit2', digit: 2, icon: '🔥', label: 'Fire' },
  { key: 'Digit3', digit: 3, icon: '👑', label: 'Crown' },
  { key: 'Digit4', digit: 4, icon: '⚡', label: 'Shock' },
  { key: 'Digit5', digit: 5, icon: '👀', label: 'Sus' },
  { key: 'Digit6', digit: 6, icon: 'GG!', label: 'Good Game' },
];

interface ActiveEmote {
  container:   Container;
  puppetIndex: number;
  life:        number;
  totalLife:   number;
}

export class EmoteWheel {
  private readonly _vfxLayer: Container;
  private readonly _net: NetworkManager;
  private _puppets: Puppet[] = [];
  private readonly _activeEmotes: ActiveEmote[] = [];

  constructor(vfxLayer: Container, net: NetworkManager = NetworkManager.getInstance()) {
    this._vfxLayer = vfxLayer;
    this._net = net;

    window.addEventListener('keydown', this._onKeyDown);

    // Listen to network emotes from remote players
    this._net.onEvent((eventType, payload) => {
      if (eventType === 'EMOTE') {
        const pIdx = Number(payload.playerIndex);
        const icon = String(payload.icon ?? '⚡');
        this.spawnEmote(pIdx, icon);
      }
    });
  }

  public setPuppets(puppets: Puppet[]): void {
    this._puppets = puppets;
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    // Avoid triggering when focused on input fields
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    const emote = EMOTE_LIST.find(em => em.key === e.code);
    if (!emote) return;

    const myIdx = this._net.localPlayerIndex;
    this.spawnEmote(myIdx, emote.icon);

    // Broadcast to party/room peers
    this._net.sendEvent('EMOTE', {
      playerIndex: myIdx,
      icon: emote.icon,
    });
  };

  /**
   * Spawns a floating holographic billboard above the target puppet for 2.5 seconds.
   */
  public spawnEmote(playerIndex: number, icon: string): void {
    const puppet = this._puppets[playerIndex];
    if (!puppet) return;

    const container = new Container();

    // Holographic bubble background
    const bg = new Graphics();
    bg.roundRect(-22, -18, 44, 36, 8);
    bg.fill({ color: 0x050515, alpha: 0.85 });
    bg.stroke({ color: 0x00ffff, width: 1.5, alpha: 0.9 });
    container.addChild(bg);

    // Emote icon text
    const textStyle = new TextStyle({
      fontSize: 22,
      fontFamily: 'Inter, sans-serif',
      align: 'center',
    });
    const text = new Text({ text: icon, style: textStyle });
    text.anchor.set(0.5, 0.5);
    container.addChild(text);

    const pos = puppet.getWorldPosition();
    container.x = pos.x * PPM;
    container.y = pos.y * PPM - 55;

    this._vfxLayer.addChild(container);

    this._activeEmotes.push({
      container,
      puppetIndex: playerIndex,
      life: 2.5,
      totalLife: 2.5,
    });
  }

  public update(dt: number): void {
    for (let i = this._activeEmotes.length - 1; i >= 0; i--) {
      const em = this._activeEmotes[i];
      em.life -= dt;

      const puppet = this._puppets[em.puppetIndex];
      if (puppet) {
        const pos = puppet.getWorldPosition();
        // Follow puppet position while floating slightly upward
        const progress = 1.0 - (em.life / em.totalLife);
        em.container.x = pos.x * PPM;
        em.container.y = pos.y * PPM - 55 - (progress * 18);
      }

      // Smooth fade-out in final 0.5s
      if (em.life < 0.5) {
        em.container.alpha = Math.max(0, em.life / 0.5);
      } else {
        em.container.alpha = 1.0;
      }

      if (em.life <= 0) {
        this._vfxLayer.removeChild(em.container);
        em.container.destroy();
        this._activeEmotes.splice(i, 1);
      }
    }
  }

  public destroy(): void {
    window.removeEventListener('keydown', this._onKeyDown);
    for (let i = 0; i < this._activeEmotes.length; i++) {
      this._vfxLayer.removeChild(this._activeEmotes[i].container);
      this._activeEmotes[i].container.destroy();
    }
    this._activeEmotes.length = 0;
  }
}
