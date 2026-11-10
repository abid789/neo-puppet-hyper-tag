// src/core/Localization.ts
// Complete internationalization engine supporting English (en) and Bengali (bn - বাংলা).
// All UI strings pass through this module.

export type SupportedLanguage = 'en' | 'bn';

const STORAGE_KEY = 'neo-puppet-lang';

export interface TranslationDictionary {
  // App & Titles
  appTitle:          string;
  appSubtitle:       string;
  loadingWasm:       string;

  // Main Menu
  playQuickMatch:    string;
  practiceMode:      string;
  matchRecap:        string;
  hostLobby:         string;
  joinRoom:          string;
  customizer:        string;
  settings:          string;
  cloudSetup:        string;
  switchLang:        string;

  // Lobby
  lobbyTitle:        string;
  readyBtn:          string;
  readyStatus:       string;
  notReadyStatus:    string;
  startGame:         string;
  waitingForHost:    string;
  playerSlot:        string;
  botSlot:           string;
  inviteFriends:     string;
  copyLink:          string;
  copyCode:          string;
  backToMenu:        string;

  // Match Customizer
  customizerTitle:   string;
  selectMap:         string;
  selectMode:        string;
  durationLabel:     string;
  modifierLabel:     string;
  botCountLabel:     string;
  botDiffLabel:      string;
  applyAndClose:     string;

  // Game Modes
  modeHunter:        string;
  modeHunterDesc:    string;
  modeBomb:          string;
  modeBombDesc:      string;
  modeCrown:         string;
  modeCrownDesc:     string;
  modeTeam:          string;
  modeTeamDesc:      string;
  modeInfection:     string;
  modeInfectionDesc: string;
  modeSurvivor:      string;
  modeSurvivorDesc:  string;

  // Modifiers
  modNormal:         string;
  modTurbo:          string;
  modLowG:           string;

  // Difficulties
  diffCasual:        string;
  diffPro:           string;
  diffNightmare:     string;

  // Personalities
  personalityLabel:  string;
  persAggressive:    string;
  persCautious:      string;
  persRandom:        string;

  // Friend Group Features
  roomPasscode:      string;
  enterPasscode:     string;
  incorrectPasscode: string;
  passcodeBlocked:   string;
  copyPasscode:      string;
  passcodeCopied:    string;
  rematchBtn:        string;
  rematchRequested:  string;
  partyChat:         string;
  chatPlaceholder:   string;
  chatRateLimit:     string;
  editNickname:      string;
  setNicknameTitle:  string;
  todayMatches:      string;
  rivalryMatrix:     string;

  // Reconnection & Reliability
  reconnectingTitle:      string;
  reconnectAttempt:       string;
  connectionLostTitle:    string;
  connectionLostDesc:     string;
  rejoinBtn:              string;
  hostDisconnectedTitle:  string;
  hostDisconnectedDesc:   string;

  // Mobile & Touch Controls
  touchControlsTitle:     string;
  rotatePhoneHint:        string;

  // HUD
  timeRemaining:     string;
  score:             string;
  dashReady:         string;
  dashCooldown:      string;
  final15Sec:        string;
  doublePoints:      string;
  nearMissPopup:     string;
  stunnedNotice:     string;

  // Podium
  matchFinished:     string;
  champion:          string;
  mvpTitleApex:      string;
  mvpTitleUntouch:   string;
  mvpTitleAnkle:     string;
  playAgain:         string;

  // Settings
  settingsTitle:     string;
  tabGraphics:       string;
  tabAudio:          string;
  tabControls:       string;
  tabLanguage:       string;
  presetUltra:       string;
  presetHigh:        string;
  presetEsports:     string;
  screenShake:       string;
  masterVol:         string;
  sfxVol:            string;
  musicVol:          string;
  saveSettings:      string;
  closeBtn:          string;
  rebindKey:         string;
  conflictWarning:   string;

  // Cloud Setup
  cloudTitle:        string;
  cloudDesc:         string;
  cloudPlaceholder:  string;
  saveConfig:        string;
  clearConfig:       string;
  cloudActive:       string;
  localFallbackActive: string;

