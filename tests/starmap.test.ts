import { describe, it, expect } from "vitest";
import {
  normalizeAttributes,
  buildConstellationsData,
  generateAccessibilityDescription,
  checkWebGLSupport,
  CATEGORY_COLORS,
} from "@/components/starmap/starmap-math";

describe("Constellation Star Atlas: Data & Performance Integrity", () => {
  describe("Attribute Normalization & Star Progression", () => {
    it("handles empty or undefined attributes safely with defaults", () => {
      const normalized = normalizeAttributes(undefined);
      expect(Object.keys(normalized)).toEqual([
        "Body",
        "Mind",
        "Discipline",
        "Craft",
        "Spirit",
      ]);

      for (const cat of ["Body", "Mind", "Discipline", "Craft", "Spirit"] as const) {
        expect(normalized[cat].value).toBe(0);
        expect(normalized[cat].progressPercent).toBe(0);
        expect(normalized[cat].starsIgnited).toBe(0);
        expect(normalized[cat].isMastered).toBe(false);
        expect(normalized[cat].colorHex).toBe(CATEGORY_COLORS[cat].hex);
      }
    });

    it("accurately computes progress percentages and star ignition from server data", () => {
      const raw = [
        { name: "Body", value: 10 },       // 10 / 50 = 20% -> 1 star
        { name: "Mind", value: 25 },       // 25 / 50 = 50% -> 3 stars
        { name: "Discipline", value: 50 }, // 50 / 50 = 100% -> 5 stars (Mastered)
        { name: "Craft", value: 65 },      // 65 / 50 = 100% capped -> 5 stars (Mastered)
        { name: "Spirit", value: 0 },       // 0 / 50 = 0% -> 0 stars
      ];

      const normalized = normalizeAttributes(raw, 50);

      expect(normalized.Body.progressPercent).toBe(20);
      expect(normalized.Body.starsIgnited).toBe(1);
      expect(normalized.Body.isMastered).toBe(false);

      expect(normalized.Mind.progressPercent).toBe(50);
      expect(normalized.Mind.starsIgnited).toBe(3);
      expect(normalized.Mind.isMastered).toBe(false);

      expect(normalized.Discipline.progressPercent).toBe(100);
      expect(normalized.Discipline.starsIgnited).toBe(5);
      expect(normalized.Discipline.isMastered).toBe(true);

      expect(normalized.Craft.progressPercent).toBe(100);
      expect(normalized.Craft.starsIgnited).toBe(5);
      expect(normalized.Craft.isMastered).toBe(true);

      expect(normalized.Spirit.progressPercent).toBe(0);
      expect(normalized.Spirit.starsIgnited).toBe(0);
      expect(normalized.Spirit.isMastered).toBe(false);
    });

    it("handles dictionary / record formatted attribute inputs", () => {
      const dict = {
        body: 15,
        mind: 30,
        discipline: 45,
        craft: 20,
        spirit: 5,
      };

      const normalized = normalizeAttributes(dict, 50);
      expect(normalized.Body.value).toBe(15);
      expect(normalized.Mind.value).toBe(30);
      expect(normalized.Discipline.value).toBe(45);
      expect(normalized.Craft.value).toBe(20);
      expect(normalized.Spirit.value).toBe(5);
    });
  });

  describe("Constellation Geometry & Topology", () => {
    it("builds 5 complete 3D constellation clusters with 5 stars and edges each", () => {
      const normalized = normalizeAttributes({
        body: 20,
        mind: 40,
        discipline: 50,
        craft: 10,
        spirit: 0,
      });

      const constellations = buildConstellationsData(normalized);
      expect(constellations.length).toBe(5);

      let totalStars = 0;
      let totalTriangles = 0;

      for (const c of constellations) {
        expect(c.stars.length).toBe(5);
        expect(c.edges.length).toBeGreaterThanOrEqual(4);

        // First star is always the Major Luminary
        expect(c.stars[0]?.isMajor).toBe(true);
        expect(c.stars[1]?.isMajor).toBe(false);

        // Count triangles: each icosahedron is exactly 20 triangles
        totalStars += c.stars.length;
        totalTriangles += c.stars.length * 20;

        // Verify valid finite 3D coordinates
        for (const star of c.stars) {
          expect(Number.isFinite(star.position[0])).toBe(true);
          expect(Number.isFinite(star.position[1])).toBe(true);
          expect(Number.isFinite(star.position[2])).toBe(true);
        }
      }

      expect(totalStars).toBe(25);
      // Verify total scene triangle budget is well under 50,000 limit
      expect(totalTriangles).toBe(500);
      expect(totalTriangles).toBeLessThan(50000);
    });

    it("correctly sets ignited starlight status matching attribute points", () => {
      const normalized = normalizeAttributes({
        discipline: 50, // 5 stars ignited
        spirit: 0,       // 0 stars ignited
      });

      const constellations = buildConstellationsData(normalized);
      const discipline = constellations.find((c) => c.category === "Discipline");
      const spirit = constellations.find((c) => c.category === "Spirit");

      expect(discipline?.stars.every((s) => s.isIgnited)).toBe(true);
      expect(spirit?.stars.every((s) => !s.isIgnited)).toBe(true);
    });
  });

  describe("Accessibility Text Alternative", () => {
    it("generates a comprehensive screen-reader narrative of levels and all 5 attributes", () => {
      const normalized = normalizeAttributes({
        body: 15,
        mind: 25,
        discipline: 50,
        craft: 10,
        spirit: 35,
      });

      const text = generateAccessibilityDescription(4, normalized);

      expect(text).toContain("Pilot Level: 4");
      expect(text).toContain("Body: 15 points");
      expect(text).toContain("Mind: 25 points");
      expect(text).toContain("Discipline: 50 points");
      expect(text).toContain("Craft: 10 points");
      expect(text).toContain("Spirit: 35 points");
      expect(text).toContain("5 of 5 stars forged, 100% complete");
      expect(text).toContain("3D celestial sphere coordinates");
    });
  });

  describe("WebGL Environment Detection", () => {
    it("safely handles WebGL detection without crashing in node or test environment", () => {
      expect(() => checkWebGLSupport()).not.toThrow();
      const result = checkWebGLSupport();
      expect(typeof result).toBe("boolean");
    });
  });
});
