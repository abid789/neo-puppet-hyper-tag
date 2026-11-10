// src/ui/Toast.ts
// Floating cyberpunk notification toast used for copy-link, invites, and network alerts.

export class Toast {
  public static show(message: string, durationMs = 2800, isError = false): void {
    const toast = document.createElement('div');
    toast.className = `neo-global-toast ${isError ? 'error' : 'success'}`;
    toast.textContent = message;

    this._injectStyles();
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('visible'), 20);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, durationMs);
  }

  private static _injectStyles(): void {
    if (document.getElementById('neo-toast-style')) return;
    const style = document.createElement('style');
    style.id = 'neo-toast-style';
    style.textContent = `
      .neo-global-toast {
        position: fixed; bottom: 36px; left: 50%; transform: translateX(-50%) translateY(20px);
        background: rgba(13, 13, 31, 0.96); border: 1px solid #00ffff; color: #00ffff;
        padding: 10px 22px; border-radius: 6px; font-family: 'Orbitron', monospace;
        font-size: 11px; font-weight: bold; z-index: 15000; box-shadow: 0 0 25px rgba(0,255,255,0.35);
        backdrop-filter: blur(8px); opacity: 0; pointer-events: none;
        transition: all 0.3s cubic-bezier(0.1, 0.9, 0.2, 1); letter-spacing: 0.5px;
      }
      .neo-global-toast.error {
        border-color: #ff0066; color: #ff0066; box-shadow: 0 0 25px rgba(255,0,102,0.35);
      }
      .neo-global-toast.visible {
        opacity: 1; transform: translateX(-50%) translateY(0);
      }
    `;
    document.head.appendChild(style);
  }
}
