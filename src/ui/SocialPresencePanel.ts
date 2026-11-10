// src/ui/SocialPresencePanel.ts
// Cyberpunk sliding drawer listing online pilots, friend management, and invite triggers.

import type { PresenceService } from '../network/PresenceService';
import type { UserProfile } from '../network/RoomLinkManager';

export class SocialPresencePanel {
  private readonly _presence: PresenceService;
  private readonly _profile: UserProfile;
  private _container: HTMLDivElement | null = null;
  private _isOpen = false;
  private _filterOnlineOnly = false;
  private _onInviteCallback: ((targetPlayerId: string) => void) | null = null;

  constructor(presence: PresenceService, profile: UserProfile) {
    this._presence = presence;
    this._profile = profile;
    this._injectStyles();
    this._buildDOM();

    // Listen to real-time presence updates
    this._presence.onPresenceChange(() => {
      if (this._isOpen) {
        this._renderPlayerList();
      }
      this._updateBadgeCount();
    });
  }

  public setOnInvite(cb: (targetPlayerId: string) => void): void {
    this._onInviteCallback = cb;
  }

  public toggle(): void {
    this._isOpen = !this._isOpen;
    if (this._container) {
      if (this._isOpen) {
        this._container.classList.add('open');
        this._renderPlayerList();
      } else {
        this._container.classList.remove('open');
      }
    }
  }

  private _updateBadgeCount(): void {
    const badge = document.querySelector('#neo-presence-count');
    if (badge) {
      const count = this._presence.getOnlinePlayers().length;
      badge.textContent = `${count}`;
    }
  }

  private _buildDOM(): void {
    const panel = document.createElement('div');
    panel.id = 'neo-presence-drawer';
    panel.innerHTML = `
      <button id="neo-presence-tab-btn" class="neo-drawer-tab">
        👥 PILOTS (<span id="neo-presence-count">1</span>)
      </button>

      <div class="neo-drawer-body">
        <div class="neo-drawer-header">
          <div class="neo-pilot-profile">
            <div class="neo-pilot-avatar" style="background:${this._profile.avatarSkin}; box-shadow:0 0 8px ${this._profile.avatarSkin}"></div>
            <div>
              <div class="neo-pilot-name">${this._profile.nickname}</div>
              <div class="neo-pilot-id">CODE: ${this._profile.playerId.substring(0, 10)}</div>
            </div>
          </div>
          <button id="neo-drawer-close" class="neo-btn-icon">✕</button>
        </div>

        <div class="neo-friend-add-bar">
          <input type="text" id="neo-friend-input" placeholder="Enter Friend Code…" maxlength="18" />
          <button id="neo-friend-add-btn">ADD</button>
        </div>

        <div class="neo-filter-row">
          <label>
            <input type="checkbox" id="neo-filter-online" /> Online Now Only
          </label>
        </div>

        <div class="neo-players-scroll" id="neo-players-list"></div>
      </div>
    `;

    document.body.appendChild(panel);
    this._container = panel;

    const tabBtn = panel.querySelector('#neo-presence-tab-btn') as HTMLButtonElement;
    tabBtn.onclick = () => this.toggle();

    const closeBtn = panel.querySelector('#neo-drawer-close') as HTMLButtonElement;
    closeBtn.onclick = () => this.toggle();

    const onlineFilter = panel.querySelector('#neo-filter-online') as HTMLInputElement;
    onlineFilter.onchange = () => {
      this._filterOnlineOnly = onlineFilter.checked;
      this._renderPlayerList();
    };

    const addBtn = panel.querySelector('#neo-friend-add-btn') as HTMLButtonElement;
    const addInput = panel.querySelector('#neo-friend-input') as HTMLInputElement;
    addBtn.onclick = () => {
      const code = addInput.value.trim();
      if (code) {
        this._presence.addFriend(code);
        addInput.value = '';
        this._renderPlayerList();
      }
    };
  }

