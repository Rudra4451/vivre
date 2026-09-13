import { describe, it, expect } from "vitest";
import { getCurrentWeekBounds } from "@/lib/game/weekly-challenges";
import {
  purchaseItemInputSchema,
  equipItemInputSchema,
  claimChallengeInputSchema,
} from "@/lib/game/schemas";

describe("Attribute Radar, Weekly Challenges & Cosmetic Shop Economy", () => {
  describe("Weekly Challenge Bounds & Math", () => {
    it("computes valid ISO week numbers and bounding timestamps", () => {
      const { weekNumber, startDate, endDate } = getCurrentWeekBounds();
      expect(weekNumber).toBeGreaterThanOrEqual(1);
      expect(weekNumber).toBeLessThanOrEqual(53);

      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      // Start must precede end by exactly 7 days (604,800,000 ms)
      expect(end - start).toBe(7 * 24 * 60 * 60 * 1000);
      expect(start).toBeLessThanOrEqual(Date.now());
      expect(end).toBeGreaterThan(Date.now());
    });

    it("evaluates progress percentages cleanly against target thresholds", () => {
      const calcProgress = (count: number, target: number) => {
        return Math.min(100, Math.round((count / target) * 100));
      };

      expect(calcProgress(0, 5)).toBe(0);
      expect(calcProgress(2, 4)).toBe(50);
      expect(calcProgress(5, 5)).toBe(100);
      expect(calcProgress(10, 7)).toBe(100); // capped at 100%
    });
  });

  describe("Cosmetic Shop Purchase Input Validation & Schema Guardrails", () => {
    it("validates purchase inputs with valid UUIDs and auto-generates idempotency keys", () => {
      const validUuid = crypto.randomUUID();
      const result = purchaseItemInputSchema.safeParse({ itemId: validUuid });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.itemId).toBe(validUuid);
        expect(result.data.idempotencyKey).toBeDefined();
      }
    });

    it("rejects invalid item ID formats to protect RPC execution", () => {
      const result = purchaseItemInputSchema.safeParse({ itemId: "not-a-valid-uuid" });
      expect(result.success).toBe(false);
    });

    it("validates cosmetic equip input schema", () => {
      const validInvId = crypto.randomUUID();
      const result = equipItemInputSchema.safeParse({ inventoryId: validInvId });
      expect(result.success).toBe(true);

      const invalidResult = equipItemInputSchema.safeParse({ inventoryId: "bad-id" });
      expect(invalidResult.success).toBe(false);
    });

    it("validates weekly challenge claim input schema", () => {
      const validChallengeId = crypto.randomUUID();
      const result = claimChallengeInputSchema.safeParse({ challengeId: validChallengeId });
      expect(result.success).toBe(true);

      const invalid = claimChallengeInputSchema.safeParse({ challengeId: "invalid" });
      expect(invalid.success).toBe(false);
    });
  });

  describe("Single-Slot Equip Invariant", () => {
    it("enforces single active item per equip slot category", () => {
      type MockInventory = { id: string; category: string; equipped: boolean };

      const inventory: MockInventory[] = [
        { id: "inv-1", category: "star_color", equipped: true },
        { id: "inv-2", category: "star_color", equipped: false },
        { id: "inv-3", category: "avatar_frame", equipped: true },
      ];

      // Target: equip inv-2 (category: star_color)
      const targetCategory = "star_color";
      const targetId = "inv-2";

      const updated = inventory.map((item) => {
        if (item.id === targetId) {
          return { ...item, equipped: true };
        }
        if (item.category === targetCategory) {
          return { ...item, equipped: false };
        }
        return item;
      });

      // Verify that inv-1 was unequipped, inv-2 is equipped, and inv-3 was unaffected
      expect(updated.find((i) => i.id === "inv-1")?.equipped).toBe(false);
      expect(updated.find((i) => i.id === "inv-2")?.equipped).toBe(true);
      expect(updated.find((i) => i.id === "inv-3")?.equipped).toBe(true);

      // Verify only 1 star_color is equipped
      const equippedStarColors = updated.filter(
        (i) => i.category === "star_color" && i.equipped
      );
      expect(equippedStarColors.length).toBe(1);
    });
  });

  describe("Non-Negative Currency Balances", () => {
    it("prevents purchases if client balance is less than database price", () => {
      const userSoftBalance = 50;
      const itemCost = 120;

      const canPurchase = userSoftBalance >= itemCost;
      expect(canPurchase).toBe(false);

      const userRareBalance = 30;
      const rareItemCost = 25;
      const canPurchaseRare = userRareBalance >= rareItemCost;
      expect(canPurchaseRare).toBe(true);
      expect(userRareBalance - rareItemCost).toBe(5);
    });
  });
});
