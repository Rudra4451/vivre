/**
 * Vivre Category Guesser: Deterministic Keyword Matching
 *
 * Infers task category (Body, Mind, Discipline, Craft, Spirit) based on deterministic
 * keyword frequency analysis. Never relies on non-deterministic heuristics.
 */

export type QuestCategory = "Body" | "Mind" | "Discipline" | "Craft" | "Spirit";

export interface CategoryMeta {
  name: QuestCategory;
  baseXp: number;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: string;
}

export const CATEGORY_METAS: Record<QuestCategory, CategoryMeta> = Object.freeze({
  Body: {
    name: "Body",
    baseXp: 10,
    color: "emerald",
    badgeBg: "bg-emerald-500/10",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-400",
    icon: "⚡",
  },
  Mind: {
    name: "Mind",
    baseXp: 10,
    color: "sky",
    badgeBg: "bg-sky-500/10",
    badgeBorder: "border-sky-500/30",
    badgeText: "text-sky-400",
    icon: "✦",
  },
  Discipline: {
    name: "Discipline",
    baseXp: 12,
    color: "violet",
    badgeBg: "bg-violet-500/10",
    badgeBorder: "border-violet-500/30",
    badgeText: "text-violet-400",
    icon: "◈",
  },
  Craft: {
    name: "Craft",
    baseXp: 12,
    color: "amber",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30",
    badgeText: "text-amber-400",
    icon: "⚒",
  },
  Spirit: {
    name: "Spirit",
    baseXp: 10,
    color: "rose",
    badgeBg: "bg-rose-500/10",
    badgeBorder: "border-rose-500/30",
    badgeText: "text-rose-400",
    icon: "✧",
  },
});

export const CATEGORY_KEYWORDS: Record<QuestCategory, readonly string[]> = Object.freeze({
  Body: [
    "run", "jog", "walk", "workout", "gym", "exercise", "pushup", "pullup",
    "stretch", "squat", "cardio", "swim", "lift", "yoga", "sleep", "water",
    "meal", "diet", "hike", "cycle", "bike", "train", "fit", "fast", "eat",
    "breakfast", "lunch", "dinner", "weight", "muscle", "sport", "soccer",
    "tennis", "basketball", "dance", "pilates", "hydrate", "running"
  ],
  Mind: [
    "read", "book", "study", "learn", "puzzle", "chess", "reflect",
    "journal", "research", "review", "think", "memory", "course", "lecture",
    "podcast", "quiz", "exam", "math", "science", "neuroscience", "philosophy",
    "history", "notes", "article", "analyze", "vocabulary", "language", "reading",
    "audiobook", "brain", "intellect"
  ],
  Discipline: [
    "wake", "morning", "alarm", "bed", "tidy", "clean", "habit", "organize",
    "schedule", "plan", "budget", "chores", "email", "inbox", "focus",
    "pomodoro", "no-phone", "routine", "laundry", "dishes", "trash",
    "finance", "bill", "track", "calendar", "checklist", "declutter", "punctual"
  ],
  Craft: [
    "code", "program", "dev", "build", "write", "design", "paint", "draw",
    "project", "feature", "refactor", "compose", "commit", "create", "guitar",
    "piano", "art", "craft", "prototype", "script", "bug", "deploy", "css",
    "html", "ts", "js", "react", "figma", "wireframe", "sculpt", "music",
    "draft", "editing", "illustration"
  ],
  Spirit: [
    "pray", "prayer", "breath", "breathe", "breathwork", "breathing", "gratitude",
    "thank", "nature", "sunset", "sunrise", "volunteer", "donate",
    "silence", "family", "connect", "help", "peace", "temple", "church", "mosque",
    "meditate", "meditation", "calm", "forest", "sky", "mindful", "mindfulness", "kindness"
  ],
});

/**
 * Deterministically guesses the best-fit category based on keyword frequencies.
 */
export function guessCategory(title: string): QuestCategory {
  if (!title || typeof title !== "string") {
    return "Discipline";
  }

  // Normalize and extract words
  const normalized = title.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "Discipline";
  }

  const scores: Record<QuestCategory, number> = {
    Body: 0,
    Mind: 0,
    Discipline: 0,
    Craft: 0,
    Spirit: 0,
  };

  for (const word of words) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [QuestCategory, readonly string[]][]) {
      if (keywords.includes(word)) {
        scores[category] += 1;
      }
    }
  }

  // Find category with highest score (standard precedence: Body, Mind, Spirit, Craft, Discipline)
  let bestCategory: QuestCategory = "Discipline";
  let maxScore = 0;

  const categories: QuestCategory[] = ["Body", "Mind", "Spirit", "Craft", "Discipline"];
  for (const cat of categories) {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      bestCategory = cat;
    }
  }

  return bestCategory;
}
