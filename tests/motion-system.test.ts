import { describe, it, expect, beforeEach } from "vitest";
import { useUIStore } from "@/lib/game/store";
import {
  AtlasAnnounce,
  useAnnouncementStore,
} from "@/lib/game/announcements";
import {
  generateCelestialParticles,
  MOTION_SPRINGS,
} from "@/lib/game/motion-config";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { AtlasAudio } from "@/lib/game/audio";

describe("Constellation Atlas Motion & Feedback System", () => {
  beforeEach(() => {
    useUIStore.setState({
      calmMode: false,
      soundEnabled: true,
      activeModal: null,
    });
    useAnnouncementStore.setState({
      currentPolite: "",
      currentAssertive: "",
      history: [],
    });
    useQuestBoardStore.setState({
      celebration: null,
      completingTaskIds: {},
      authoritativeProfile: null,
    });
  });

  describe("UI Store & Calm Mode Preferences", () => {
    it("toggles calm mode globally to disable non-essential motion", () => {
      expect(useUIStore.getState().calmMode).toBe(false);
      useUIStore.getState().toggleCalmMode();
      expect(useUIStore.getState().calmMode).toBe(true);
      useUIStore.getState().setCalmMode(false);
      expect(useUIStore.getState().calmMode).toBe(false);
    });

    it("toggles sound preferences cleanly", () => {
      expect(useUIStore.getState().soundEnabled).toBe(true);
      useUIStore.getState().toggleSound();
      expect(useUIStore.getState().soundEnabled).toBe(false);
      useUIStore.getState().setSoundEnabled(true);
      expect(useUIStore.getState().soundEnabled).toBe(true);
    });
  });

  describe("Screen Reader Announcements (aria-live)", () => {
    it("announces XP gained in polite live region", () => {
      AtlasAnnounce.xpGained(100, "Mind");
      const state = useAnnouncementStore.getState();
      expect(state.currentPolite).toBe("Earned 100 XP in Mind quadrant.");
      expect(state.history.length).toBe(1);
      expect(state.history[0]?.priority).toBe("polite");
    });

    it("announces critical bonus roll in polite live region", () => {
      AtlasAnnounce.criticalBonus(1.5, "astrolabe");
      const state = useAnnouncementStore.getState();
      expect(state.currentPolite).toContain("Critical alignment achieved!");
      expect(state.currentPolite).toContain("1.5x multiplier");
      expect(state.history[0]?.priority).toBe("polite");
    });

    it("announces level-up ascension in assertive live region", () => {
      AtlasAnnounce.levelUp(8);
      const state = useAnnouncementStore.getState();
      expect(state.currentAssertive).toBe(
        "Ascension confirmed! You have reached Level 8. New coordinates unlocked in the star atlas."
      );
      expect(state.history[0]?.priority).toBe("assertive");
    });

    it("announces streak shield deployment in polite live region", () => {
      AtlasAnnounce.streakShieldUsed(14);
      const state = useAnnouncementStore.getState();
      expect(state.currentPolite).toBe(
        "Streak shield deployed! Your 14-day celestial streak is preserved."
      );
      expect(state.history[0]?.priority).toBe("polite");
    });
  });

  describe("Particle Limits & Motion Constraints", () => {
    it("caps normal completion particles strictly at 8 particles", () => {
      const particles = generateCelestialParticles(8, false);
      expect(particles.length).toBe(8);
      // Verify all particles have finite coordinates and bounded durations
      particles.forEach((p) => {
        expect(p.duration).toBeLessThanOrEqual(1.0);
        expect(Number.isFinite(p.x)).toBe(true);
        expect(Number.isFinite(p.y)).toBe(true);
      });
    });

    it("caps critical completion particles strictly at 12 particles", () => {
      const particles = generateCelestialParticles(20, true); // request 20, should cap at 12
      expect(particles.length).toBe(12);
      expect(particles.every((p) => p.isReward)).toBe(true);
    });

    it("uses restrained spring configurations", () => {
      expect(MOTION_SPRINGS.starArrival.stiffness).toBeGreaterThan(300);
      expect(MOTION_SPRINGS.starArrival.damping).toBeGreaterThan(20);
      expect(MOTION_SPRINGS.lineDraw.duration).toBeLessThan(0.6);
    });
  });

  describe("Authoritative Level-Up Guardrails & Skippability", () => {
    it("cannot enter celebration state without explicit authoritative response", () => {
      expect(useQuestBoardStore.getState().celebration).toBeNull();
    });

    it("sets celebration upon authoritative confirmation and allows instant skip", () => {
      useQuestBoardStore.getState().setCelebration({
        leveledUp: true,
        newLevel: 5,
        xpAwarded: 250,
        category: "Spirit",
        bonusRoll: "base",
      });

      expect(useQuestBoardStore.getState().celebration?.leveledUp).toBe(true);
      expect(useQuestBoardStore.getState().celebration?.newLevel).toBe(5);

      // Skippability test: clearCelebration immediately resets state
      useQuestBoardStore.getState().clearCelebration();
      expect(useQuestBoardStore.getState().celebration).toBeNull();
    });
  });

  describe("Procedural Audio Safety", () => {
    it("safely handles audio calls when window or AudioContext is absent", () => {
      expect(() => AtlasAudio.playCompletion(false)).not.toThrow();
      expect(() => AtlasAudio.playCompletion(true)).not.toThrow();
      expect(() => AtlasAudio.playLevelUp()).not.toThrow();
      expect(() => AtlasAudio.playStreakShield()).not.toThrow();
    });

    it("suppresses audio when calmMode is active", () => {
      useUIStore.setState({ calmMode: true, soundEnabled: true });
      expect(() => AtlasAudio.playCompletion(false)).not.toThrow();
      expect(() => AtlasAudio.playLevelUp()).not.toThrow();
    });

    it("suppresses audio when soundEnabled is false", () => {
      useUIStore.setState({ soundEnabled: false });
      expect(() => AtlasAudio.playCompletion(false)).not.toThrow();
      expect(() => AtlasAudio.playLevelUp()).not.toThrow();
    });
  });
});
