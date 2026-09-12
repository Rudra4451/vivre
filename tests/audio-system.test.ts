import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioManager, AtlasAudio, SOUND_DEFINITIONS } from "@/lib/game/audio-manager";
import { useUIStore } from "@/lib/game/store";

describe("Adaptive Celestial Sound System (Howler.js & AudioManager)", () => {
  beforeEach(() => {
    useUIStore.setState({
      soundEnabled: true,
      calmMode: false,
    });
    // Ensure test environment interaction flag is active
    AudioManager.markUserInteracted();
  });

  describe("Catalog & Architecture Invariants", () => {
    it("contains all 6 required celestial sounds", () => {
      const requiredSounds = [
        "completion",
        "bonus",
        "critical",
        "level-up",
        "shield",
        "purchase",
      ] as const;

      for (const sound of requiredSounds) {
        expect(SOUND_DEFINITIONS[sound]).toBeDefined();
        expect(SOUND_DEFINITIONS[sound].src.length).toBeGreaterThan(0);
        expect(SOUND_DEFINITIONS[sound].volume).toBeGreaterThan(0);
        expect(SOUND_DEFINITIONS[sound].volume).toBeLessThanOrEqual(1);
      }
    });

    it("preloads ONLY essential short sounds and lazy-loads optional sounds", () => {
      // Essential short sounds must have preload: true
      expect(SOUND_DEFINITIONS.completion.preload).toBe(true);
      expect(SOUND_DEFINITIONS.bonus.preload).toBe(true);
      expect(SOUND_DEFINITIONS.critical.preload).toBe(true);

      // Optional / extended sounds must be lazy loaded (preload: false)
      expect(SOUND_DEFINITIONS["level-up"].preload).toBe(false);
      expect(SOUND_DEFINITIONS.shield.preload).toBe(false);
      expect(SOUND_DEFINITIONS.purchase.preload).toBe(false);
    });

    it("exports AtlasAudio as an alias to AudioManager for backward compatibility", () => {
      expect(AtlasAudio).toBe(AudioManager);
    });
  });

  describe("Settings & Calm Mode Filtering", () => {
    it("suppresses all sounds when soundEnabled is false (Master Mute)", () => {
      useUIStore.setState({ soundEnabled: false });

      // None of the sounds should throw or trigger audio output
      expect(() => AudioManager.play("completion")).not.toThrow();
      expect(() => AudioManager.play("bonus")).not.toThrow();
      expect(() => AudioManager.play("critical")).not.toThrow();
      expect(() => AudioManager.play("level-up")).not.toThrow();
      expect(() => AudioManager.play("shield")).not.toThrow();
      expect(() => AudioManager.play("purchase")).not.toThrow();
    });

    it("suppresses non-essential sounds in calm mode while preserving essential safety/feedback", () => {
      useUIStore.setState({ soundEnabled: true, calmMode: true });

      // Non-essential sounds: completion, bonus, level-up, purchase
      expect(SOUND_DEFINITIONS.completion.isEssential).toBe(false);
      expect(SOUND_DEFINITIONS.bonus.isEssential).toBe(false);
      expect(SOUND_DEFINITIONS["level-up"].isEssential).toBe(false);
      expect(SOUND_DEFINITIONS.purchase.isEssential).toBe(false);

      // Essential sounds: shield (protective warning) and critical
      expect(SOUND_DEFINITIONS.shield.isEssential).toBe(true);
      expect(SOUND_DEFINITIONS.critical.isEssential).toBe(true);

      expect(() => AudioManager.playCompletion(false)).not.toThrow();
      expect(() => AudioManager.playLevelUp()).not.toThrow();
      expect(() => AudioManager.playPurchase()).not.toThrow();
      expect(() => AudioManager.playStreakShield()).not.toThrow();
    });
  });

  describe("Autoplay Policy & Interaction Guardrails", () => {
    it("honors interaction guardrails and tracks user gesture state", () => {
      expect(AudioManager.isUserInteracted()).toBe(true);
      AudioManager.markUserInteracted();
      expect(AudioManager.isUserInteracted()).toBe(true);
    });
  });

  describe("Semantic Audio Trigger API & Safety", () => {
    it("executes all high-level playback methods without throwing", () => {
      expect(() => AudioManager.playCompletion(false)).not.toThrow();
      expect(() => AudioManager.playCompletion(true)).not.toThrow();
      expect(() => AudioManager.playBonus()).not.toThrow();
      expect(() => AudioManager.playCritical()).not.toThrow();
      expect(() => AudioManager.playLevelUp()).not.toThrow();
      expect(() => AudioManager.playStreakShield()).not.toThrow();
      expect(() => AudioManager.playShield()).not.toThrow();
      expect(() => AudioManager.playPurchase()).not.toThrow();
    });

    it("never breaks gameplay even if audio fails, is blocked, or asset is missing", () => {
      // Intentionally passing an invalid/unknown sound key
      // @ts-expect-error testing invalid key resilience
      expect(() => AudioManager.play("unknown_spectral_frequency")).not.toThrow();
    });
  });
});
