import type {
  TrophyDefinition,
  TrophyWithProgress,
  UserProfile,
  Attribute,
  UserTrophy,
} from "@/types";

export const TROPHY_DEFINITIONS: TrophyDefinition[] = [
  {
    id: "first_starlight",
    title: "First Light",
    subtitle: "Inaugural ignition",
    description: "Complete your first celestial directive and record your initial stellar node.",
    tier: "astral",
    icon: "sparkles",
    category: "progression",
    targetValue: 1,
  },
  {
    id: "streak_three",
    title: "Triad Alignment",
    subtitle: "Rhythmic momentum",
    description: "Sustain an active expedition streak across 3 consecutive stellar cycles.",
    tier: "astral",
    icon: "flame",
    category: "streak",
    targetValue: 3,
  },
  {
    id: "streak_seven",
    title: "Seven Suns Alignment",
    subtitle: "Authoritative orbit",
    description: "Complete directives every day for 7 consecutive solar days without faltering.",
    tier: "solar",
    icon: "sun",
    category: "streak",
    targetValue: 7,
  },
  {
    id: "directives_ten",
    title: "Constellation Cartographer",
    subtitle: "Pattern recognition",
    description: "Complete 10 total celestial directives across any disciplinary aspect.",
    tier: "lunar",
    icon: "compass",
    category: "exploration",
    targetValue: 10,
  },
  {
    id: "directives_twenty_five",
    title: "Master of the Atlas",
    subtitle: "Major constellation charted",
    description: "Complete 25 total celestial directives, binding extensive star charts together.",
    tier: "solar",
    icon: "globe",
    category: "exploration",
    targetValue: 25,
  },
  {
    id: "level_five",
    title: "Wayfinder",
    subtitle: "Ascendant rank",
    description: "Gather sufficient starlight experience to attain Explorer Level 5.",
    tier: "lunar",
    icon: "shield-star",
    category: "progression",
    targetValue: 5,
  },
  {
    id: "level_ten",
    title: "Astral Sovereign",
    subtitle: "Zenith zenith",
    description: "Attain Explorer Level 10 through relentless celestial focus and mastery.",
    tier: "celestial",
    icon: "crown",
    category: "progression",
    targetValue: 10,
  },
  {
    id: "aspect_harmony",
    title: "Celestial Harmony",
    subtitle: "Five-fold discipline symmetry",
    description: "Attain 25+ points in all 5 aspects: Body, Mind, Discipline, Craft, and Spirit.",
    tier: "celestial",
    icon: "pentagon",
    category: "mastery",
    targetValue: 5,
  },
  {
    id: "bazaar_patron",
    title: "Starlight Collector",
    subtitle: "Cosmetic acquisition",
    description: "Acquire an astral artifact or visual aesthetic from the Starlight Bazaar.",
    tier: "astral",
    icon: "gem",
    category: "exploration",
    targetValue: 1,
  },
  {
    id: "zenith_voyager",
    title: "Zenith Voyager",
    subtitle: "Weekly directive fulfilled",
    description: "Successfully fulfill a multi-day weekly challenge before the sector resets.",
    tier: "solar",
    icon: "trophy",
    category: "mastery",
    targetValue: 1,
  },
];

export interface TrophyEvaluationContext {
  profile?: UserProfile | null;
  attributes?: Attribute[] | null;
  totalCompletionsCount: number;
  inventoryCount: number;
  completedChallengesCount: number;
  persistedTrophies?: UserTrophy[];
}

/**
 * Deterministically evaluates player progress toward all trophies.
 * Zero-drift, server-authoritative calculation.
 */
export function evaluateTrophies(context: TrophyEvaluationContext): TrophyWithProgress[] {
  const {
    profile,
    attributes = [],
    totalCompletionsCount = 0,
    inventoryCount = 0,
    completedChallengesCount = 0,
    persistedTrophies = [],
  } = context;

  const persistedMap = new Map<string, string>();
  for (const pt of persistedTrophies) {
    persistedMap.set(pt.trophy_id, pt.unlocked_at);
  }

  // Count attributes >= 25 points
  const balancedAttributesCount = (attributes || []).filter(
    (attr) => (attr.value ?? 0) >= 25
  ).length;

  return TROPHY_DEFINITIONS.map((def) => {
    let currentValue = 0;

    switch (def.id) {
      case "first_starlight":
        currentValue = totalCompletionsCount;
        break;
      case "streak_three":
        currentValue = Math.max(profile?.current_streak ?? 0, profile?.longest_streak ?? 0);
        break;
      case "streak_seven":
        currentValue = Math.max(profile?.current_streak ?? 0, profile?.longest_streak ?? 0);
        break;
      case "directives_ten":
        currentValue = totalCompletionsCount;
        break;
      case "directives_twenty_five":
        currentValue = totalCompletionsCount;
        break;
      case "level_five":
        currentValue = profile?.level ?? 1;
        break;
      case "level_ten":
        currentValue = profile?.level ?? 1;
        break;
      case "aspect_harmony":
        currentValue = balancedAttributesCount;
        break;
      case "bazaar_patron":
        currentValue = inventoryCount;
        break;
      case "zenith_voyager":
        currentValue = completedChallengesCount;
        break;
      default:
        currentValue = 0;
    }

    const isQualified = currentValue >= def.targetValue;
    const persistedDate = persistedMap.get(def.id) ?? null;
    const isUnlocked = isQualified || !!persistedDate;
    const unlockedAt = persistedDate ?? (isQualified ? new Date().toISOString() : null);

    const progressPercent = isUnlocked
      ? 100
      : Math.min(100, Math.max(0, Math.round((currentValue / def.targetValue) * 100)));

    return {
      ...def,
      isUnlocked,
      unlockedAt,
      currentValue,
      progressPercent,
    };
  });
}

export interface TrophySummary {
  totalCount: number;
  unlockedCount: number;
  percentUnlocked: number;
  celestialCount: number;
  celestialUnlocked: number;
}

export function getTrophySummary(trophies: TrophyWithProgress[]): TrophySummary {
  const totalCount = trophies.length;
  const unlockedCount = trophies.filter((t) => t.isUnlocked).length;
  const percentUnlocked = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const celestialTrophies = trophies.filter((t) => t.tier === "celestial");
  const celestialUnlocked = celestialTrophies.filter((t) => t.isUnlocked).length;

  return {
    totalCount,
    unlockedCount,
    percentUnlocked,
    celestialCount: celestialTrophies.length,
    celestialUnlocked,
  };
}
