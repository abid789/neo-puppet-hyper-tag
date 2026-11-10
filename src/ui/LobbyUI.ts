// src/ui/LobbyUI.ts
// Top bar lobby controls: Room creation, joining, shareable link copying, and connection status.

import { NetworkManager } from '../network/NetworkManager';
import { RoomLinkManager } from '../network/RoomLinkManager';

export class LobbyUI {
  private readonly _net: NetworkManager;
  private _container: HTMLDivElement | null = null;
  private _onRoomStateChanged: ((roomCode: string, isHost: boolean) => void) | null = null;

  constructor(net: NetworkManager = NetworkManager.getInstance()) {
    this._net = net;
    this._injectStyles();
    this._buildDOM();
  }

  public setOnRoomStateChanged(cb: (roomCode: string, isHost: boolean) => void): void {
    this._onRoomStateChanged = cb;
  }

  public update(): void {
    const code = this._net.roomCode;
    const isHost = this._net.isHost;
    const isConnected = this._net.isConnected();

    const roomInfoEl = document.querySelector('#neo-lobby-room-info');
    const actionsInRoom = document.querySelector('#neo-lobby-actions-in-room') as HTMLElement;
    const actionsNoRoom = document.querySelector('#neo-lobby-actions-no-room') as HTMLElement;

    if (code) {
      if (roomInfoEl) {
        roomInfoEl.innerHTML = `
          <span class="neo-room-code">${code}</span>
          <span class="neo-role-badge ${isHost ? 'host' : 'client'}">${isHost ? 'HOST' : 'CLIENT'}</span>
          <span class="neo-transport-badge">${this._net.transport === 'webrtc' ? 'WEBRTC' : 'LOCAL-TAB'}</span>
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${isConnected ? '#00ff88' : '#ffaa00'};margin-left:4px;"></span>
        `;
      }
      if (actionsInRoom) actionsInRoom.style.display = 'flex';
      if (actionsNoRoom) actionsNoRoom.style.display = 'none';
    } else {
      if (roomInfoEl) {
        roomInfoEl.innerHTML = `<span class="neo-no-room">SOLO / LOCAL MATCH</span>`;
      }
      if (actionsInRoom) actionsInRoom.style.display = 'none';
      if (actionsNoRoom) actionsNoRoom.style.display = 'flex';
    }
  }

