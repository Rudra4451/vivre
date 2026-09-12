import { Howl, Howler } from "howler";
import { useUIStore } from "./store";

export type SoundKey =
  | "completion"
  | "bonus"
  | "critical"
  | "level-up"
  | "shield"
  | "purchase";

export interface SoundConfig {
  src: string[];
  volume: number;
  preload: boolean;
  isEssential: boolean;
  rate?: number;
}

/**
 * Sound catalog definitions.
 *
 * Essential short sounds (completion, bonus, critical) are preloaded.
 * Optional / extended assets (level-up, shield, purchase) are lazy-loaded on demand.
 */
export const SOUND_DEFINITIONS: Record<SoundKey, SoundConfig> = {
  completion: {
    src: ["/sounds/completion.wav"],
    volume: 0.65,
    preload: true,
    isEssential: false,
  },
  bonus: {
    src: ["/sounds/bonus.wav"],
    volume: 0.7,
    preload: true,
    isEssential: false,
  },
  critical: {
    src: ["/sounds/critical.wav"],
    volume: 0.8,
    preload: true,
    isEssential: true,
  },
  "level-up": {
    src: ["/sounds/level-up.wav"],
    volume: 0.85,
    preload: false, // Lazy-loaded on first level-up celebration
    isEssential: false,
  },
  shield: {
    src: ["/sounds/shield.wav"],
    volume: 0.75,
    preload: false, // Lazy-loaded on first shield consumption
    isEssential: true,
  },
  purchase: {
    src: ["/sounds/purchase.wav"],
    volume: 0.7,
    preload: false, // Lazy-loaded on first store interaction
    isEssential: false,
  },
};

/**
 * Fallback Web Audio Procedural Synthesizer.
 * Used if Howler encounters blocked audio, missing assets (404), or decoding errors.
 */
let fallbackAudioCtx: AudioContext | null = null;

function getFallbackContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!fallbackAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      try {
        fallbackAudioCtx = new AudioContextClass();
      } catch {
        fallbackAudioCtx = null;
      }
    }
  }
  return fallbackAudioCtx;
}

function playProceduralFallback(key: SoundKey) {
  try {
    const ctx = getFallbackContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (key === "completion" || key === "critical") {
      const isCrit = key === "critical";
      const freqs = isCrit ? [528, 660, 792, 1056] : [528, 660];
      const baseVolume = isCrit ? 0.08 : 0.06;

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        const noteStart = now + idx * 0.06;
        noteGain.gain.setValueAtTime(0.0001, noteStart);
        noteGain.gain.exponentialRampToValueAtTime(baseVolume, noteStart + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + (isCrit ? 0.6 : 0.4));

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + (isCrit ? 0.65 : 0.45));
      });
    } else if (key === "level-up") {
      const chord = [440, 554.37, 659.25, 830.61, 1108.73];
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        const noteStart = now + idx * 0.08;
        noteGain.gain.setValueAtTime(0.0001, noteStart);
        noteGain.gain.exponentialRampToValueAtTime(0.08, noteStart + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 1.25);
      });
    } else if (key === "shield") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(329.63, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } else if (key === "bonus" || key === "purchase") {
      const freqs = key === "bonus" ? [830.61, 1046.50, 1318.51] : [932.33, 1396.91];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        const noteStart = now + idx * 0.04;
        noteGain.gain.setValueAtTime(0.0001, noteStart);
        noteGain.gain.exponentialRampToValueAtTime(0.07, noteStart + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.4);

        osc.connect(noteGain);
        noteGain.connect(ctx.destination);
        osc.start(noteStart);
        osc.stop(noteStart + 0.45);
      });
    }
  } catch {
    // Fail silently — no sound should ever break gameplay
  }
}

/**
 * Centralized Audio Manager for Vivre Constellation Atlas.
 *
 * Rules:
 * - Singleton pattern: Never instantiates Howl instances on render.
 * - Preloads only essential short sounds (completion, bonus, critical).
 * - Lazy-loads optional extended sounds (level-up, shield, purchase).
 * - Honors browser autoplay policy: Never autoplays before user interaction.
 * - Respects soundEnabled (master toggle) and calmMode (filters non-essential sounds).
 * - Gracefully handles missing assets, blocked audio, and unsupported browsers.
 */
class VivreAudioManager {
  private static instance: VivreAudioManager | null = null;
  private howlCache: Map<SoundKey, Howl> = new Map();
  private hasUserInteracted = false;
  private isInitialized = false;

  private constructor() {
    this.setupAutoplayGuard();
  }

  public static getInstance(): VivreAudioManager {
    if (!VivreAudioManager.instance) {
      VivreAudioManager.instance = new VivreAudioManager();
    }
    return VivreAudioManager.instance;
  }

