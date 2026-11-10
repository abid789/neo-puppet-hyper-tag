import { Container, Text, TextStyle, Graphics } from 'pixi.js';

const PANEL_BG = 0x0d0d1f;
const PANEL_WIDTH = 220;
const PANEL_HEIGHT = 184;
const PANEL_X = 12;
const PANEL_Y = 12;
const PADDING = 6;
const LINE_HEIGHT = 18;

export class PerfHud {
  private _panel: Graphics;
  private _txtFps: Text;
  private _txtFrame: Text;
  private _txtPhys: Text;
  private _txtPing: Text;
  private _txtBuffer: Text;
  private _txtHeap: Text;
  private _txtParticles: Text;
  private _txtBodies: Text;
  private _txtListeners: Text;
  private _visible = false;

  private _fps = 0;
  private _frameMs = 0;
  private _physMs = 0;
  private _pingMs = 0;
  private _bufferMs = 50;

  constructor(parent: Container) {
    // Build the dark background panel
    this._panel = new Graphics();
    this._panel.roundRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 6);
    this._panel.fill({ color: PANEL_BG, alpha: 0.88 });
    this._panel.stroke({ color: 0x00ffff, width: 1, alpha: 0.5 });
    this._panel.x = PANEL_X;
    this._panel.y = PANEL_Y;

    const style = new TextStyle({
      fontFamily: 'Orbitron',
      fontSize: 10,
      fill: '#00ffff',
      wordWrap: false,
    });

    this._txtFps       = new Text({ text: 'FPS      --', style });
    this._txtFrame     = new Text({ text: 'FRAME    --', style });
    this._txtPhys      = new Text({ text: 'PHYS     --', style });
    this._txtPing      = new Text({ text: 'PING     --', style });
    this._txtBuffer    = new Text({ text: 'BUFFER   50ms', style });
    this._txtHeap      = new Text({ text: 'HEAP     --', style });
    this._txtParticles = new Text({ text: 'PARTS    --', style });
    this._txtBodies    = new Text({ text: 'BODIES   --', style });
    this._txtListeners = new Text({ text: 'LISTEN   --', style });

    const texts = [
      this._txtFps,
      this._txtFrame,
      this._txtPhys,
      this._txtPing,
      this._txtBuffer,
      this._txtHeap,
      this._txtParticles,
      this._txtBodies,
      this._txtListeners,
    ];

    texts.forEach((t, i) => {
      t.x = PANEL_X + PADDING;
      t.y = PANEL_Y + PADDING + i * LINE_HEIGHT;
      t.visible = false;
    });

    // Start hidden
    this._panel.visible = false;

    parent.addChild(this._panel);
    texts.forEach(t => parent.addChild(t));
  }

  toggle(): void {
    this._visible = !this._visible;
    this._panel.visible = this._visible;
    this._txtFps.visible = this._visible;
    this._txtFrame.visible = this._visible;
    this._txtPhys.visible = this._visible;
    this._txtPing.visible = this._visible;
    this._txtBuffer.visible = this._visible;
    this._txtHeap.visible = this._visible;
    this._txtParticles.visible = this._visible;
    this._txtBodies.visible = this._visible;
    this._txtListeners.visible = this._visible;
  }

  public get isVisible(): boolean {
    return this._visible;
  }

  update(
    fps: number,
    frameMs: number,
    physMs: number,
    pingMs: number,
    bufferMs = 50,
    particleCount = 0,
    bodyCount = 0,
    listenerCount = 0,
  ): void {
    this._fps = fps;
    this._frameMs = frameMs;
    this._physMs = physMs;
    this._pingMs = pingMs;
    this._bufferMs = bufferMs;

    this._txtFps.text    = `FPS      ${this._fps}`;
    this._txtFrame.text  = `FRAME    ${this._frameMs.toFixed(1)}ms`;
    this._txtPhys.text   = `PHYS     ${this._physMs.toFixed(1)}ms`;
    this._txtPing.text   = `PING     ${this._pingMs}ms`;
    this._txtBuffer.text = `BUFFER   ${this._bufferMs.toFixed(0)}ms`;

    // Heap size from performance.memory where browser exposes it
    const perfMem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (perfMem) {
      const usedMb = (perfMem.usedJSHeapSize / (1024 * 1024)).toFixed(1);
      const totalMb = (perfMem.jsHeapSizeLimit / (1024 * 1024)).toFixed(0);
      this._txtHeap.text = `HEAP     ${usedMb} / ${totalMb} MB`;
    } else {
      this._txtHeap.text = `HEAP     N/A (Standard)`;
    }

    this._txtParticles.text = `PARTS    ${particleCount}`;
    this._txtBodies.text    = `BODIES   ${bodyCount}`;
    this._txtListeners.text = `LISTEN   ${listenerCount}`;
  }
}