  // Toasts & Alerts
  copiedLinkToast:   string;
  copiedCodeToast:   string;
  joinedRoomToast:   string;
  leftRoomToast:     string;
}

const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appTitle:          'NEO-PUPPET',
    appSubtitle:       'HYPER TAG // 60Hz ARENA CYBER TAG',
    loadingWasm:       'INITIALISING NEURAL PHYSICS & GRAPHICS CORE…',

    playQuickMatch:    'QUICK MATCH (SOLO / BOTS)',
    practiceMode:      'PRACTICE MODE (OFFLINE BOTS)',
    matchRecap:        'LAST MATCH RECAP',
    hostLobby:         'CREATE PARTY LOBBY',
    joinRoom:          'JOIN VIA ROOM CODE',
    customizer:        'MATCH CUSTOMIZER',
    settings:          'SETTINGS',
    cloudSetup:        'CLOUD MULTIPLAYER SETUP',
    switchLang:        'বাংলায় পরিবর্তন করুন',

    lobbyTitle:        'TACTICAL SQUAD LOBBY',
    readyBtn:          'READY UP!',
    readyStatus:       'READY',
    notReadyStatus:    'PREPARING…',
    startGame:         'DEPLOY INTO ARENA',
    waitingForHost:    'WAITING FOR HOST TO LAUNCH…',
    playerSlot:        'PLAYER',
    botSlot:           'AI COMBATANT',
    inviteFriends:     'INVITE PILOTS',
    copyLink:          'COPY INVITE LINK',
    copyCode:          'COPY CODE',
    backToMenu:        'BACK TO MENU',

    customizerTitle:   'MATCH PARAMETERS // HOST ONLY',
    selectMap:         'BATTLEGROUND ARENA',
    selectMode:        'TAG DISCIPLINE',
    durationLabel:     'ROUND DURATION',
    modifierLabel:     'ENVIRONMENT MODIFIER',
    botCountLabel:     'BOT COMBATANTS',
    botDiffLabel:      'COMBAT DIFFICULTY',
    applyAndClose:     'CONFIRM PARAMETERS',

    modeHunter:        'HUNTER POINT RUSH',
    modeHunterDesc:    'Tag survivors for +100pts (+50 aerial bonus). Streaks boost score!',
    modeBomb:          'HOT BOMB TAG',
    modeBombDesc:      'Holding the Neon Core ticks down from 15s. Tag to pass before it detonates!',
    modeCrown:         'CROWN KEEP-AWAY',
    modeCrownDesc:     'Hold the golden crown for +25pts/sec and 20% faster dash cooldown.',
    modeTeam:          'TEAM TAG (RED VS BLUE)',
    modeTeamDesc:      'Two teams compete. Tag opposing members to rack up points for your team!',
    modeInfection:     'OUTBREAK INFECTION',
    modeInfectionDesc: 'One player is infected. Every tag converts a human to the zombie horde. Survive!',
    modeSurvivor:      'LAST SURVIVOR ELIMINATION',
    modeSurvivorDesc:  'Lowest score eliminated every 20s. Last player standing wins!',

    modNormal:         'STANDARD 1.0X',
    modTurbo:          'TURBO OVERDRIVE 1.25X',
    modLowG:           'LOW-GRAVITY CHAOS',

    diffCasual:        'CASUAL',
    diffPro:           'PRO',
    diffNightmare:     'NIGHTMARE',

    personalityLabel:  'BOT PERSONALITY',
    persAggressive:    'AGGRESSIVE',
    persCautious:      'CAUTIOUS',
    persRandom:        'RANDOM',

    roomPasscode:      'ROOM PASSCODE',
    enterPasscode:     'ENTER ROOM PASSCODE',
    incorrectPasscode: 'INCORRECT PASSCODE',
    passcodeBlocked:   'TOO MANY ATTEMPTS. LOCKED FOR 60s.',
    copyPasscode:      'COPY PASSCODE',
    passcodeCopied:    'PASSCODE COPIED TO CLIPBOARD',
    rematchBtn:        '🔄 REMATCH',
    rematchRequested:  'HOST CALLED REMATCH! RETURNING TO LOBBY…',
    partyChat:         'PARTY CHAT',
    chatPlaceholder:   'Type a message (max 140 chars)…',
    chatRateLimit:     'RATE LIMITED: 1 message per second.',
    editNickname:      'EDIT NICKNAME',
    setNicknameTitle:  'SET FRIEND NICKNAME (DEVICE ONLY)',
    todayMatches:      "TODAY'S MATCHES",
    rivalryMatrix:     'RIVALRY MATRIX // PAIR SUMMARY',

    reconnectingTitle:     'RECONNECTING…',
    reconnectAttempt:      'Attempt',
    connectionLostTitle:   'CONNECTION LOST',
    connectionLostDesc:    'Unable to reconnect to the session after 10 attempts. Would you like to rejoin or return to the menu?',
    rejoinBtn:             'REJOIN ROOM',
    hostDisconnectedTitle: 'HOST DISCONNECTED',
    hostDisconnectedDesc:  'The room host has disconnected. Host migration is disabled for casual rooms. Please return to the menu.',

    touchControlsTitle:    'TOUCH CONTROLS',
    rotatePhoneHint:       'Rotate your phone for the best experience',

    timeRemaining:     'TIME REMAINING',
    score:             'PTS',
    dashReady:         'DASH READY',
    dashCooldown:      'RECHARGING',
    final15Sec:        'FINAL 15 SECONDS!',
    doublePoints:      'DOUBLE POINTS ACTIVATED!',
    nearMissPopup:     'NEAR MISS! +25',
    stunnedNotice:     'SYSTEM STUNNED',

    matchFinished:     'ARENA MATCH COMPLETED',
    champion:          'VICTORIOUS PILOT',
    mvpTitleApex:      '⚡ APEX HUNTER: Most Tags Delivered',
    mvpTitleUntouch:   '🛡️ UNTOUCHABLE: Fewest Times Tagged',
    mvpTitleAnkle:     '💨 ANKLE BREAKER: Most Near-Miss Evasions',
    playAgain:         'PLAY AGAIN',

    settingsTitle:     'PILOT CONFIGURATION',
    tabGraphics:       'VISUALS',
    tabAudio:          'AUDIO',
    tabControls:       'CONTROLS',
    tabLanguage:       'LANGUAGE',
    presetUltra:       'ULTRA (BLOOM, LIGHTS, 2000 PARTICLES)',
    presetHigh:        'HIGH (BALANCED 60+ FPS)',
    presetEsports:     'ESPORTS (MAX FPS, CLEAN SIGHTLINES)',
    screenShake:       'SCREEN SHAKE INTENSITY',
    masterVol:         'MASTER VOLUME',
    sfxVol:            'SFX VOLUME',
    musicVol:          'SYNTHWAVE MUSIC',
    saveSettings:      'APPLY SETTINGS',
    closeBtn:          'CLOSE',
    rebindKey:         'CLICK TO REBIND',
    conflictWarning:   'Key conflict detected! Key is already bound to another action.',

    cloudTitle:        'FREE FIREBASE ONLINE SETUP',
    cloudDesc:         'By default, game runs in Local Multi-Tab mode. Paste your Firebase project credentials below for global WebRTC multiplayer:',
    cloudPlaceholder:  '{"apiKey": "...", "databaseURL": "...", "projectId": "..."}',
    saveConfig:        'CONNECT FIREBASE',
    clearConfig:       'RESET TO LOCAL FALLBACK',
    cloudActive:       'CONNECTED TO FIREBASE CLOUD',
    localFallbackActive: 'LOCAL MULTI-TAB FALLBACK ACTIVE',

    copiedLinkToast:   'Shareable party invite link copied to clipboard!',
    copiedCodeToast:   'Party room code copied to clipboard!',
    joinedRoomToast:   'Successfully joined squad room:',
    leftRoomToast:     'Left multiplayer squad',
  },
  bn: {
    appTitle:          'নিও-পাপেট',
    appSubtitle:       'হাইপার ট্যাগ // ৬০ হার্টজ সাইবার অ্যারেনা ট্যাগ',
    loadingWasm:       'ফিজিক্স ও গ্রাফিক্স ইঞ্জিন চালু হচ্ছে…',

    playQuickMatch:    'কুইক ম্যাচ (একাকী / বট)',
    practiceMode:      'অনুশীলন মোড (অফলাইন বট)',
    matchRecap:        'শেষ ম্যাচের ফলাফল',
    hostLobby:         'নতুন লবি তৈরি করুন',
    joinRoom:          'রুম কোড দিয়ে যোগ দিন',
    customizer:        'ম্যাচ কাস্টমাইজ',
    settings:          'সেটিংস',
    cloudSetup:        'অনলাইন ক্লাউড সেটআপ',
    switchLang:        'Switch to English',

    lobbyTitle:        'দলগত যুদ্ধ লবি',
    readyBtn:          'প্রস্তুত!',
    readyStatus:       'প্রস্তুত',
    notReadyStatus:    'অপেক্ষারত…',
    startGame:         'ম্যাচ শুরু করুন',
    waitingForHost:    'হোস্টের শুরুর অপেক্ষায়…',
    playerSlot:        'খেলোয়াড়',
    botSlot:           'রোবট প্রতিপক্ষ',
    inviteFriends:     'বন্ধুদের আমন্ত্রণ জানান',
    copyLink:          'লিংক কপি করুন',
    copyCode:          'কোড কপি করুন',
    backToMenu:        'মূল মেনুতে ফিরুন',

    customizerTitle:   'ম্যাচ সেটিংস // শুধুমাত্র হোস্ট',
    selectMap:         'যুদ্ধক্ষেত্র নির্বাচন',
    selectMode:        'গেম মোড',
    durationLabel:     'ম্যাচের সময়সীমা',
    modifierLabel:     'পরিবেশ মডিফায়ার',
    botCountLabel:     'বটের সংখ্যা',
    botDiffLabel:      'বট কাঠিন্য',
    applyAndClose:     'সেভ ও বন্ধ করুন',

    modeHunter:        'হান্টার পয়েন্ট রাশ',
    modeHunterDesc:    'সারভাইভারদের ট্যাগ করে ১০০ পয়েন্ট নিন (বাতাসে থাকলে ৫০ বোনাস)!',
    modeBomb:          'হট বম ট্যাগ',
    modeBombDesc:      '১৫ সেকেন্ডের বোমার কোরটি অন্যকে ট্যাগ করে দিন, বিস্ফোরণের আগেই!',
    modeCrown:         'ক্রাউন কিপ-অ্যাওয়ে',
    modeCrownDesc:     'স্বর্ণমুকুট ধরে রাখলে প্রতি সেকেন্ডে ২৫ পয়েন্ট এবং ড্যাশ কুলডাউন কমে।',
    modeTeam:          'টিম ট্যাগ (লাল বনাম নীল)',
    modeTeamDesc:      'দুই দলের লড়াই। প্রতিপক্ষের খেলোয়াড়দের ট্যাগ করে দলের জন্য পয়েন্ট অর্জন করুন!',
    modeInfection:     'ইনফেকশন আউটব্রেক',
    modeInfectionDesc: 'একজন সংক্রমিত থাকে। প্রতিটি ট্যাগে আক্রান্তের দল বাড়ে। শেষ মানব হিসেবে টিকে থাকুন!',
    modeSurvivor:      'লাস্ট সারভাইভার এলিমিনেশন',
    modeSurvivorDesc:  'প্রতি ২০ সেকেন্ডে সর্বনিম্ন পয়েন্টধারী ধ্বংস হয়ে যাবে। শেষ বেঁচে থাকা খেলোয়াড় বিজয়ী!',

    modNormal:         'স্বাভাবিক ১.০ গুণ',
    modTurbo:          'টার্বো স্পিড ১.২৫ গুণ',
    modLowG:           'কম মাধ্যাকর্ষণ',

    diffCasual:        'সহজ',
    diffPro:           'প্রো',
    diffNightmare:     'নাইটমেয়ার',

    personalityLabel:  'বট ব্যক্তিত্ব',
    persAggressive:    'আক্রমণাত্মক',
    persCautious:      'সতর্ক',
    persRandom:        'এলোমেলো',

    roomPasscode:      'রুম পাসকোড',
    enterPasscode:     'রুম পাসকোড দিন',
    incorrectPasscode: 'ভুল পাসকোড!',
    passcodeBlocked:   'অতিরিক্ত ভুল প্রচেষ্টা। ৬০ সেকেন্ড অপেক্ষা করুন।',
    copyPasscode:      'পাসকোড কপি',
    passcodeCopied:    'পাসকোড ক্লিপবোর্ডে কপি করা হয়েছে',
    rematchBtn:        '🔄 পুনরায় ম্যাচ (রিম্যাচ)',
    rematchRequested:  'হোস্ট রিম্যাচ ডেকেছেন! লবিতে ফিরছি…',
    partyChat:         'পার্টি চ্যাট',
    chatPlaceholder:   'বার্তা লিখুন (সর্বোচ্চ ১৪০ বর্ণ)…',
    chatRateLimit:     'গতি সীমিত: প্রতি সেকেন্ডে ১টি বার্তা।',
    editNickname:      'নাম পরিবর্তন',
    setNicknameTitle:  'বন্ধুর নাম নির্ধারণ (শুধুমাত্র এই ডিভাইসে)',
    todayMatches:      'আজকের ম্যাচসমূহ',
    rivalryMatrix:     'দ্বৈত প্রতিদ্বন্দ্বিতা রেকর্ড',

    reconnectingTitle:     'পুনঃসংযোগ করা হচ্ছে…',
    reconnectAttempt:      'প্রচেষ্টা',
    connectionLostTitle:   'সংযোগ বিচ্ছিন্ন হয়েছে',
    connectionLostDesc:    '১০ বার চেষ্টা করার পরও সংযোগ স্থাপন সম্ভব হয়নি। আপনি কি পুনরায় যোগ দিতে চান নাকি মেনুতে ফিরবেন?',
    rejoinBtn:             'রুমে পুনরায় যোগ দিন',
    hostDisconnectedTitle: 'হোস্ট বিচ্ছিন্ন হয়েছেন',
    hostDisconnectedDesc:  'রুমের হোস্ট সংযোগ বিচ্ছিন্ন হয়েছেন। অনুগ্রহ করে মূল মেনুতে ফিরে যান।',

    touchControlsTitle:    'টাচ কন্ট্রোলস',
    rotatePhoneHint:       'সেরা অভিজ্ঞতার জন্য ফোনটি অনুভূমিক (Landscape) করুন',

    timeRemaining:     'অবশিষ্ট সময়',
    score:             'পয়েন্ট',
    dashReady:         'ড্যাশ প্রস্তুত',
    dashCooldown:      'চার্জ হচ্ছে…',
    final15Sec:        'শেষ ১৫ সেকেন্ড!',
    doublePoints:      'ডাবল পয়েন্ট চালু হয়েছে!',
    nearMissPopup:     'নিয়ার মিস! +২৫',
    stunnedNotice:     'সিস্টেম স্টানড',

    matchFinished:     'ম্যাচ সমাপ্ত!',
    champion:          'বিজয়ী যোদ্ধা',
    mvpTitleApex:      '⚡ অ্যাপেক্স হান্টার: সর্বোচ্চ ট্যাগ',
    mvpTitleUntouch:   '🛡️ আনটাচেবল: সর্বনিম্ন ট্যাগ খাওয়া',
    mvpTitleAnkle:     '💨 অ্যাঙ্কেল ব্রেকার: সর্বোচ্চ নিয়ার-মিস',
    playAgain:         'পুনরায় খেলুন',

    settingsTitle:     'গেম কনফিগারেশন',
    tabGraphics:       'গ্রাফিক্স',
    tabAudio:          'অডিও',
    tabControls:       'কন্ট্রোলস',
    tabLanguage:       'ভাষা (Language)',
    presetUltra:       'আল্ট্রা (ব্লুম, লাইট, ২০০০ পার্টিকেল)',
    presetHigh:        'হাই (ভারসাম্যপূর্ণ ৬০+ এফপিএস)',
    presetEsports:     'ই-স্পোর্টস (সর্বোচ্চ এফপিএস, ক্লিয়ার)',
    screenShake:       'স্ক্রিন শেক তীব্রতা',
    masterVol:         'মাস্টার ভলিউম',
    sfxVol:            'শব্দ এফেক্টস (SFX)',
    musicVol:          'সিন্থওয়েভ গান',
    saveSettings:      'সেভ করুন',
    closeBtn:          'বন্ধ করুন',
    rebindKey:         'নতুন কি চাপুন',
    conflictWarning:   'এই কি-টি ইতোমধ্যে অন্য কাজে ব্যবহার করা হয়েছে!',

    cloudTitle:        'ফ্রি ফায়ারবেস অনলাইন সেটআপ',
    cloudDesc:         'স্বাভাবিকভাবে গেমটি লোকাল ট্যাবে চলে। বিশ্বব্যাপী বন্ধুদের সাথে খেলতে ফায়ারবেস কনফিগ দিন:',
    cloudPlaceholder:  '{"apiKey": "...", "databaseURL": "...", "projectId": "..."}',
    saveConfig:        'ফায়ারবেস যুক্ত করুন',
    clearConfig:       'লোকাল মোডে ফিরুন',
    cloudActive:       'ফায়ারবেস ক্লাউড সংযুক্ত আছে',
    localFallbackActive: 'লোকাল মাল্টি-ট্যাব মোড চালু',

    copiedLinkToast:   'আমন্ত্রণ লিংক ক্লিপবোর্ডে কপি হয়েছে!',
    copiedCodeToast:   'রুম কোড ক্লিপবোর্ডে কপি হয়েছে!',
    joinedRoomToast:   'রুমে যুক্ত হয়েছেন:',
    leftRoomToast:     'রুম থেকে বের হয়েছেন',
  },
};