  /**
   * Sets up one-time listener for user interaction to unlock audio context safely.
   */
  private setupAutoplayGuard() {
    if (typeof window === "undefined") return;

    // In testing environments, permit interaction immediately
    if (process.env.NODE_ENV === "test") {
      this.hasUserInteracted = true;
      return;
    }

    const unlock = () => {
      this.hasUserInteracted = true;
      try {
        if (Howler.ctx && Howler.ctx.state === "suspended") {
          Howler.ctx.resume().catch(() => {});
        }
      } catch {}

      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
    };

    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    window.addEventListener("touchstart", unlock, true);
  }

  /**
   * Preload only essential short sounds.
   * Safe to call multiple times; only preloads on client once.
   */
  public preloadEssential() {
    if (typeof window === "undefined" || this.isInitialized) return;
    this.isInitialized = true;

    for (const [key, cfg] of Object.entries(SOUND_DEFINITIONS) as [SoundKey, SoundConfig][]) {
      if (cfg.preload && !this.howlCache.has(key)) {
        this.getOrCreateHowl(key);
      }
    }
  }

  /**
   * Internal sound instance factory and cache retrieval.
   * Ensures Howler objects are never recreated on every render.
   */
  private getOrCreateHowl(key: SoundKey): Howl | null {
    if (typeof window === "undefined") return null;

    const cached = this.howlCache.get(key);
    if (cached) return cached;

    const cfg = SOUND_DEFINITIONS[key];
    if (!cfg) return null;

    try {
      const howl = new Howl({
        src: cfg.src,
        volume: cfg.volume,
        preload: cfg.preload,
        html5: false, // Use Web Audio buffer for precise, low-latency playback
        onloaderror: () => {
          // Log softly; fallback will handle playback gracefully
          if (process.env.NODE_ENV === "development") {
            console.warn(`[AudioManager] Asset load failed for "${key}", procedural fallback ready.`);
          }
        },
        onplayerror: (_id, err) => {
          if (process.env.NODE_ENV === "development") {
            console.warn(`[AudioManager] Play error for "${key}":`, err);
          }
          // Attempt procedural fallback
          playProceduralFallback(key);
        },
      });

      this.howlCache.set(key, howl);
      return howl;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[AudioManager] Failed to initialize Howl for "${key}":`, err);
      }
      return null;
    }
  }

  /**
   * Plays a celestial sound by key with setting checks, autoplay guards, and fallbacks.
   */
  public play(key: SoundKey, options?: { volume?: number }): void {
    if (typeof window === "undefined") return;

    try {
      const { soundEnabled, calmMode } = useUIStore.getState();

      // 1. Check Master Mute Setting
      if (!soundEnabled) return;

      // 2. Check Calm Mode: non-essential sounds are silenced
      const cfg = SOUND_DEFINITIONS[key];
      if (calmMode && cfg && !cfg.isEssential) return;

      // 3. Autoplay Policy: Never play before first user interaction
      if (!this.hasUserInteracted) {
        if (process.env.NODE_ENV === "development") {
          console.debug(`[AudioManager] Playback of "${key}" skipped: awaiting first user gesture.`);
        }
        return;
      }

      // 4. Retrieve or lazy-load sound instance
      const howl = this.getOrCreateHowl(key);

      if (!howl) {
        // Fallback to procedural Web Audio
        playProceduralFallback(key);
        return;
      }

      if (options?.volume !== undefined) {
        howl.volume(options.volume);
      } else if (cfg) {
        howl.volume(cfg.volume);
      }

      // 5. Play audio safely
      const playId = howl.play();

      if (playId === null) {
        // Play was blocked by browser; invoke fallback
        playProceduralFallback(key);
      }
    } catch {
      // Gracefully catch any unexpected error; attempt procedural fallback without breaking gameplay
      try {
        playProceduralFallback(key);
      } catch {}
    }
  }

  // --- High-level semantic convenience methods ---

  public playCompletion(isCritical: boolean = false): void {
    this.play(isCritical ? "critical" : "completion");
  }

  public playBonus(): void {
    this.play("bonus");
  }

  public playCritical(): void {
    this.play("critical");
  }

  public playLevelUp(): void {
    this.play("level-up");
  }

  public playStreakShield(): void {
    this.play("shield");
  }

  public playShield(): void {
    this.play("shield");
  }

  public playPurchase(): void {
    this.play("purchase");
  }

  /**
   * For testing or manual unlock triggers.
   */
  public markUserInteracted(): void {
    this.hasUserInteracted = true;
  }

  public isUserInteracted(): boolean {
    return this.hasUserInteracted;
  }
}

export const AudioManager = VivreAudioManager.getInstance();

// Backward compatibility alias for existing components
export const AtlasAudio = AudioManager;
