// src/network/RoomLinkManager.ts
// Shareable room URLs, URL state synchronization, and clipboard helpers.

export interface UserProfile {
  nickname:   string;
  avatarSkin: string; // e.g. '#00ffff'
  playerId:   string;
}

export class RoomLinkManager {
  private static readonly PROFILE_STORAGE_KEY = 'neo-puppet-user-profile';

  /**
   * Generates a room code like TAG-8492.
   */
  public static generateRoomCode(): string {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `TAG-${randomDigits}`;
  }

  /**
   * Retrieves ?room= parameter from the current URL if present.
   */
  public static getRoomFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    return room ? room.trim().toUpperCase() : null;
  }

  /**
   * Updates browser address bar to ?room=TAG-XXXX without reloading.
   */
  public static setRoomInUrl(roomCode: string): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomCode);
    window.history.pushState({ room: roomCode }, '', url.toString());
  }

  /**
   * Removes ?room= from browser URL.
   */
  public static clearRoomFromUrl(): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.pushState({}, '', url.pathname);
  }

  /**
   * Copies the full shareable invite URL to clipboard with fallback.
   */
  public static async copyInviteLink(roomCode: string): Promise<boolean> {
    const fullUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    return this._copyToClipboard(fullUrl);
  }

  /**
   * Copies the raw room code (e.g. TAG-8492) to clipboard with fallback.
   */
  public static async copyRoomCode(roomCode: string): Promise<boolean> {
    return this._copyToClipboard(roomCode);
  }

  private static async _copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('[RoomLinkManager] Clipboard API error, trying fallback:', err);
      }
    }

    // Fallback using temporary textarea
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      return successful;
    } catch {
      return false;
    }
  }

  /**
   * Checks localStorage for user profile. If missing (first time joining via link),
   * renders an in-game modal to prompt for Nickname & Avatar skin.
   */
  public static async ensureUserProfile(existingPlayerId: string): Promise<UserProfile> {
    const raw = localStorage.getItem(this.PROFILE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as UserProfile;
        if (parsed.nickname && parsed.avatarSkin) {
          return parsed;
        }
      } catch {
        /* noop */
      }
    }

    // Prompt user for nickname and skin choice
    return new Promise<UserProfile>((resolve) => {
      const modal = document.createElement('div');
      modal.id = 'neo-profile-modal';
      modal.innerHTML = `
        <div class="neo-modal-backdrop"></div>
        <div class="neo-modal-content">
          <h2 class="neo-modal-title">PILOT IDENTIFICATION</h2>
          <p class="neo-modal-sub">Choose your callsign and neon aesthetic before deploying:</p>
          
          <div class="neo-form-group">
            <label for="pilot-callsign">CALLSIGN / NICKNAME</label>
            <input type="text" id="pilot-callsign" maxlength="14" placeholder="CYBER_RUNNER" value="PILOT_${Math.floor(100 + Math.random() * 900)}" />
          </div>

          <div class="neo-form-group">
            <label>VISOR SKIN PALETTE</label>
            <div class="neo-skin-palette">
              <button type="button" class="neo-skin-choice selected" data-color="#00ffff" style="background:#00ffff; box-shadow:0 0 10px #00ffff"></button>
              <button type="button" class="neo-skin-choice" data-color="#ff0066" style="background:#ff0066; box-shadow:0 0 10px #ff0066"></button>
              <button type="button" class="neo-skin-choice" data-color="#00ff88" style="background:#00ff88; box-shadow:0 0 10px #00ff88"></button>
              <button type="button" class="neo-skin-choice" data-color="#ffee00" style="background:#ffee00; box-shadow:0 0 10px #ffee00"></button>
            </div>
          </div>

          <button id="pilot-submit-btn" class="neo-btn-primary">CONFIRM & DEPLOY</button>
        </div>
      `;

      // Inline styles for glassmorphism dialog
      const style = document.createElement('style');
      style.id = 'neo-profile-modal-style';
      style.textContent = `
        #neo-profile-modal {
          position: fixed; inset: 0; z-index: 10000;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Orbitron', monospace; color: #fff;
        }
        .neo-modal-backdrop {
          position: absolute; inset: 0; background: rgba(5,5,15,0.85); backdrop-filter: blur(8px);
        }
        .neo-modal-content {
          position: relative; width: 380px; max-width: 90vw;
          background: rgba(13,13,31,0.92); border: 1px solid #00ffff;
          border-radius: 8px; padding: 24px; box-shadow: 0 0 30px rgba(0,255,255,0.3);
        }
        .neo-modal-title { margin: 0 0 6px; font-size: 20px; color: #00ffff; letter-spacing: 2px; }
        .neo-modal-sub { margin: 0 0 20px; font-size: 11px; color: #aaa; font-family: 'Rajdhani', sans-serif; }
        .neo-form-group { margin-bottom: 18px; }
        .neo-form-group label { display: block; font-size: 10px; margin-bottom: 6px; color: #88ffff; }
        .neo-form-group input {
          width: 100%; box-sizing: border-box; background: rgba(0,0,0,0.6);
          border: 1px solid #00ffff; border-radius: 4px; padding: 10px;
          color: #fff; font-family: 'Orbitron', monospace; font-size: 14px;
        }
        .neo-skin-palette { display: flex; gap: 12px; }
        .neo-skin-choice {
          width: 36px; height: 36px; border-radius: 50%; border: 2px solid #fff;
          cursor: pointer; transition: transform 0.15s;
        }
        .neo-skin-choice.selected { transform: scale(1.2); border-color: #ffff00; }
        .neo-btn-primary {
          width: 100%; padding: 12px; background: #00ffff; color: #05050f;
          border: none; border-radius: 4px; font-family: 'Orbitron', monospace;
          font-weight: 900; font-size: 13px; cursor: pointer; letter-spacing: 1.5px;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .neo-btn-primary:hover { background: #88ffff; box-shadow: 0 0 15px #00ffff; }
      `;
      document.head.appendChild(style);
      document.body.appendChild(modal);

      let selectedColor = '#00ffff';
      const colorBtns = modal.querySelectorAll('.neo-skin-choice');
      colorBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          colorBtns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedColor = btn.getAttribute('data-color') ?? '#00ffff';
        });
      });

      const submitBtn = modal.querySelector('#pilot-submit-btn') as HTMLButtonElement;
      const inputEl = modal.querySelector('#pilot-callsign') as HTMLInputElement;

      submitBtn.addEventListener('click', () => {
        const nickname = (inputEl.value.trim() || 'CYBER_RUNNER').toUpperCase();
        const profile: UserProfile = {
          nickname,
          avatarSkin: selectedColor,
          playerId: existingPlayerId,
        };
        localStorage.setItem(RoomLinkManager.PROFILE_STORAGE_KEY, JSON.stringify(profile));

        modal.remove();
        style.remove();
        resolve(profile);
      });
    });
  }
}
