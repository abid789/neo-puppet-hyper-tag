// src/audio/SoundEngine.ts
// 100% procedural Web Audio synthesizer. No external audio files.
// Features procedural SFX, generated impulse-response convolution reverb, and a dynamic synthwave beat generator.

import { SettingsManager } from '../core/SettingsManager';

export class SoundEngine {
  private static _instance: SoundEngine | null = null;

  public static getInstance(): SoundEngine {
    if (!this._instance) {
      this._instance = new SoundEngine();
    }
    return this._instance;
  }

  private _ctx: AudioContext | null = null;
  private _masterGain!: GainNode;
  private _sfxGain!: GainNode;
  private _musicGain!: GainNode;
  private _convolver!: ConvolverNode;

  private _isInitialized = false;

  // Synthwave Beat Generator state
  private _musicPlaying = false;
  private _bpm = 124;
  private _isFinal15 = false;
  private _nextNoteTime = 0;
  private _currentStep = 0;
  private _musicTimerId: number | null = null;

  constructor() {
    this._attachAutoplayGestureListeners();

    // Hook settings volume updates
    const settings = SettingsManager.getInstance();
    settings.onSettingsChanged((s) => {
      this.setMasterVolume(s.masterVolume);
      this.setSfxVolume(s.sfxVolume);
      this.setMusicVolume(s.musicVolume);
    });
  }

  private _attachAutoplayGestureListeners(): void {
    const unlock = () => {
      this.init();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  public init(): void {
    if (this._isInitialized) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this._ctx = new AudioCtx();

      if (this._ctx.state === 'suspended') {
        this._ctx.resume().catch(() => { /* noop */ });
      }

      // Gain nodes
      this._masterGain = this._ctx.createGain();
      this._sfxGain = this._ctx.createGain();
      this._musicGain = this._ctx.createGain();

      const initialSettings = SettingsManager.getInstance().getSettings();
      this._masterGain.gain.value = initialSettings.masterVolume;
      this._sfxGain.gain.value = initialSettings.sfxVolume;
      this._musicGain.gain.value = initialSettings.musicVolume;

      // Synthetic Convolution Reverb
      this._convolver = this._ctx.createConvolver();
      this._convolver.buffer = this._generateImpulseResponse(1.8, 3.2);

      const reverbWetGain = this._ctx.createGain();
      reverbWetGain.gain.value = 0.18;

      // Routing
      this._sfxGain.connect(this._masterGain);
      this._sfxGain.connect(this._convolver);
      this._convolver.connect(reverbWetGain);
      reverbWetGain.connect(this._masterGain);

      this._musicGain.connect(this._masterGain);
      this._masterGain.connect(this._ctx.destination);

      this._isInitialized = true;
      console.log('[SoundEngine] Procedural Web Audio Engine active.');
    } catch (err) {
      console.warn('[SoundEngine] Failed to initialize AudioContext:', err);
    }
  }

  public setMasterVolume(v: number): void {
    if (this._ctx && this._masterGain) {
      this._masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this._ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(v: number): void {
    if (this._ctx && this._sfxGain) {
      this._sfxGain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this._ctx.currentTime, 0.05);
    }
  }

  public setMusicVolume(v: number): void {
    if (this._ctx && this._musicGain) {
      this._musicGain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this._ctx.currentTime, 0.05);
    }
  }

  /**
   * Generates a stereo exponential decaying noise impulse response for the convolver.
   */
  private _generateImpulseResponse(durationSec: number, decayRate: number): AudioBuffer {
    if (!this._ctx) throw new Error('AudioContext missing');

    const sampleRate = this._ctx.sampleRate;
    const length = Math.floor(sampleRate * durationSec);
    const impulse = this._ctx.createBuffer(2, length, sampleRate);

    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * decayRate);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    return impulse;
  }

  // ── Procedural Sound Effects ─────────────────────────────────────────────────

