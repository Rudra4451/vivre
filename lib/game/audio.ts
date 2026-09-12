import { useUIStore } from "./store";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Procedural harmonic sound engine for Constellation Atlas.
 * Synthesizes restrained celestial chimes directly in the browser with 0 asset latency.
 */
export const AtlasAudio = {
  /**
   * Play completion chime: restrained double-tone for normal, resonant chord for critical.
   */
  playCompletion: (isCritical = false) => {
    const { soundEnabled, calmMode } = useUIStore.getState();
    if (!soundEnabled || calmMode) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    // Normal: 528 Hz -> 660 Hz (Crystalline third)
    // Critical: 528 Hz, 660 Hz, 792 Hz (Full celestial triad with shimmer)
    const frequencies = isCritical ? [528, 660, 792, 1056] : [528, 660];
    const baseVolume = isCritical ? 0.08 : 0.06;

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      // Envelope: snappy attack, smooth organic decay
      const noteStart = now + idx * 0.06;
      noteGain.gain.setValueAtTime(0.0001, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(baseVolume, noteStart + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(
        0.0001,
        noteStart + (isCritical ? 0.6 : 0.4)
      );

      osc.connect(noteGain);
      noteGain.connect(gainNode);

      osc.start(noteStart);
      osc.stop(noteStart + (isCritical ? 0.65 : 0.45));
    });
  },

  /**
   * Play ascension / level-up sound: ascending constellation chord.
   */
  playLevelUp: () => {
    const { soundEnabled, calmMode } = useUIStore.getState();
    if (!soundEnabled || calmMode) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chord = [440, 554.37, 659.25, 830.61, 1108.73]; // A Major 9th celestial chord

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      const noteStart = now + idx * 0.08;
      noteGain.gain.setValueAtTime(0.0001, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(0.09, noteStart + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

      osc.connect(noteGain);
      noteGain.connect(ctx.destination);

      osc.start(noteStart);
      osc.stop(noteStart + 1.25);
    });
  },

  /**
   * Play streak shield activation chime.
   */
  playStreakShield: () => {
    const { soundEnabled, calmMode } = useUIStore.getState();
    if (!soundEnabled || calmMode) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(329.63, now); // E4 warm resonance
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.3); // Ramp to A4

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.85);
  },
};
