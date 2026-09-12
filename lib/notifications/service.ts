import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { ComebackEmail } from "@/components/emails/ComebackEmail";
import { WeeklyRecapEmail } from "@/components/emails/WeeklyRecapEmail";
import { createUnsubscribeUrl } from "./unsubscribe-token";
import type { Database } from "@/types/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface NotificationBatchResult {
  notificationType: "comeback" | "weekly_recap";
  scannedUsers: number;
  eligibleUsers: number;
  sentCount: number;
  skippedCount: number;
  errors: string[];
}

/**
 * Returns the current calendar date (YYYY-MM-DD) for a given IANA timezone.
 * Gracefully defaults to UTC if timezone string is invalid.
 */
export function getUserLocalDate(
  timezone: string = "Asia/Kolkata",
  date: Date = new Date()
): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    const fallbackFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fallbackFormatter.format(date);
  }
}

/**
 * Computes difference in calendar days between two YYYY-MM-DD dates.
 */
export function getCalendarDayDiff(dateStrA: string, dateStrB: string): number {
  const d1 = new Date(dateStrA + "T00:00:00Z").getTime();
  const d2 = new Date(dateStrB + "T00:00:00Z").getTime();
  return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
}

/**
 * Pure eligibility evaluation for Come-back emails.
 * Testable without live database connections.
 */
export function evaluateComebackEligibility(params: {
  notificationEnabled: boolean;
  email: string | null | undefined;
  timezone: string;
  lastCompletionAt: string | null | undefined;
  currentStreak: number;
  incompleteChallengesCount: number;
  lastComebackSentAt: string | null | undefined;
  hasDeliveryToday: boolean;
  cooldownHours?: number;
  now?: Date;
}): { eligible: boolean; reason: string; localDate: string } {
  const now = params.now || new Date();
  const localDate = getUserLocalDate(params.timezone, now);

  if (!params.notificationEnabled) {
    return { eligible: false, reason: "User has disabled comeback notifications", localDate };
  }

  if (!params.email || !params.email.includes("@")) {
    return { eligible: false, reason: "No valid email address on profile", localDate };
  }

  // 1. Check if user already completed a quest today in their timezone
  if (params.lastCompletionAt) {
    const lastCompletionLocalDate = getUserLocalDate(
      params.timezone,
      new Date(params.lastCompletionAt)
    );
    if (lastCompletionLocalDate === localDate) {
      return { eligible: false, reason: "User already completed a quest today", localDate };
    }
  }

  // 2. Check if streak is at risk OR weekly challenge is incomplete
  const streakAtRisk = params.currentStreak > 0;
  const challengeIncomplete = params.incompleteChallengesCount > 0;

  if (!streakAtRisk && !challengeIncomplete) {
    return {
      eligible: false,
      reason: "Neither streak is at risk nor are any weekly challenges incomplete",
      localDate,
    };
  }

  // 3. Check if notification was already sent on the current local date (idempotency/daily cap)
  if (params.hasDeliveryToday) {
    return {
      eligible: false,
      reason: `Come-back notification already delivered on local date ${localDate}`,
      localDate,
    };
  }

  // 4. Check configured cooldown window (default 20 hours to prevent spam if timezones shift)
  const cooldownHours = params.cooldownHours ?? 20;
  if (params.lastComebackSentAt) {
    const lastSentTime = new Date(params.lastComebackSentAt).getTime();
    const elapsedHours = (now.getTime() - lastSentTime) / (1000 * 60 * 60);
    if (elapsedHours < cooldownHours) {
      return {
        eligible: false,
        reason: `Within cooldown window (${elapsedHours.toFixed(1)}h < ${cooldownHours}h)`,
        localDate,
      };
    }
  }

  return {
    eligible: true,
    reason: streakAtRisk
      ? `Streak at risk (${params.currentStreak} days)`
      : `Weekly challenge incomplete (${params.incompleteChallengesCount} remaining)`,
    localDate,
  };
}

/**
 * Sends a transactional email using Resend with graceful test environment fallback.
 */
async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  react: React.ReactElement;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vivre <onboarding@resend.dev>";

  // If in test mode or dummy API key, simulate sending safely
  if (!apiKey || apiKey === "re_dummy" || apiKey.startsWith("re_placeholder")) {
    console.log(
      `[Resend Simulated Email] To: ${options.to} | Subject: "${options.subject}" (Dummy/Mock Key)`
    );
    return { success: true, id: `mock_email_${Date.now()}` };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      react: options.react,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email via Resend";
    console.error("[Resend Error]", message);
    return { success: false, error: message };
  }
}