  public playFootstep(surface: 'metal' | 'ice' | 'stone' = 'metal'): void {
    if (!this._ctx || !this._isInitialized) return;
    const now = this._ctx.currentTime;

    const bufferSize = Math.floor(this._ctx.sampleRate * 0.06);
    const noiseBuffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this._ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this._ctx.createBiquadFilter();
    const gain = this._ctx.createGain();

    if (surface === 'ice') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now);
      filter.Q.setValueAtTime(6.0, now);
    } else if (surface === 'metal') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1750, now);
      filter.Q.setValueAtTime(7.5, now);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(2.0, now);
    }

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._sfxGain);

    noise.start(now);
  }

  public playJump(isDouble = false): void {
    if (!this._ctx || !this._isInitialized) return;
    const now = this._ctx.currentTime;

    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();

    osc.type = 'sine';
    const startFreq = isDouble ? 260 : 150;
    const endFreq   = isDouble ? 580 : 380;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  public playDash(): void {
    if (!this._ctx || !this._isInitialized) return;
    const now = this._ctx.currentTime;

    // Sub-bass sine sweep
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(36, now + 0.26);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + 0.29);
  }

  public playTagZap(): void {
    if (!this._ctx || !this._isInitialized) return;
    const now = this._ctx.currentTime;

    // FM synthesizer zap
    const carrier = this._ctx.createOscillator();
    const modulator = this._ctx.createOscillator();
    const modGain = this._ctx.createGain();
    const mainGain = this._ctx.createGain();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(260, now);
    carrier.frequency.exponentialRampToValueAtTime(60, now + 0.2);

    modulator.type = 'square';
    modulator.frequency.setValueAtTime(140, now);

    modGain.gain.setValueAtTime(180, now);
    modGain.gain.exponentialRampToValueAtTime(10, now + 0.18);

    modulator.connect(carrier.frequency);

    mainGain.gain.setValueAtTime(0.35, now);
    mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    carrier.connect(mainGain);
    mainGain.connect(this._sfxGain);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + 0.23);
    carrier.stop(now + 0.23);
  }

  public playPowerUp(): void {
    if (!this._ctx || !this._isInitialized) return;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5]; // C5, E5, G5, B5, C6
    const now = this._ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this._ctx!.createOscillator();
      const gain = this._ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.18, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.25);

      osc.connect(gain);
      gain.connect(this._sfxGain);

      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.26);
    });
  }

  public playCountdownBeep(isFinalGo = false): void {
    if (!this._ctx || !this._isInitialized) return;
    const now = this._ctx.currentTime;

    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();

    osc.type = isFinalGo ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(isFinalGo ? 880 : 440, now);

    const dur = isFinalGo ? 0.45 : 0.14;
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain);
    gain.connect(this._sfxGain);

    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  public playInviteChime(): void {
    if (!this._ctx || !this._isInitialized) return;
    const now = this._ctx.currentTime;

    // D5 -> A5
    const osc1 = this._ctx.createOscillator();
    const g1 = this._ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    g1.gain.setValueAtTime(0.2, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(g1); g1.connect(this._sfxGain);
    osc1.start(now); osc1.stop(now + 0.36);

    const osc2 = this._ctx.createOscillator();
    const g2 = this._ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    g2.gain.setValueAtTime(0.25, now + 0.12);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(g2); g2.connect(this._sfxGain);
    osc2.start(now + 0.12); osc2.stop(now + 0.56);
  }

  public playVictoryFanfare(): void {
    if (!this._ctx || !this._isInitialized) return;
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [293.66, 369.99, 440.00], // D major
      [329.63, 415.30, 493.88], // E major
      [523.25, 659.25, 783.99], // C high
    ];

    const now = this._ctx.currentTime;
    chords.forEach((chord, cIdx) => {
      const cTime = now + cIdx * 0.28;
      chord.forEach(freq => {
        const osc = this._ctx!.createOscillator();
        const gain = this._ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, cTime);

        gain.gain.setValueAtTime(0.12, cTime);
        gain.gain.exponentialRampToValueAtTime(0.001, cTime + 0.55);

        osc.connect(gain);
        gain.connect(this._sfxGain);

        osc.start(cTime);
        osc.stop(cTime + 0.56);
      });
    });
  }

  // ── Procedural Synthwave Beat Generator ─────────────────────────────────────

  public startMusic(): void {
    if (this._musicPlaying) return;
    this.init();
    if (!this._ctx) return;

    this._musicPlaying = true;
    this._nextNoteTime = this._ctx.currentTime + 0.1;
    this._currentStep = 0;
    this._scheduleNextBeats();
  }

  public stopMusic(): void {
    this._musicPlaying = false;
    if (this._musicTimerId !== null) {
      clearTimeout(this._musicTimerId);
      this._musicTimerId = null;
    }
  }

  public setFinal15Tempo(isFinal15: boolean): void {
    this._isFinal15 = isFinal15;
    this._bpm = isFinal15 ? 148 : 124;
  }

  public get isFinal15(): boolean {
    return this._isFinal15;
  }

  private _scheduleNextBeats(): void {
    if (!this._musicPlaying || !this._ctx) return;

    const secondsPer16th = (60 / this._bpm) / 4;

    while (this._nextNoteTime < this._ctx.currentTime + 0.25) {
      this._triggerBeatStep(this._currentStep, this._nextNoteTime);
      this._nextNoteTime += secondsPer16th;
      this._currentStep = (this._currentStep + 1) % 16;
    }

    this._musicTimerId = window.setTimeout(() => this._scheduleNextBeats(), 50);
  }

  private _triggerBeatStep(step: number, time: number): void {
    if (!this._ctx) return;

    // 1. Kick on steps 0, 4, 8, 12 (four-on-the-floor)
    if (step % 4 === 0) {
      this._synthKick(time);
    }

    // 2. Snare on steps 4, 12
    if (step === 4 || step === 12) {
      this._synthSnare(time);
    }

    // 3. Hi-Hat on every offbeat step
    if (step % 2 === 1) {
      this._synthHiHat(time);
    }

    // 4. Rolling Synth Bassline (A minor arpeggio)
    const bassNotes = [55, 55, 110, 55, 65.41, 65.41, 130.81, 65.41, 73.42, 73.42, 146.83, 73.42, 82.41, 73.42, 65.41, 55];
    const freq = bassNotes[step] ?? 55;
    this._synthBass(freq, time);
  }

  private _synthKick(time: number): void {
    if (!this._ctx) return;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this._musicGain);

    osc.start(time);
    osc.stop(time + 0.16);
  }

  private _synthSnare(time: number): void {
    if (!this._ctx) return;
    const bufferSize = Math.floor(this._ctx.sampleRate * 0.1);
    const noiseBuffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this._ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this._ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(950, time);

    const gain = this._ctx.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._musicGain);

    noise.start(time);
  }

  private _synthHiHat(time: number): void {
    if (!this._ctx) return;
    const bufferSize = Math.floor(this._ctx.sampleRate * 0.03);
    const noiseBuffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this._ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this._ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(5800, time);

    const gain = this._ctx.createGain();
    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this._musicGain);

    noise.start(time);
  }

  private _synthBass(freq: number, time: number): void {
    if (!this._ctx) return;
    const osc = this._ctx.createOscillator();
    const filter = this._ctx.createBiquadFilter();
    const gain = this._ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 3.5, time);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.2, time + 0.08);

    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this._musicGain);

    osc.start(time);
    osc.stop(time + 0.1);
  }
}