export class Localization {
  private static _currentLang: SupportedLanguage = Localization._loadInitialLanguage();
  private static readonly _listeners: ((lang: SupportedLanguage) => void)[] = [];

  private static _loadInitialLanguage(): SupportedLanguage {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'bn' || saved === 'en') {
        return saved;
      }
    } catch {
      /* noop */
    }
    return 'en';
  }

  public static getLanguage(): SupportedLanguage {
    return this._currentLang;
  }

  public static setLanguage(lang: SupportedLanguage): void {
    if (this._currentLang !== lang) {
      this._currentLang = lang;
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* noop */
      }
      this._applyFontStack(lang);
      for (let i = 0; i < this._listeners.length; i++) {
        this._listeners[i](lang);
      }
    }
  }

  public static toggleLanguage(): SupportedLanguage {
    const next: SupportedLanguage = this._currentLang === 'en' ? 'bn' : 'en';
    this.setLanguage(next);
    return next;
  }

  public static onLanguageChanged(cb: (lang: SupportedLanguage) => void): void {
    this._listeners.push(cb);
  }

  public static t(key: keyof TranslationDictionary): string {
    const dict = TRANSLATIONS[this._currentLang] ?? TRANSLATIONS.en;
    return dict[key] ?? TRANSLATIONS.en[key] ?? String(key);
  }

  private static _applyFontStack(lang: SupportedLanguage): void {
    if (typeof document !== 'undefined') {
      if (lang === 'bn') {
        document.body.style.fontFamily = "'Hind Siliguri', 'Noto Sans Bengali', 'Inter', sans-serif";
      } else {
        document.body.style.fontFamily = "'Orbitron', 'Rajdhani', 'Inter', sans-serif";
      }
    }
  }
}
