import type { QuestCategory } from "@/lib/game/category-guesser";

export interface NormalizedAttribute {
  name: QuestCategory;
  value: number;
  target: number;
  progressPercent: number; // 0 to 100
  starsIgnited: number; // 0 to 5
  isMastered: boolean;
  colorHex: string;
  badgeText: string;
  icon: string;
  anchorPosition: [number, number, number];
}

export interface StarNodeData {
  id: string;
  position: [number, number, number];
  isMajor: boolean;
  isIgnited: boolean;
  colorHex: string;
  name: string;
}

export interface ConstellationData {
  category: QuestCategory;
  attribute: NormalizedAttribute;
  stars: StarNodeData[];
  edges: [number, number][]; // pairs of indices into stars
}

export interface StarAtlasTelemetry {
  triangles: number;
  drawCalls: number;
  geometries: number;
  textures: number;
  invalidations: number;
  dpr: number;
  frameloop: "demand";
  isMobile: boolean;
}

export interface StarMapProps {
  attributes?: Array<{ name: string; value: number }> | Record<string, number>;
  level?: number;
  currentXp?: number;
  xpToNext?: number;
  username?: string;
  className?: string;
  onSelectConstellation?: (category: QuestCategory) => void;
}
