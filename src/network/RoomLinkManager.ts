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

  /**
   * Copies room passcode to clipboard.
   */
  public static async copyPasscode(passcode: string): Promise<boolean> {
    return this._copyToClipboard(passcode);
  }

  /**
   * Generates a salted SHA-256 hash using the Web Crypto API. Never stores plain text.
   */
  public static async hashPasscode(roomCode: string, passcode: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(`neo_salt_${roomCode}:${passcode}`);
    const hashBuf = await window.crypto.subtle.digest('SHA-256', data);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ── Rate Limiting (5 attempts per minute, 60s block) ─────────────────────────
  private static _attemptTimestamps: number[] = [];
  private static _blockedUntil = 0;

  public static getRateLimitStatus(): { blocked: boolean; remainingSec: number; remainingAttempts: number } {
    const now = Date.now();
    if (now < this._blockedUntil) {
      return {
        blocked: true,
        remainingSec: Math.ceil((this._blockedUntil - now) / 1000),
        remainingAttempts: 0,
      };
    }
    this._attemptTimestamps = this._attemptTimestamps.filter(t => now - t < 60000);
    const remaining = Math.max(0, 5 - this._attemptTimestamps.length);
    return { blocked: false, remainingSec: 0, remainingAttempts: remaining };
  }

  public static recordFailedAttempt(): { blocked: boolean; remainingSec: number } {
    const now = Date.now();
    this._attemptTimestamps.push(now);
    if (this._attemptTimestamps.length >= 5) {
      this._blockedUntil = now + 60000;
      return { blocked: true, remainingSec: 60 };
    }
    return { blocked: false, remainingSec: 0 };
  }

  /**
   * Prompts client for passcode when opening a protected ?room= link.
   */
  public static async promptForPasscode(roomCode: string, expectedHash: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const modal = document.createElement('div');
      modal.id = 'neo-passcode-modal';
      modal.innerHTML = `
        <div class="neo-modal-backdrop"></div>
        <div class="neo-modal-content">
          <h2 class="neo-modal-title" style="color: #ffee00;">🔒 PROTECTED ARENA</h2>
          <p class="neo-modal-sub">Room <strong>${roomCode}</strong> is passcode-protected. Enter 4-8 character passcode:</p>
          
          <div class="neo-form-group">
            <input type="password" id="neo-pass-input" maxlength="8" placeholder="PASSCODE" autofocus autocomplete="off" />
            <div id="neo-pass-error" style="color:#ff0055; font-size:11px; margin-top:6px; min-height:16px;"></div>
          </div>

          <div style="display:flex; gap:10px;">
            <button id="neo-pass-submit-btn" class="neo-btn-primary">AUTHENTICATE & ENTER</button>
            <button id="neo-pass-cancel-btn" class="neo-btn-secondary" style="background:#222; color:#ccc; border:1px solid #444; border-radius:4px; padding:10px 14px; font-family:'Orbitron',monospace; cursor:pointer;">CANCEL</button>
          </div>
        </div>
      `;

      this._injectPasscodeStyles();
      document.body.appendChild(modal);

      const input = modal.querySelector('#neo-pass-input') as HTMLInputElement;
      const errorDiv = modal.querySelector('#neo-pass-error') as HTMLDivElement;
      const submitBtn = modal.querySelector('#neo-pass-submit-btn') as HTMLButtonElement;
      const cancelBtn = modal.querySelector('#neo-pass-cancel-btn') as HTMLButtonElement;

      let timerId: number | null = null;
      const updateRateLimitDisplay = () => {
        const status = this.getRateLimitStatus();
        if (status.blocked) {
          submitBtn.disabled = true;
          input.disabled = true;
          errorDiv.textContent = `TOO MANY ATTEMPTS. BLOCKED FOR ${status.remainingSec}s.`;
        } else {
          submitBtn.disabled = false;
          input.disabled = false;
        }
      };

      updateRateLimitDisplay();
      timerId = window.setInterval(updateRateLimitDisplay, 1000);

      const cleanup = () => {
        if (timerId !== null) clearInterval(timerId);
        modal.remove();
      };

      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };

      submitBtn.onclick = async () => {
        const rateStatus = this.getRateLimitStatus();
        if (rateStatus.blocked) return;

        const val = input.value.trim();
        if (val.length < 4 || val.length > 8) {
          errorDiv.textContent = 'Passcode must be between 4 and 8 characters.';
          return;
        }

        const hashed = await this.hashPasscode(roomCode, val);
        if (hashed === expectedHash) {
          cleanup();
          resolve(true);
        } else {
          const failStatus = this.recordFailedAttempt();
          if (failStatus.blocked) {
            updateRateLimitDisplay();
          } else {
            const left = 5 - this._attemptTimestamps.length;
            errorDiv.textContent = `Incorrect passcode! (${left} attempt${left === 1 ? '' : 's'} remaining)`;
            input.value = '';
            input.focus();
          }
        }
      };

      input.onkeydown = (e) => {
        if (e.key === 'Enter') submitBtn.click();
      };
    });
  }

  /**
   * Prompts host for optional passcode when creating room.
   */
  public static async promptCreateRoomPasscode(): Promise<string> {
    return new Promise<string>((resolve) => {
      const modal = document.createElement('div');
      modal.id = 'neo-create-pass-modal';
      modal.innerHTML = `
        <div class="neo-modal-backdrop"></div>
        <div class="neo-modal-content">
          <h2 class="neo-modal-title">⚡ PRIVATE ROOM PASSCODE</h2>
          <p class="neo-modal-sub">Set an optional 4-8 character passcode for your party, or leave empty for open room:</p>
          
          <div class="neo-form-group">
            <input type="text" id="neo-create-pass-input" maxlength="8" placeholder="OPTIONAL (e.g. 7788)" autofocus autocomplete="off" />
            <div id="neo-create-pass-error" style="color:#ff0055; font-size:11px; margin-top:6px; min-height:16px;"></div>
          </div>

          <div style="display:flex; gap:10px;">
            <button id="neo-create-pass-confirm" class="neo-btn-primary">CREATE ROOM</button>
            <button id="neo-create-pass-cancel" class="neo-btn-secondary" style="background:#222; color:#ccc; border:1px solid #444; border-radius:4px; padding:10px 14px; font-family:'Orbitron',monospace; cursor:pointer;">CANCEL</button>
          </div>
        </div>
      `;

      this._injectPasscodeStyles();
      document.body.appendChild(modal);

      const input = modal.querySelector('#neo-create-pass-input') as HTMLInputElement;
      const errorDiv = modal.querySelector('#neo-create-pass-error') as HTMLDivElement;
      const confirmBtn = modal.querySelector('#neo-create-pass-confirm') as HTMLButtonElement;
      const cancelBtn = modal.querySelector('#neo-create-pass-cancel') as HTMLButtonElement;

      cancelBtn.onclick = () => {
        modal.remove();
        resolve(''); // Cancel or empty
      };

      confirmBtn.onclick = () => {
        const val = input.value.trim();
        if (val.length > 0 && (val.length < 4 || val.length > 8)) {
          errorDiv.textContent = 'Passcode must be 4 to 8 characters, or leave blank.';
          return;
        }
        modal.remove();
        resolve(val);
      };

      input.onkeydown = (e) => {
        if (e.key === 'Enter') confirmBtn.click();
      };
    });
  }

  private static _injectPasscodeStyles(): void {
    if (document.getElementById('neo-passcode-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-passcode-style';
    style.textContent = `
      #neo-passcode-modal, #neo-create-pass-modal {
        position: fixed; inset: 0; z-index: 12000;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Orbitron', monospace; color: #fff;
      }
    `;
    document.head.appendChild(style);
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