  private _renderPlayerList(): void {
    const listEl = document.querySelector('#neo-players-list');
    if (!listEl) return;

    let players = this._presence.getOnlinePlayers();
    if (this._filterOnlineOnly) {
      players = players.filter(p => p.status !== 'ONLINE_IDLE');
    }

    if (players.length === 0) {
      listEl.innerHTML = `<div class="neo-no-players">NO OTHER PILOTS ONLINE</div>`;
      return;
    }

    listEl.innerHTML = players.map(p => {
      const isMe = p.playerId === this._profile.playerId;
      const isFriend = this._presence.isFriend(p.playerId);
      const customNick = this._presence.getFriendNickname(p.playerId);

      // Status indicator color
      let statusColor = '#00ff88'; // LOBBY
      let statusText = 'LOBBY';
      if (p.status === 'IN_MATCH') {
        statusColor = '#ffaa00'; // Amber
        statusText = 'IN MATCH';
      } else if (p.status === 'ONLINE_IDLE') {
        statusColor = '#00ffff'; // Cyan
        statusText = 'ONLINE';
      }

      return `
        <div class="neo-player-card">
          <div class="neo-player-avatar" style="background:${p.avatarSkin}; box-shadow:0 0 6px ${p.avatarSkin}"></div>
          <div class="neo-player-info">
            <div class="neo-player-title">
              <span class="neo-pname">${customNick || p.name}</span>
              ${customNick ? `<span class="neo-realname" style="font-size:10px; color:#888; font-family:'Rajdhani',sans-serif;">(${p.name})</span>` : ''}
              ${isFriend ? '<span class="neo-friend-tag">★ FRIEND</span>' : ''}
              ${isMe ? '<span class="neo-me-tag">(YOU)</span>' : ''}
              ${!isMe ? `<button class="neo-btn-edit-nick" data-id="${p.playerId}" data-name="${p.name}" title="Set Nickname">✏</button>` : ''}
            </div>
            <div class="neo-player-status-row">
              <span class="neo-status-dot" style="background:${statusColor}; box-shadow:0 0 6px ${statusColor}"></span>
              <span class="neo-status-label">${statusText}</span>
              <span class="neo-ping-label">${p.pingMs}ms</span>
            </div>
          </div>
          ${!isMe ? `
            <button class="neo-btn-invite" data-id="${p.playerId}">INVITE</button>
          ` : ''}
        </div>
      `;
    }).join('');

    // Attach edit nickname button listeners
    listEl.querySelectorAll('.neo-btn-edit-nick').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-id');
        const realName = btn.getAttribute('data-name') || 'Friend';
        if (targetId) {
          const current = this._presence.getFriendNickname(targetId) || '';
          const newNick = window.prompt(`Set private nickname for ${realName} (saved only on this device):`, current);
          if (newNick !== null) {
            this._presence.setFriendNickname(targetId, newNick);
            this._renderPlayerList();
          }
        }
      });
    });

    // Attach invite button click events
    listEl.querySelectorAll('.neo-btn-invite').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-id');
        if (targetId && this._onInviteCallback) {
          btn.textContent = 'SENT ✓';
          (btn as HTMLButtonElement).disabled = true;
          this._onInviteCallback(targetId);
          setTimeout(() => {
            btn.textContent = 'INVITE';
            (btn as HTMLButtonElement).disabled = false;
          }, 4000);
        }
      });
    });
  }

  private _injectStyles(): void {
    if (document.getElementById('neo-presence-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-presence-style';
    style.textContent = `
      #neo-presence-drawer {
        position: fixed; top: 70px; right: 0; z-index: 9500;
        display: flex; align-items: flex-start;
        font-family: 'Orbitron', monospace; color: #fff;
        transform: translateX(320px); transition: transform 0.3s cubic-bezier(0.1, 0.9, 0.2, 1);
      }
      #neo-presence-drawer.open { transform: translateX(0); }
      .neo-drawer-tab {
        background: rgba(13, 13, 31, 0.92); border: 1px solid #00ffff; border-right: none;
        border-radius: 6px 0 0 6px; padding: 10px 14px; color: #00ffff;
        font-family: 'Orbitron', monospace; font-size: 11px; font-weight: 900;
        cursor: pointer; box-shadow: -4px 0 15px rgba(0,255,255,0.25);
      }
      .neo-drawer-body {
        width: 320px; height: 500px; max-height: 80vh;
        background: rgba(13, 13, 31, 0.96); border: 1px solid #00ffff; border-right: none;
        backdrop-filter: blur(12px); padding: 16px; box-sizing: border-box;
        display: flex; flex-direction: column; gap: 12px;
      }
      .neo-drawer-header {
        display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,255,255,0.2); padding-bottom: 10px;
      }
      .neo-pilot-profile { display: flex; align-items: center; gap: 10px; }
      .neo-pilot-avatar { width: 28px; height: 28px; border-radius: 50%; border: 1px solid #fff; }
      .neo-pilot-name { font-size: 12px; font-weight: 900; color: #00ffff; }
      .neo-pilot-id { font-size: 9px; color: #888; font-family: 'Rajdhani', sans-serif; }
      .neo-btn-icon { background: none; border: none; color: #888; font-size: 16px; cursor: pointer; }
      .neo-btn-icon:hover { color: #ff0066; }
      .neo-btn-edit-nick {
        background: none; border: none; color: #88ffff; font-size: 11px; cursor: pointer; margin-left: 4px; padding: 0 2px;
      }
      .neo-btn-edit-nick:hover { color: #ffff00; }
      .neo-friend-add-bar { display: flex; gap: 6px; }
      .neo-friend-add-bar input {
        flex: 1; background: rgba(0,0,0,0.5); border: 1px solid #333; border-radius: 4px;
        padding: 6px 8px; color: #fff; font-size: 10px; font-family: 'Orbitron', monospace;
      }
      .neo-friend-add-bar button {
        background: #00ffff; color: #05050f; border: none; border-radius: 4px;
        padding: 6px 12px; font-size: 10px; font-weight: 900; cursor: pointer;
      }
      .neo-filter-row { font-size: 10px; color: #aaa; font-family: 'Rajdhani', sans-serif; }
      .neo-players-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
      .neo-player-card {
        display: flex; align-items: center; gap: 10px; padding: 8px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(0,255,255,0.15); border-radius: 6px;
      }
      .neo-player-avatar { width: 24px; height: 24px; border-radius: 50%; border: 1px solid #fff; }
      .neo-player-info { flex: 1; }
      .neo-player-title { font-size: 11px; font-weight: bold; }
      .neo-friend-tag { font-size: 8px; color: #ffee00; margin-left: 4px; }
      .neo-me-tag { font-size: 8px; color: #888; margin-left: 4px; }
      .neo-player-status-row { display: flex; align-items: center; gap: 6px; font-size: 9px; margin-top: 3px; }
      .neo-status-dot { width: 6px; height: 6px; border-radius: 50%; }
      .neo-status-label { color: #ccc; }
      .neo-ping-label { color: #666; }
      .neo-btn-invite {
        background: rgba(0,255,255,0.15); color: #00ffff; border: 1px solid #00ffff;
        border-radius: 4px; padding: 4px 8px; font-size: 9px; font-weight: bold; cursor: pointer;
      }
      .neo-btn-invite:hover { background: #00ffff; color: #05050f; }
      .neo-no-players { text-align: center; color: #555; font-size: 11px; margin-top: 40px; }
    `;
    document.head.appendChild(style);
  }
}
