import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeeklyChallengeWithProgress, WeeklyChallenge, WeeklyChallengeProgress } from "@/types";

/**
 * Calculates current ISO week number and bounding UTC timestamps.
 */
export function getCurrentWeekBounds(): {
  weekNumber: number;
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const day = now.getUTCDay(); // 0 is Sun, 1 is Mon...
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday

  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0));
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Approximate ISO week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  return {
    weekNumber,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

/**
 * Ensures weekly challenges exist for the active week and loads them with authoritative user progress.
 */
export async function getAuthoritativeWeeklyChallenges(
  supabase: SupabaseClient,
  userId: string
): Promise<WeeklyChallengeWithProgress[]> {
  const { weekNumber, startDate, endDate } = getCurrentWeekBounds();

  // 1. Fetch active weekly challenges
  let { data: challenges, error } = await supabase
    .from("weekly_challenges")
    .select("*")
    .eq("is_active", true)
    .order("target_count", { ascending: true });

  if (error || !challenges || challenges.length === 0) {
    // If table is unpopulated, create default weekly challenges
    const defaultTemplates = [
      {
        week_number: weekNumber,
        week_start_date: startDate,
        week_end_date: endDate,
        title: "Way of Discipline",
        description: "Complete 5 Discipline quests to reinforce habits.",
        requirement_type: "category_count",
        target_category: "Discipline",
        target_count: 5,
        reward_rare_currency: 15,
        is_active: true,
      },
      {
        week_number: weekNumber,
        week_start_date: startDate,
        week_end_date: endDate,
        title: "Scholastic Ascent",
        description: "Complete 4 Mind quests to expand intellectual territory.",
        requirement_type: "category_count",
        target_category: "Mind",
        target_count: 4,
        reward_rare_currency: 12,
        is_active: true,
      },
      {
        week_number: weekNumber,
        week_start_date: startDate,
        week_end_date: endDate,
        title: "Astral Expedition",
        description: "Complete 7 total quests across any discipline quadrant.",
        requirement_type: "total_count",
        target_category: null,
        target_count: 7,
        reward_rare_currency: 20,
        is_active: true,
      },
    ];

    const { data: inserted } = await supabase
      .from("weekly_challenges")
      .insert(defaultTemplates)
      .select();

    challenges = inserted || [];
  }

  // 2. Fetch user's completion history for this week
  const { data: completions } = await supabase
    .from("task_completions")
    .select("category, completed_at")
    .eq("user_id", userId)
    .gte("completed_at", startDate);

  // 3. Fetch user's challenge progress claims
  const { data: progressRecords } = await supabase
    .from("weekly_challenge_progress")
    .select("*")
    .eq("user_id", userId);

  const progressMap = new Map<string, WeeklyChallengeProgress>();
  if (progressRecords) {
    for (const pr of progressRecords) {
      progressMap.set(pr.challenge_id, pr as WeeklyChallengeProgress);
    }
  }

  // 4. Combine authoritative completions with challenge definitions
  return (challenges as WeeklyChallenge[]).map((ch) => {
    const existing = progressMap.get(ch.id);

    let count = 0;
    if (completions) {
      if (ch.requirement_type === "category_count") {
        count = completions.filter(
          (c) => c.category?.toLowerCase() === ch.target_category?.toLowerCase()
        ).length;
      } else {
        count = completions.length;
      }
    }

    const completed = count >= ch.target_count;
    const claimed = Boolean(existing?.claimed);
    const percent = Math.min(100, Math.round((count / ch.target_count) * 100));

    return {
      ...ch,
      current_count: count,
      completed,
      claimed,
      percent,
    };
  });
}
