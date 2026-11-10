# NEO-PUPPET: HYPER TAG

> **Premium Browser Arena Tag with Articulated Ragdoll Puppets, Cyberpunk Neon Aesthetics, and 60Hz Deterministic Physics.**

Built with PixiJS v8, Rapier2D Physics WASM, WebRTC Data Channels, and pure procedural Web Audio synthesis.

---

## ⚡ Game Overview
- **Articulated Ragdoll Puppets:** 10-body articulated ragdolls simulated with Rapier2D joints and PD-balance locomotion. Visor eyes dynamically track motion and squint during air dashes.
- **5 Playable Arenas:**
  1. *Neon Cyber Foundry:* Multi-level industrial smelter with horizontal conveyor belts, timed laser gates, and high-impulse jump pads.
  2. *Zero-G Orbital Station:* Deep-space habitat with a central 35% low-gravity dome, bidirectional quantum portals, and vertical airlock vents.
  3. *Magma Core Reactor:* Volcanic chamber with lava surges, crumbling basalt platforms, and high-launch thermal vents.
  4. *Glacier Mirror Lab:* Low-friction ice platforms, shatterable physics glass barriers, and swinging cryo-pendulums.
  5. *Skyline Rooftop Rush:* Rainy cyberpunk skyscrapers with gap jumps, overhead speed ziplines, and antenna springboards.
- **3 Tag Game Disciplines:**
  - *Hunter Point Rush:* Tag survivors for +100 pts (+50 aerial bonus) with $\times 1.5$ and $\times 2.0$ streak multipliers.
  - *Hot Bomb Tag:* Pass the 15-second ticking Neon Core before it detonates in a ragdoll blast!
  - *Crown Keep-Away:* Hold the golden crown for +25 pts/sec and a 20% dash cooldown reduction.
- **Fair-Play Anti-Grief Rules:**
  - 0.6s stun and 1.8s anti-tagback grace period with flashing holographic shield rings.
  - Near-Miss detector: dodging within 45px of a lunging tagger triggers a 0.3s 40% slow-motion micro-pulse, style points, and floating popup.
- **Procedural Web Audio Engine:** Pure Web Audio oscillators, biquad filters, synthetic convolution reverb, and an adaptive 124 $\rightarrow$ 148 BPM synthwave beat generator (zero external audio files).
- **Free Online & Multi-Tab Multiplayer:** WebRTC Data Channels with Firebase Realtime Database signaling and automatic `BroadcastChannel` local fallback for testing multiple tabs on the same machine.
- **Full Internationalization:** Dual English (EN) and Bengali (বাংলা) support with Google Fonts font stack (`Hind Siliguri`, `Noto Sans Bengali`).

---

## 🎮 Controls

| Action | Primary Key | Alternate / P2 Key |
| :--- | :--- | :--- |
| **Move Left** | <kbd>A</kbd> | <kbd>←</kbd> |
| **Move Right** | <kbd>D</kbd> | <kbd>→</kbd> |
| **Jump / Double Jump** | <kbd>W</kbd> | <kbd>↑</kbd> |
| **Air Dash** | <kbd>Shift Left</kbd> | <kbd>Ctrl Right</kbd> |
| **Tag Attack** | <kbd>F</kbd> | <kbd>H</kbd> |
| **Holographic Emotes** | Keys <kbd>1</kbd> to <kbd>6</kbd> (`😂`, `🔥`, `👑`, `⚡`, `👀`, `GG!`) | Keys <kbd>1</kbd> to <kbd>6</kbd> |
| **Cycle AI Bot Difficulty** | <kbd>B</kbd> (`Casual` $\rightarrow$ `Pro` $\rightarrow$ `Nightmare`) | — |
| **Toggle Active Bot Count** | <kbd>N</kbd> (1 to 3 bots) | — |
| **Performance HUD** | <kbd>F3</kbd> (FPS, Frame ms, Phys ms, Ping) | — |
| **Fast-Forward Match State** | <kbd>P</kbd> (Testing shortcut) | — |

---

## 📦 Exact Pinned Package Versions

```json
{
  "dependencies": {
    "@dimforge/rapier2d-compat": "0.21.0",
    "firebase": "11.10.0",
    "pixi.js": "8.22.0"
  },
  "devDependencies": {
    "@rollup/wasm-node": "^4.68.2",
    "typescript": "5.6.3",
    "vite": "5.4.14"
  }
}
```

---

## 🚀 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. Open a second tab to test local multi-tab multiplayer!

### 3. Production Build & Typecheck
```bash
npm run typecheck
npm run build
npm run preview
```

---

## ☁️ Free Deployment
See [**`FREE_DEPLOYMENT_GUIDE.md`**](file:///c:/Users/abida/Desktop/4%20playerrrrrrrrrrrrrrrr/FREE_DEPLOYMENT_GUIDE.md) for step-by-step instructions on deploying to **Vercel** with **Firebase Realtime Database** on the 100% free Spark plan.
