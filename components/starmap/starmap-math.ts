import type { QuestCategory } from "@/lib/game/category-guesser";
import type {
  NormalizedAttribute,
  ConstellationData,
  StarNodeData,
} from "./types";

export const CATEGORY_COLORS: Record<QuestCategory, { primary: string; hex: string }> = {
  Body: { primary: "emerald", hex: "#10b981" },
  Mind: { primary: "sky", hex: "#38bdf8" },
  Discipline: { primary: "violet", hex: "#a78bfa" },
  Craft: { primary: "amber", hex: "#f59e0b" },
  Spirit: { primary: "rose", hex: "#fb7185" },
};

export const CATEGORY_ICONS: Record<QuestCategory, string> = {
  Body: "⚡",
  Mind: "✦",
  Discipline: "◈",
  Craft: "⚒",
  Spirit: "✧",
};

/**
 * Checks if WebGL / WebGL2 is supported in the current environment without leaking context.
 */
export function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

/**
 * Pure normalization of server-derived attribute data into a structured record.
 * Target default milestone: 50 attribute points per rank.
 */
export function normalizeAttributes(
  rawAttributes?: Array<{ name: string; value: number }> | Record<string, number>,
  targetPerRank: number = 50
): Record<QuestCategory, NormalizedAttribute> {
  const categories: QuestCategory[] = ["Body", "Mind", "Discipline", "Craft", "Spirit"];
  const valueMap: Record<QuestCategory, number> = {
    Body: 0,
    Mind: 0,
    Discipline: 0,
    Craft: 0,
    Spirit: 0,
  };

  if (Array.isArray(rawAttributes)) {
    for (const item of rawAttributes) {
      const match = categories.find(
        (c) => c.toLowerCase() === item.name.trim().toLowerCase()
      );
      if (match) {
        valueMap[match] = Number(item.value) || 0;
      }
    }
  } else if (rawAttributes && typeof rawAttributes === "object") {
    for (const [key, val] of Object.entries(rawAttributes)) {
      const match = categories.find(
        (c) => c.toLowerCase() === key.trim().toLowerCase()
      );
      if (match) {
        valueMap[match] = Number(val) || 0;
      }
    }
  }

  const result = {} as Record<QuestCategory, NormalizedAttribute>;

  for (const cat of categories) {
    const value = valueMap[cat];
    const progressPercent = Math.min(100, Math.max(0, Math.round((value / targetPerRank) * 100)));
    // Minimum 1 star ignited if value >= 1, all 5 ignited if value >= targetPerRank
    const starsIgnited =
      value >= targetPerRank
        ? 5
        : value <= 0
        ? 0
        : Math.min(4, Math.max(1, Math.ceil((value / targetPerRank) * 5)));

    result[cat] = {
      name: cat,
      value,
      target: targetPerRank,
      progressPercent,
      starsIgnited,
      isMastered: value >= targetPerRank,
      colorHex: CATEGORY_COLORS[cat].hex,
      badgeText: CATEGORY_COLORS[cat].primary,
      icon: CATEGORY_ICONS[cat],
      anchorPosition: CONSTELLATION_CONFIGS[cat].anchor,
    };
  }

  return result;
}

const CONSTELLATION_CONFIGS: Record<
  QuestCategory,
  {
    anchor: [number, number, number];
    offsets: [number, number, number][];
    edges: [number, number][];
  }
