// src/main.ts
// NEO-PUPPET: HYPER TAG — Phase 5 Final entry point with premium UI, procedural audio, settings, and netcode.

import RAPIER from '@dimforge/rapier2d-compat';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { Renderer } from './graphics/Renderer';
import { Camera } from './graphics/Camera';
import { ParticleSystem } from './graphics/Particles';
import { LightingSystem } from './graphics/Lighting';
import { Puppet } from './entities/Puppet';
import { PowerUpManager } from './entities/PowerUpManager';
import { MapManager } from './maps/MapManager';
import { MatchController } from './game/MatchController';
import { PuppetBotController, type BotDifficulty, type BotPersonality } from './ai/PuppetBotController';
import { Engine } from './core/Engine';
import { MapBalanceHud } from './ui/MapBalanceHud';
import { DebugCounter } from './core/DebugCounter';
import { SoakTest } from './game/SoakTest';
import { ReconnectBanner } from './ui/ReconnectBanner';
import { FirebaseCleanup } from './network/FirebaseCleanup';

// Phase 4 Networking & Social modules
import { NetworkManager } from './network/NetworkManager';
import { NetSync } from './network/NetSync';
import { RoomLinkManager } from './network/RoomLinkManager';
import { PresenceService } from './network/PresenceService';
import { InviteSystem } from './network/InviteSystem';
import { InviteBanner } from './ui/InviteBanner';
import { SocialPresencePanel } from './ui/SocialPresencePanel';
import { EmoteWheel } from './ui/EmoteWheel';
import { LobbyUI } from './ui/LobbyUI';
import { ChatService } from './network/ChatService';

// Phase 5 UI, Procedural Audio & Settings modules
import { UIManager } from './ui/UIManager';
import { SoundEngine } from './audio/SoundEngine';
import { SettingsManager } from './core/SettingsManager';
import { Toast } from './ui/Toast';
import { TouchControls } from './ui/TouchControls';
import { OrientationNotice } from './ui/OrientationNotice';
import { InputManager } from './core/InputManager';

import {
  NEON_CYAN,
  NEON_PINK,
  NEON_BLUE,
  NEON_PURPLE,
  NEON_GREEN,
  NEON_YELLOW,
  NEON_ORANGE,
} from './types';
import type { ITrackedEntity } from './types';