  public showToast(msg: string): void {
    const toast = document.createElement('div');
    toast.className = 'neo-toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  private _buildDOM(): void {
    const bar = document.createElement('div');
    bar.id = 'neo-lobby-bar';
    bar.innerHTML = `
      <div id="neo-lobby-room-info">
        <span class="neo-no-room">SOLO / LOCAL MATCH</span>
      </div>

      <div id="neo-lobby-actions-in-room" style="display:none;">
        <button id="neo-btn-copy-link" class="neo-lobby-btn">📋 COPY LINK</button>
        <button id="neo-btn-copy-code" class="neo-lobby-btn">📋 COPY CODE</button>
        <button id="neo-btn-leave-room" class="neo-lobby-btn danger">🚪 LEAVE</button>
      </div>

      <div id="neo-lobby-actions-no-room" style="display:flex;">
        <button id="neo-btn-create-room" class="neo-lobby-btn primary">⚡ CREATE ROOM</button>
        <div class="neo-join-group">
          <input type="text" id="neo-input-room-code" placeholder="TAG-XXXX" maxlength="10" />
          <button id="neo-btn-join-room" class="neo-lobby-btn">JOIN</button>
        </div>
      </div>
    `;

    document.body.appendChild(bar);
    this._container = bar;

    // Create Room
    const createBtn = bar.querySelector('#neo-btn-create-room') as HTMLButtonElement;
    createBtn.onclick = async () => {
      const code = await this._net.createRoom();
      RoomLinkManager.setRoomInUrl(code);
      this.update();
      this.showToast(`Room created: ${code}`);
      if (this._onRoomStateChanged) this._onRoomStateChanged(code, true);
    };

    // Join Room
    const joinBtn = bar.querySelector('#neo-btn-join-room') as HTMLButtonElement;
    const inputCode = bar.querySelector('#neo-input-room-code') as HTMLInputElement;
    joinBtn.onclick = async () => {
      const target = inputCode.value.trim().toUpperCase();
      if (target) {
        const ok = await this._net.joinRoom(target);
        if (ok) {
          RoomLinkManager.setRoomInUrl(target);
          this.update();
          this.showToast(`Joined room: ${target}`);
          if (this._onRoomStateChanged) this._onRoomStateChanged(target, false);
        } else {
          this.showToast(`Failed to join ${target}`);
        }
      }
    };

    // Copy Link
    const copyLinkBtn = bar.querySelector('#neo-btn-copy-link') as HTMLButtonElement;
    copyLinkBtn.onclick = async () => {
      if (this._net.roomCode) {
        const ok = await RoomLinkManager.copyInviteLink(this._net.roomCode);
        this.showToast(ok ? 'Invite Link Copied to Clipboard!' : 'Failed to copy link');
      }
    };

    // Copy Code
    const copyCodeBtn = bar.querySelector('#neo-btn-copy-code') as HTMLButtonElement;
    copyCodeBtn.onclick = async () => {
      if (this._net.roomCode) {
        const ok = await RoomLinkManager.copyRoomCode(this._net.roomCode);
        this.showToast(ok ? 'Room Code Copied!' : 'Failed to copy code');
      }
    };

    // Leave Room
    const leaveBtn = bar.querySelector('#neo-btn-leave-room') as HTMLButtonElement;
    leaveBtn.onclick = () => {
      this._net.leaveRoom();
      RoomLinkManager.clearRoomFromUrl();
      this.update();
      this.showToast('Left multiplayer room');
      if (this._onRoomStateChanged) this._onRoomStateChanged('', true);
    };
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-lobby-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-lobby-style';
    style.textContent = `
      #neo-lobby-bar {
        position: fixed; top: 10px; left: 230px; z-index: 9000;
        display: flex; align-items: center; gap: 12px;
        background: rgba(13, 13, 31, 0.85); border: 1px solid rgba(0, 255, 255, 0.3);
        border-radius: 6px; padding: 6px 14px; backdrop-filter: blur(8px);
        font-family: 'Orbitron', monospace; font-size: 11px; color: #fff;
      }
      .neo-room-code { color: #00ffff; font-weight: 900; letter-spacing: 1px; }
      .neo-role-badge {
        font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: bold; margin-left: 6px;
      }
      .neo-role-badge.host { background: #ff0066; color: #fff; }
      .neo-role-badge.client { background: #00ff88; color: #05050f; }
      .neo-transport-badge {
        font-size: 8px; color: #888; border: 1px solid #444; border-radius: 3px; padding: 2px 4px; margin-left: 4px;
      }
      .neo-no-room { color: #666; font-size: 10px; }
      .neo-lobby-btn {
        background: rgba(0, 255, 255, 0.12); color: #00ffff; border: 1px solid #00ffff;
        border-radius: 4px; padding: 5px 10px; font-family: 'Orbitron', monospace;
        font-size: 10px; font-weight: bold; cursor: pointer; transition: all 0.2s;
      }
      .neo-lobby-btn:hover { background: #00ffff; color: #05050f; }
      .neo-lobby-btn.primary { background: #00ffff; color: #05050f; }
      .neo-lobby-btn.primary:hover { background: #88ffff; box-shadow: 0 0 10px #00ffff; }
      .neo-lobby-btn.danger { border-color: #ff0066; color: #ff0066; background: rgba(255,0,102,0.1); }
      .neo-lobby-btn.danger:hover { background: #ff0066; color: #fff; }
      .neo-join-group { display: flex; gap: 4px; }
      .neo-join-group input {
        width: 85px; background: rgba(0,0,0,0.5); border: 1px solid #444;
        border-radius: 4px; padding: 4px 6px; color: #fff; font-family: 'Orbitron', monospace;
        font-size: 10px; text-transform: uppercase;
      }
      .neo-toast {
        position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(20px);
        background: rgba(13, 13, 31, 0.95); border: 1px solid #00ff88; color: #00ff88;
        padding: 10px 20px; border-radius: 6px; font-family: 'Orbitron', monospace;
        font-size: 11px; z-index: 12000; box-shadow: 0 0 20px rgba(0,255,136,0.3);
        opacity: 0; transition: all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1); pointer-events: none;
      }
      .neo-toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
    `;
    document.head.appendChild(style);
  }

  public destroy(): void {
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }
}