/**
 * Queries eligible users and processes Come-back email notifications.
 * Enforces user timezone, streak/challenge eligibility, cooldown, and local-date idempotency.
 */
export async function processComebackNotifications(): Promise<NotificationBatchResult> {
  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();

  const result: NotificationBatchResult = {
    notificationType: "comeback",
    scannedUsers: 0,
    eligibleUsers: 0,
    sentCount: 0,
    skippedCount: 0,
    errors: [],
  };

  // 1. Fetch candidate profiles who have comeback notifications enabled
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, email, timezone, current_streak, streak_shield_available, last_completion_at, notification_email_comeback")
    .eq("notification_email_comeback", true)
    .not("email", "is", null);

  if (profileErr) {
    result.errors.push(`Failed to fetch profiles: ${profileErr.message}`);
    return result;
  }

  if (!profiles || profiles.length === 0) {
    return result;
  }

  result.scannedUsers = profiles.length;

  // 2. Fetch active weekly challenges to count uncompleted requirements
  const { data: activeChallenges } = await supabase
    .from("weekly_challenges")
    .select("id, target_count")
    .eq("is_active", true)
    .lte("week_start_date", now.toISOString())
    .gte("week_end_date", now.toISOString());

  const activeChallengeIds = (activeChallenges || []).map((c) => c.id);

  // 3. Process each user individually
  for (const profile of profiles as ProfileRow[]) {
    try {
      const userTz = profile.timezone || "Asia/Kolkata";
      const localDate = getUserLocalDate(userTz, now);

      // Check if user has already received ANY comeback delivery on this local date
      const { data: existingDeliveries } = await supabase
        .from("notification_deliveries")
        .select("id, sent_at")
        .eq("user_id", profile.id)
        .eq("notification_type", "comeback")
        .order("sent_at", { ascending: false });

      const hasDeliveryToday = (existingDeliveries || []).some(
        (d) => getUserLocalDate(userTz, new Date(d.sent_at)) === localDate
      );
      const lastDeliverySentAt = existingDeliveries?.[0]?.sent_at || null;

      // Count uncompleted weekly challenges for this user
      let incompleteCount = 0;
      if (activeChallengeIds.length > 0) {
        const { data: userProgress } = await supabase
          .from("weekly_challenge_progress")
          .select("challenge_id, completed")
          .eq("user_id", profile.id)
          .in("challenge_id", activeChallengeIds);

        const completedChallengeIds = new Set(
          (userProgress || []).filter((p) => p.completed).map((p) => p.challenge_id)
        );
        incompleteCount = activeChallengeIds.filter(
          (id) => !completedChallengeIds.has(id)
        ).length;
      }

      // Check eligibility
      const eligibility = evaluateComebackEligibility({
        notificationEnabled: profile.notification_email_comeback,
        email: profile.email,
        timezone: userTz,
        lastCompletionAt: profile.last_completion_at,
        currentStreak: profile.current_streak,
        incompleteChallengesCount: incompleteCount,
        lastComebackSentAt: lastDeliverySentAt,
        hasDeliveryToday,
        now,
      });

      if (!eligibility.eligible) {
        result.skippedCount++;
        continue;
      }

      result.eligibleUsers++;

      // Construct server-controlled tokenized unsubscribe link
      const unsubscribeUrl = createUnsubscribeUrl(profile.id, "comeback", appUrl);

      // Send the Comeback Email via Resend
      const sendResult = await sendTransactionalEmail({
        to: profile.email!,
        subject:
          profile.current_streak > 0
            ? `Your ${profile.current_streak}-Day Streak Awaits — Vivre`
            : "Your Constellation Awaits — Vivre",
        react: ComebackEmail({
          username: profile.username || "Stargazer",
          currentStreak: profile.current_streak,
          streakShieldAvailable: profile.streak_shield_available,
          incompleteChallengesCount: incompleteCount,
          appUrl,
          unsubscribeUrl,
        }),
      });

      if (!sendResult.success) {
        result.errors.push(`Send failed for user ${profile.id}: ${sendResult.error}`);
        continue;
      }

      // Record authoritative delivery record to enforce local-date idempotency
      const { error: insertErr } = await supabase.from("notification_deliveries").insert({
        user_id: profile.id,
        notification_type: "comeback",
        local_date: localDate,
        metadata: {
          streak: profile.current_streak,
          incomplete_challenges: incompleteCount,
          email_id: sendResult.id,
        },
      });

      if (insertErr) {
        // If it was a duplicate key error from a race condition, ignore safely
        if (insertErr.code === "23505") {
          console.log(`[Notification Delivery] User ${profile.id} already recorded for ${localDate}`);
        } else {
          result.errors.push(`Delivery insert failed for user ${profile.id}: ${insertErr.message}`);
        }
      } else {
        result.sentCount++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Error processing user ${profile.id}: ${msg}`);
    }
  }

  return result;
}

/**
 * Queries eligible users and processes Weekly Recap email notifications.
 * Delivers once per calendar week per user.
 */
export async function processWeeklyRecapNotifications(): Promise<NotificationBatchResult> {
  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();

  const result: NotificationBatchResult = {
    notificationType: "weekly_recap",
    scannedUsers: 0,
    eligibleUsers: 0,
    sentCount: 0,
    skippedCount: 0,
    errors: [],
  };

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, email, timezone, level, current_streak, notification_email_weekly_recap")
    .eq("notification_email_weekly_recap", true)
    .not("email", "is", null);

  if (profileErr) {
    result.errors.push(`Failed to fetch profiles: ${profileErr.message}`);
    return result;
  }

  if (!profiles || profiles.length === 0) {
    return result;
  }

  result.scannedUsers = profiles.length;

  for (const profile of profiles as ProfileRow[]) {
    try {
      const userTz = profile.timezone || "Asia/Kolkata";
      const localDate = getUserLocalDate(userTz, now);

      // Check if already received a weekly recap within the last 6 days
      const { data: recentRecaps } = await supabase
        .from("notification_deliveries")
        .select("id, sent_at")
        .eq("user_id", profile.id)
        .eq("notification_type", "weekly_recap")
        .order("sent_at", { ascending: false })
        .limit(1);

      if (recentRecaps && recentRecaps.length > 0 && recentRecaps[0]) {
        const lastSentDate = getUserLocalDate(userTz, new Date(recentRecaps[0].sent_at));
        const dayDiff = getCalendarDayDiff(localDate, lastSentDate);
        if (dayDiff < 6) {
          result.skippedCount++;
          continue;
        }
      }

      result.eligibleUsers++;

      // Aggregate completions and XP in the past 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: completions } = await supabase
        .from("task_completions")
        .select("xp_awarded")
        .eq("user_id", profile.id)
        .gte("completed_at", sevenDaysAgo);

      const questsCompleted = completions?.length || 0;
      const xpGained = (completions || []).reduce(
        (sum, c) => sum + (Number(c.xp_awarded) || 0),
        0
      );

      // Count claimed challenges in past 7 days
      const { data: claimedChallenges } = await supabase
        .from("weekly_challenge_progress")
        .select("id")
        .eq("user_id", profile.id)
        .eq("claimed", true)
        .gte("claimed_at", sevenDaysAgo);

      const challengesClaimed = claimedChallenges?.length || 0;

      // Construct server-controlled tokenized unsubscribe link
      const unsubscribeUrl = createUnsubscribeUrl(profile.id, "weekly_recap", appUrl);

      // Send the Weekly Recap Email
      const sendResult = await sendTransactionalEmail({
        to: profile.email!,
        subject: "Your Weekly Starlight Chronicle — Vivre",
        react: WeeklyRecapEmail({
          username: profile.username || "Stargazer",
          questsCompleted,
          xpGained,
          currentStreak: profile.current_streak,
          level: profile.level,
          challengesClaimed,
          appUrl,
          unsubscribeUrl,
        }),
      });

      if (!sendResult.success) {
        result.errors.push(`Send failed for user ${profile.id}: ${sendResult.error}`);
        continue;
      }

      // Record authoritative delivery record
      const { error: insertErr } = await supabase.from("notification_deliveries").insert({
        user_id: profile.id,
        notification_type: "weekly_recap",
        local_date: localDate,
        metadata: {
          quests_completed: questsCompleted,
          xp_gained: xpGained,
          challenges_claimed: challengesClaimed,
          email_id: sendResult.id,
        },
      });

      if (insertErr) {
        if (insertErr.code === "23505") {
          console.log(`[Weekly Recap] User ${profile.id} already recorded for ${localDate}`);
        } else {
          result.errors.push(`Recap insert failed for user ${profile.id}: ${insertErr.message}`);
        }
      } else {
        result.sentCount++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Error processing user ${profile.id}: ${msg}`);
    }
  }

  return result;
}