async function main(): Promise<void> {
  // ── Global Listener Counter ──────────────────────────────────────────────────
  DebugCounter.init();

  // ── Network, Settings & Profile Initialization ──────────────────────────────
  const net = NetworkManager.getInstance();
  const settings = SettingsManager.getInstance();
  const soundEngine = SoundEngine.getInstance();
  const initialRoomFromUrl = RoomLinkManager.getRoomFromUrl();

  // Ensure pilot profile (prompts modal if first time opening URL)
  const userProfile = await RoomLinkManager.ensureUserProfile(net.playerId);
  ChatService.getInstance().setLocalSender(userProfile.nickname, userProfile.avatarSkin);

  // 6-hour bounded Firebase cleanup routine
  FirebaseCleanup.runIfDue(userProfile.playerId).catch(() => { /* noop */ });

  // ── Loading overlay ──────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.innerHTML = `
    <div id="loading-title">NEO-PUPPET</div>
    <div id="loading-sub">SYNCHRONISING NEURAL AUDIO & ESPORTS UI…</div>
  `;
  document.body.appendChild(overlay);

  // ── Init physics (async WASM) ────────────────────────────────────────────────
  await RAPIER.init();
  const physWorld = new PhysicsWorld();
  await physWorld.init();

  // ── Init renderer ────────────────────────────────────────────────────────────
  const mountEl = document.getElementById('app');
  if (!mountEl) throw new Error('#app element not found');
  const renderer = new Renderer(mountEl);
  await renderer.init();
  renderer.setCustomMapActive(true);

  // Apply initial graphics preset and resolution scale
  const initSettings = settings.getSettings();
  renderer.setGraphicsPreset(initSettings.graphicsPreset);
  renderer.setResolutionScale(initSettings.renderScale);

  // ── Build game container (camera transforms this, not the full stage) ────────
  const { layers, app } = renderer;

  // ── Systems ───────────────────────────────────────────────────────────────────
  const camera = new Camera();
  camera.setShakeMultiplier(initSettings.screenShake);

  const particles = new ParticleSystem(layers.trailLayer, layers.vfxLayer);
  particles.setBudget(initSettings.particleBudget);
  const lighting = new LightingSystem(layers.lightingLayer, app);
  const powerUpManager = new PowerUpManager(physWorld, particles, layers.entityLayer);
  const mapManager = new MapManager(
    physWorld,
    particles,
    powerUpManager,
    layers.backgroundLayer,
    layers.arenaLayer,
    layers.vfxLayer,
  );

  // ── 4 Articulated Puppets (1-4 Players / AI Bots) ────────────────────────────
  const puppet1 = new Puppet(physWorld, particles, {
    x: -7,
    y:  4.5,
    colorPrimary:   NEON_CYAN,
    colorSecondary: NEON_BLUE,
    colorVisor:     NEON_CYAN,
    playerIndex: 0,
  }, layers.entityLayer);

  const puppet2 = new Puppet(physWorld, particles, {
    x:  7,
    y:  4.5,
    colorPrimary:   NEON_PINK,
    colorSecondary: NEON_PURPLE,
    colorVisor:     NEON_PINK,
    playerIndex: 1,
  }, layers.entityLayer);

  const puppet3 = new Puppet(physWorld, particles, {
    x: -4,
    y:  0.5,
    colorPrimary:   NEON_GREEN,
    colorSecondary: 0x008844,
    colorVisor:     NEON_GREEN,
    playerIndex: 2,
  }, layers.entityLayer);

  const puppet4 = new Puppet(physWorld, particles, {
    x:  4,
    y:  0.5,
    colorPrimary:   NEON_YELLOW,
    colorSecondary: NEON_ORANGE,
    colorVisor:     NEON_YELLOW,
    playerIndex: 3,
  }, layers.entityLayer);

  const allPuppetPool: Puppet[] = [puppet1, puppet2, puppet3, puppet4];

  // ── AI Bot Controllers ───────────────────────────────────────────────────────
  let botDifficulty: BotDifficulty = 'Pro';
  let botPersonality: BotPersonality = 'Aggressive';
  let activeBotCount = 3;
  const bot2 = new PuppetBotController(puppet2, physWorld, botDifficulty, botPersonality);
  const bot3 = new PuppetBotController(puppet3, physWorld, botDifficulty, botPersonality);
  const bot4 = new PuppetBotController(puppet4, physWorld, botDifficulty, botPersonality);
  const botPool = [bot2, bot3, bot4];

  let activePuppets: Puppet[] = [puppet1, puppet2, puppet3, puppet4];

  // Initialize Map Manager with puppets & load first arena
  mapManager.setPuppets(activePuppets);
  mapManager.loadInitialMap(0);
  camera.track(activePuppets as ITrackedEntity[]);

  // ── Game container for camera transform ───────────────────────────────────────
  const { Container: PixiContainer } = await import('pixi.js');
  const gameRoot = new PixiContainer();

  const worldLayers = [
    layers.backgroundLayer,
    layers.arenaLayer,
    layers.shadowLayer,
    layers.trailLayer,
    layers.entityLayer,
    layers.lightingLayer,
    layers.vfxLayer,
  ];
  worldLayers.forEach(l => gameRoot.addChild(l));
  app.stage.addChildAt(gameRoot, 0);

  // ── Match Controller ──────────────────────────────────────────────────────────
  let engine!: Engine;

  const matchController = new MatchController(
    {
      setTimeScale: (scale: number, durationSec: number) => engine?.setTimeScale(scale, durationSec),
      getTimeScale: () => engine?.getTimeScale() ?? 1.0,
    } as any,
    camera,
    mapManager,
    layers.uiOverlayLayer,
  );
  matchController.setPuppets(activePuppets);

  // ── Phase 4 & 5 UI & Social Services ─────────────────────────────────────────
  const netSync = new NetSync(net);
  netSync.setPuppets(activePuppets);

  const presence = new PresenceService(userProfile);
  const inviteSys = new InviteSystem(userProfile);
  const inviteBanner = new InviteBanner();
  const presencePanel = new SocialPresencePanel(presence, userProfile);
  const emoteWheel = new EmoteWheel(layers.vfxLayer, net);
  emoteWheel.setPuppets(activePuppets);
  const lobbyUI = new LobbyUI(net);
  const uiManager = new UIManager();

  // Mobile Touch Controls & Orientation Notification
  const touchControls = new TouchControls();
  touchControls.mount(document.body);
  const orientationNotice = new OrientationNotice();
  orientationNotice.mount(document.body);
  uiManager.setTouchControls(touchControls);
  uiManager.setOrientationNotice(orientationNotice);

  const mapBalanceHud = new MapBalanceHud();
  void mapBalanceHud;

  const updateActiveParticipants = (): void => {
    activePuppets = [puppet1, ...allPuppetPool.slice(1, 1 + activeBotCount)];
    for (let i = 0; i < allPuppetPool.length; i++) {
      const p = allPuppetPool[i];
      if (activePuppets.includes(p)) {
        p.setInputFrozen(false);
      } else {
        p.setInputFrozen(true);
        p.teleport(999, 999);
      }
    }
    camera.track(activePuppets as ITrackedEntity[]);
    mapManager.setPuppets(activePuppets);
    matchController.setPuppets(activePuppets);
    netSync.setPuppets(activePuppets);
    emoteWheel.setPuppets(activePuppets);
  };

  // Wire UI Manager Transitions
  uiManager.setCallbacks({
    onStartGame: (cfg) => {
      engine.setTimeScale(1.0, 0);
      mapManager.loadInitialMap(cfg.mapIndex);
      matchController.setGameMode(cfg.modeIndex);
      matchController.setRoundDuration(cfg.durationSec);
      activeBotCount = cfg.botCount;
      botDifficulty = cfg.botDifficulty;
      botPersonality = cfg.botPersonality;
      for (let i = 0; i < botPool.length; i++) {
        botPool[i].setDifficulty(cfg.botDifficulty);
        botPool[i].setPersonality(cfg.botPersonality);
      }
      updateActiveParticipants();
      matchController.startMatch();
      soundEngine.startMusic();
    },
    onLeaveParty: () => {
      net.leaveRoom();
      RoomLinkManager.clearRoomFromUrl();
      lobbyUI.update();
      presence.updateStatus('ONLINE_IDLE');
    },
    onRematch: () => {
      matchController.resetMatch();
      powerUpManager.clearAll();
      for (let i = 0; i < botPool.length; i++) {
        botPool[i].setPersonality(botPersonality);
      }
      net.sendEvent('REMATCH_REQUESTED', { roomCode: net.roomCode, passcode: net.roomPasscode });
      uiManager.goToLobby(true, net.roomCode, net.roomPasscode, true);
    },
  });

  // Handle incoming rematch requests from host
  net.onEvent((eventType, payload) => {
    if (eventType === 'REMATCH_REQUESTED') {
      Toast.show('Host initiated rematch! Returning to lobby…');
      matchController.resetMatch();
      powerUpManager.clearAll();
      for (let i = 0; i < botPool.length; i++) {
        botPool[i].setPersonality(botPersonality);
      }
      uiManager.goToLobby(false, net.roomCode || String(payload.roomCode || ''), '', true);
    }
  });

  // Handle incoming Game Invites
  inviteSys.onInviteReceived((invite) => {
    inviteBanner.show(
      invite,
      async (accepted) => {
        const ok = await net.joinRoom(accepted.roomCode);
        if (ok) {
          RoomLinkManager.setRoomInUrl(accepted.roomCode);
          lobbyUI.update();
          presence.updateStatus('IN_LOBBY', accepted.roomCode);
          uiManager.goToLobby(false, accepted.roomCode);
          Toast.show(`Joined party in ${accepted.roomCode}`);
        }
      },
      (declined) => {
        inviteSys.dismissInvite(declined.inviteId);
      },
    );
  });

  // Handle Send Invite trigger from Social Presence Drawer
  presencePanel.setOnInvite((targetPlayerId) => {
    const code = net.roomCode || 'TAG-8492';
    inviteSys.sendInvite(
      targetPlayerId,
      code,
      mapManager.currentMap.name,
      matchController.currentMode.name,
    ).then((sent) => {
      Toast.show(sent ? 'Invite Dispatched!' : 'Invite Delivery Failed');
    });
  });

  // Handle Room State changes from Lobby UI
  lobbyUI.setOnRoomStateChanged((roomCode, isHost) => {
    presence.updateStatus(roomCode ? 'IN_LOBBY' : 'ONLINE_IDLE', roomCode);
    if (roomCode) {
      uiManager.goToLobby(isHost, roomCode, net.roomPasscode);
    }
  });

  // ── Keyboard shortcut listeners ──────────────────────────────────────────────
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    // Avoid triggering when focused on input fields
    const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    // B = Cycle Bot Difficulty: Casual -> Pro -> Nightmare
    if (e.code === 'KeyB') {
      if (botDifficulty === 'Casual') {
        botDifficulty = 'Pro';
      } else if (botDifficulty === 'Pro') {
        botDifficulty = 'Nightmare';
      } else {
        botDifficulty = 'Casual';
      }
      for (let i = 0; i < botPool.length; i++) {
        botPool[i].setDifficulty(botDifficulty);
      }
      console.log(`[AI Bots] Difficulty set to: ${botDifficulty}`);
      Toast.show(`Bot Difficulty: ${botDifficulty.toUpperCase()}`);
    }

    // V = Cycle Bot Personality: Aggressive -> Cautious -> Random
    if (e.code === 'KeyV') {
      if (botPersonality === 'Aggressive') {
        botPersonality = 'Cautious';
      } else if (botPersonality === 'Cautious') {
        botPersonality = 'Random';
      } else {
        botPersonality = 'Aggressive';
      }
      for (let i = 0; i < botPool.length; i++) {
        botPool[i].setPersonality(botPersonality);
      }
      console.log(`[AI Bots] Personality set to: ${botPersonality}`);
      Toast.show(`Bot Personality: ${botPersonality.toUpperCase()}`);
    }

    // N = Cycle Active Bot Count: 1 Bot -> 2 Bots -> 3 Bots
    if (e.code === 'KeyN') {
      activeBotCount = (activeBotCount % 3) + 1;
      updateActiveParticipants();
      console.log(`[AI Bots] Active Bot Count: ${activeBotCount} (Total Players: ${activeBotCount + 1})`);
    }

    // K = Run 10-match AI Difficulty Benchmark
    if (e.code === 'KeyK') {
      PuppetBotController.benchmarkDifficulty(10);
    }
  });

  // ── Engine ────────────────────────────────────────────────────────────────────
  engine = new Engine(
    {
      onFixedUpdate: (dt: number): void => {
        // NetSync fixed update & dynamic interpolation buffer sync
        netSync.fixedUpdate(dt);
        engine.setInterpolationBuffer(netSync.currentInterpolationDelay);
        emoteWheel.update(dt);

        // Update AI Bots
        if (net.isHost || uiManager.currentState === 'MENU') {
          const startingBotIdx = (net.isConnected() && uiManager.currentState !== 'MENU') ? 1 : 0;
          for (let i = startingBotIdx; i < activeBotCount; i++) {
            botPool[i].update(dt, activePuppets, mapManager.currentMap.powerUpNodes);
          }
        }

        // Forward mobile touch input to local player puppet
        puppet1.setTouchInput(InputManager.getInstance().getTouchInput());

        // Fixed update for all active puppets
        for (let i = 0; i < activePuppets.length; i++) {
          activePuppets[i].fixedUpdate(dt);
        }

        mapManager.fixedUpdate(dt);
        powerUpManager.fixedUpdate(dt, activePuppets);
        matchController.fixedUpdate(dt);
        physWorld.step(dt);
        camera.fixedUpdate(dt);
        particles.fixedUpdate(dt);

        // Check for Match -> Podium transition
        if (
          matchController.currentState === 'ROUND_SUMMARY_PODIUM' &&
          uiManager.currentState === 'MATCH'
        ) {
          const results = activePuppets.map((p) => {
            const idx = p.getPlayerIndex();
            const stats = matchController.scoringEngine.getPlayerStats(idx);
            const hex = '#' + p.getColorPrimary().toString(16).padStart(6, '0');
            return {
              playerIndex: idx,
              name: idx === 0 ? userProfile.nickname : `AI BOT ${idx}`,
              score: stats?.score ?? 0,
              color: hex,
              tagsMade: stats?.tagsMade ?? 0,
              taggedCount: stats?.timesTagged ?? 0,
              nearMisses: stats?.nearMisses ?? 0,
            };
          });
          uiManager.goToPodium(results);
        }

        // Music speed-up during final 15s
        if (
          matchController.roundTimeRemaining <= 15.0 &&
          matchController.roundTimeRemaining > 0 &&
          uiManager.currentState === 'MATCH'
        ) {
          soundEngine.setFinal15Tempo(true);
        } else {
          soundEngine.setFinal15Tempo(false);
        }
      },
      onRender: (alpha: number, _dt: number): void => {
        // Interpolate remote puppets with 50ms buffer for jitter-free remote visual rendering
        if (net.isConnected()) {
          netSync.interpolateRemotePuppets();
        }

        for (let i = 0; i < activePuppets.length; i++) {
          activePuppets[i].render(alpha);
        }
        const camPos = puppet1.getWorldPosition();
        mapManager.render(camPos.x, camPos.y);
        powerUpManager.render();
        matchController.render(app.screen.width, app.screen.height);

        // Update Esports Match HUD & Touch Controls cooldowns
        if (uiManager.currentState === 'MATCH') {
          if (touchControls.isVisible) {
            touchControls.updateDashCooldown(puppet1.getDashCooldownFraction(), puppet1.isDashReady());
          }

          const playerLabels = activePuppets.map((p) => {
            const idx = p.getPlayerIndex();
            if (idx === 0) {
              return { realName: userProfile.nickname, playerId: userProfile.playerId };
            }
            return { realName: `AI BOT ${idx}` };
          });

          uiManager.hud.update(
            activePuppets,
            matchController.scoringEngine,
            matchController.roundTimeRemaining,
            matchController.currentMode.name,
            net.localPlayerIndex,
            matchController.currentMode,
            playerLabels,
          );
        }

        camera.applyTo(gameRoot, app);
        lighting.update(alpha, activePuppets as ITrackedEntity[]);
        particles.render(alpha);
      },
    },
    layers.uiOverlayLayer,
  );

  engine.setTargetFps(initSettings.targetFps);
  engine.setDiagnosticsGetter(() => ({
    particles: particles.activeParticleCount,
    bodies: physWorld.getBodyCount(),
    listeners: DebugCounter.getEventListenerCount(),
  }));

  settings.onSettingsChanged((s) => {
    renderer.setGraphicsPreset(s.graphicsPreset);
    renderer.setResolutionScale(s.renderScale);
    particles.setBudget(s.particleBudget);
    engine.setTargetFps(s.targetFps);
    camera.setShakeMultiplier(s.screenShake);
    if (uiManager.currentState === 'MATCH') {
      touchControls.setVisible(settings.shouldShowTouchControls());
    }
  });

  // ── Auto Reconnect & Reliability Handlers ────────────────────────────────────
  const reconnectBanner = ReconnectBanner.getInstance();

  net.onReconnectAttempt((attempt, max) => {
    reconnectBanner.showReconnecting(attempt, max);
  });

  net.onReconnected(() => {
    reconnectBanner.hideAll();
    presence.republishPresence();
    Toast.show('✓ Reconnected to squad room');
  });

  net.onConnectionLost(() => {
    reconnectBanner.showConnectionLost(
      async () => {
        const ok = await net.manualRejoin();
        if (!ok) {
          Toast.show('Failed to rejoin room');
        }
      },
      () => {
        net.leaveRoom();
        RoomLinkManager.clearRoomFromUrl();
        reconnectBanner.hideAll();
        uiManager.goToMenu();
      },
    );
  });

  net.onHostDisconnected(() => {
    if (uiManager.currentState === 'LOBBY') {
      uiManager.lobbyScreen.showHostDisconnected(() => {
        net.leaveRoom();
        RoomLinkManager.clearRoomFromUrl();
        uiManager.goToMenu();
      });
    } else {
      Toast.show('Host disconnected from room');
    }
  });

  // Forward live Ping from NetSync to Engine Performance HUD
  netSync.onPingUpdated((ping) => {
    engine.setPing(ping);
  });

  // ── 10-Minute Soak Test Runner (?soak=1) ─────────────────────────────────────
  SoakTest.startIfRequested(mapManager, particles, physWorld);

  // ── Initial navigation (checking passcode if protected) ───────────────────────
  if (initialRoomFromUrl) {
    net.checkRoomProtected(initialRoomFromUrl).then(async (passHash) => {
      if (passHash) {
        const authorized = await RoomLinkManager.promptForPasscode(initialRoomFromUrl, passHash);
        if (!authorized) {
          Toast.show('Passcode verification failed. Returning to menu.');
          RoomLinkManager.clearRoomFromUrl();
          uiManager.goToMenu();
          return;
        }
      }

      const joined = await net.joinRoom(initialRoomFromUrl);
      if (joined) {
        lobbyUI.update();
        presence.updateStatus('IN_LOBBY', initialRoomFromUrl);
        uiManager.goToLobby(false, initialRoomFromUrl);
        Toast.show(`Connected to room: ${initialRoomFromUrl}`);
      }
    });
  } else {
    // Start on Main Menu with background puppet chase
    uiManager.goToMenu();
    engine.setTimeScale(0.48, 99999);
  }

  // ── Hide loading overlay ───────────────────────────────────────────────────────
  overlay.classList.add('hidden');
  setTimeout(() => overlay.remove(), 700);

  // ── Start ──────────────────────────────────────────────────────────────────────
  engine.start();
}

main().catch((err: unknown) => {
  console.error('[NEO-PUPPET] Fatal init error:', err);
});