> = {
  Body: {
    anchor: [-1.3, 0.7, 1.1],
    offsets: [
      [0, 0, 0], // Star 0: Major Luminary
      [-0.4, 0.4, -0.3], // Star 1
      [0.2, 0.5, -0.4], // Star 2
      [-0.3, -0.5, 0.2], // Star 3
      [0.3, -0.6, 0.3], // Star 4
    ],
    edges: [
      [0, 1],
      [1, 2],
      [0, 3],
      [0, 4],
      [3, 4],
    ],
  },
  Mind: {
    anchor: [1.3, 0.7, 1.1],
    offsets: [
      [0, 0, 0], // Star 0: Major Luminary
      [0.3, 0.5, -0.3], // Star 1
      [-0.3, 0.6, -0.2], // Star 2
      [0.4, -0.5, 0.2], // Star 3
      [-0.2, -0.6, 0.3], // Star 4
    ],
    edges: [
      [0, 1],
      [0, 2],
      [1, 2],
      [0, 3],
      [3, 4],
    ],
  },
  Discipline: {
    anchor: [0.0, 1.7, 0.5],
    offsets: [
      [0, 0, 0], // Star 0: Major Luminary
      [-0.4, 0.3, -0.3], // Star 1
      [0.4, 0.3, -0.3], // Star 2
      [-0.5, -0.4, 0.2], // Star 3
      [0.5, -0.4, 0.2], // Star 4
    ],
    edges: [
      [1, 2],
      [1, 0],
      [2, 0],
      [0, 3],
      [0, 4],
    ],
  },
  Craft: {
    anchor: [1.2, -0.8, 1.0],
    offsets: [
      [0, 0, 0], // Star 0: Major Luminary
      [0.3, -0.4, -0.3], // Star 1
      [-0.4, -0.5, -0.2], // Star 2
      [0.3, 0.4, 0.2], // Star 3
      [-0.4, 0.4, 0.1], // Star 4
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
      [0, 4],
    ],
  },
  Spirit: {
    anchor: [-1.2, -0.8, 1.0],
    offsets: [
      [0, 0, 0], // Star 0: Major Luminary
      [-0.3, -0.4, -0.3], // Star 1
      [0.4, -0.5, -0.2], // Star 2
      [-0.3, 0.4, 0.2], // Star 3
      [0.5, 0.4, 0.2], // Star 4
    ],
    edges: [
      [0, 1],
      [1, 2],
      [2, 0],
      [0, 3],
      [3, 4],
    ],
  },
};

/**
 * Builds the constellation 3D spatial definitions and star nodes.
 */
export function buildConstellationsData(
  normalized: Record<QuestCategory, NormalizedAttribute>
): ConstellationData[] {
  const categories: QuestCategory[] = ["Body", "Mind", "Discipline", "Craft", "Spirit"];

  return categories.map((cat) => {
    const attr = normalized[cat];
    const cfg = CONSTELLATION_CONFIGS[cat];

    const stars: StarNodeData[] = cfg.offsets.map((offset, idx) => {
      const position: [number, number, number] = [
        cfg.anchor[0] + offset[0],
        cfg.anchor[1] + offset[1],
        cfg.anchor[2] + offset[2],
      ];

      const isMajor = idx === 0;
      // Star is ignited if idx is within the ignited count
      const isIgnited = idx < attr.starsIgnited;

      return {
        id: `${cat}-star-${idx}`,
        position,
        isMajor,
        isIgnited,
        colorHex: attr.colorHex,
        name: isMajor ? `${cat} Prime Luminary` : `${cat} Node ${idx}`,
      };
    });

    return {
      category: cat,
      attribute: attr,
      stars,
      edges: cfg.edges,
    };
  });
}

/**
 * Generates an accessible, complete text description for assistive technologies.
 */
export function generateAccessibilityDescription(
  level: number = 1,
  normalized: Record<QuestCategory, NormalizedAttribute>
): string {
  const categories: QuestCategory[] = ["Body", "Mind", "Discipline", "Craft", "Spirit"];
  const attrSummaries = categories
    .map((c) => {
      const a = normalized[c];
      return `${a.name}: ${a.value} points (${a.starsIgnited} of 5 stars forged, ${a.progressPercent}% complete)`;
    })
    .join("; ");

  return `Personal Celestial Star Atlas. Overall Pilot Level: ${level}. Five Attribute Alignments: ${attrSummaries}. Chart represents spatial progression in 3D celestial sphere coordinates.`;
}
