// src/core/DeviceInfo.ts
// Device capability detection for mobile touchscreens, screen form factors, and orientation.

export class DeviceInfo {
  /**
   * Returns true if the device supports touch input via pointer coarse media query,
   * maxTouchPoints, or window ontouchstart.
   */
  public static isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false;

    const hasTouchPoints =
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
      (typeof navigator !== 'undefined' && ((navigator as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints ?? 0) > 0);

    const hasTouchStart = 'ontouchstart' in window;

    const isPointerCoarse =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches;

    return hasTouchPoints || hasTouchStart || isPointerCoarse;
  }

  /**
   * Returns true if viewport width is typical of a smartphone or compact tablet.
   */
  public static isSmallScreen(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches);
  }

  /**
   * Returns true if device is in landscape orientation.
   */
  public static isLandscape(): boolean {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= window.innerHeight;
  }
}

// Convenient top-level exports
export const isTouchDevice = DeviceInfo.isTouchDevice;
export const isSmallScreen = DeviceInfo.isSmallScreen;
export const isLandscape = DeviceInfo.isLandscape;
