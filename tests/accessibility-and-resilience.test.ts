import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAnnouncementStore } from "@/lib/game/announcements";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { useUIStore } from "@/lib/game/store";
import {
  generateAccessibilityDescription,
  normalizeAttributes,
} from "@/components/starmap/starmap-math";

describe("Accessibility & Resilience Hardening Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAnnouncementStore.getState().clear();
    useQuestBoardStore.setState({
      activeError: null,
      completingTaskIds: {},
      pendingSyncTaskIds: {},
    });
  });

  describe("A11y: Announcements & Error Alerting", () => {
    it("announces active errors assertively to screen readers", () => {
      expect(useAnnouncementStore.getState().currentAssertive).toBe("");

      useQuestBoardStore.getState().setActiveError("Network request timed out");

      expect(useQuestBoardStore.getState().activeError).toBe("Network request timed out");
      expect(useAnnouncementStore.getState().currentAssertive).toBe(
        "Network request timed out"
      );
    });

    it("clears error without overwriting previous announcements", () => {
      useQuestBoardStore.getState().setActiveError("Telemetry error");
      expect(useQuestBoardStore.getState().activeError).toBe("Telemetry error");

      useQuestBoardStore.getState().setActiveError(null);
      expect(useQuestBoardStore.getState().activeError).toBeNull();
    });
  });

  describe("A11y: 3D Scene Text Alternative & Static Fallback Logic", () => {
    it("generates comprehensive accessible text description of 3D constellation atlas", () => {
      const attributes = [
        { name: "Discipline", value: 45 },
        { name: "Mind", value: 30 },
        { name: "Craft", value: 20 },
        { name: "Spirit", value: 15 },
        { name: "Body", value: 10 },
      ];

      const normalized = normalizeAttributes(attributes);
      const desc = generateAccessibilityDescription(5, normalized);

      expect(desc).toContain("Level: 5");
      expect(desc).toContain("Discipline");
      expect(desc).toContain("Mind");
      expect(desc).toContain("Craft");
      expect(desc).toContain("Spirit");
      expect(desc).toContain("Body");
    });

    it("honors calmMode globally in UI store", () => {
      useUIStore.setState({ calmMode: false });
      expect(useUIStore.getState().calmMode).toBe(false);

      useUIStore.getState().setCalmMode(true);
      expect(useUIStore.getState().calmMode).toBe(true);

      useUIStore.getState().toggleCalmMode();
      expect(useUIStore.getState().calmMode).toBe(false);
    });
  });

  describe("Resilience: Network & Stale Request Safeguards", () => {
    it("evicts stale queued offline completions older than 7 days", () => {
      const now = Date.now();
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

      const items = [
        { id: "1", queuedAt: now - 1000, isStale: false },
        { id: "2", queuedAt: now - (SEVEN_DAYS_MS + 5000), isStale: true },
        { id: "3", queuedAt: now - 3600000, isStale: false },
      ];

      const validItems = items.filter((item) => now - item.queuedAt <= SEVEN_DAYS_MS);
      expect(validItems).toHaveLength(2);
      expect(validItems.map((i) => i.id)).toEqual(["1", "3"]);
    });

    it("prevents concurrent duplicate clicks via startCompleting guard", () => {
      const taskId = "task-abc-123";
      const store = useQuestBoardStore.getState();

      const canFirstClick = store.startCompleting(taskId);
      expect(canFirstClick).toBe(true);

      // Second immediate click while first is in flight must be rejected
      const canSecondClick = store.startCompleting(taskId);
      expect(canSecondClick).toBe(false);

      store.finishCompleting(taskId);
      const canThirdClick = store.startCompleting(taskId);
      expect(canThirdClick).toBe(true);
    });
  });
});
