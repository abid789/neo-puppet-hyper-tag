// src/core/DebugCounter.ts
// Global event listener and diagnostics tracking counter for NEO-PUPPET: HYPER TAG.
// Monitors registered window event listeners to verify zero-leak memory safety.

export class DebugCounter {
  private static _activeListeners = 0;
  private static _initialized = false;

  public static init(): void {
    if (this._initialized || typeof window === 'undefined') return;
    this._initialized = true;

    const origAdd = window.addEventListener;
    const origRemove = window.removeEventListener;

    window.addEventListener = function (
      this: Window,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ): void {
      DebugCounter._activeListeners++;
      return origAdd.call(this, type, listener, options);
    };

    window.removeEventListener = function (
      this: Window,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ): void {
      DebugCounter._activeListeners = Math.max(0, DebugCounter._activeListeners - 1);
      return origRemove.call(this, type, listener, options);
    };
  }

  public static getEventListenerCount(): number {
    return this._activeListeners;
  }
}
