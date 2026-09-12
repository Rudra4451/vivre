import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
  createUnsubscribeUrl,
} from "@/lib/notifications/unsubscribe-token";
import {
  getUserLocalDate,
  getCalendarDayDiff,
  evaluateComebackEligibility,
} from "@/lib/notifications/service";
import { ComebackEmail } from "@/components/emails/ComebackEmail";
import { WeeklyRecapEmail } from "@/components/emails/WeeklyRecapEmail";
import { render } from "@react-email/components";
import React from "react";
import { NextRequest } from "next/server";

describe("Email Notifications System", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      CRON_SECRET: "test-cron-secret-12345",
      SUPABASE_SECRET_KEY: "test-supabase-secret",
      NEXT_PUBLIC_APP_URL: "https://vivre.test",
    };
  });

  // ---------------------------------------------------------------------------
  // 1. Tokenized Unsubscribe Utility
  // ---------------------------------------------------------------------------
  describe("Tokenized Unsubscribe", () => {
    const testUserId = "b45a0b76-4148-43d9-9aa6-276722d3d922";

    it("generates and verifies a valid unsubscribe token", () => {
      const token = createUnsubscribeToken(testUserId, "comeback");
      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      const verification = verifyUnsubscribeToken(token);
      expect(verification.valid).toBe(true);
      expect(verification.userId).toBe(testUserId);
      expect(verification.type).toBe("comeback");
    });

    it("supports 'weekly_recap' and 'all' types", () => {
      const recapToken = createUnsubscribeToken(testUserId, "weekly_recap");
      const recapVerif = verifyUnsubscribeToken(recapToken);
      expect(recapVerif.valid).toBe(true);
      expect(recapVerif.type).toBe("weekly_recap");

      const allToken = createUnsubscribeToken(testUserId, "all");
      const allVerif = verifyUnsubscribeToken(allToken);
      expect(allVerif.valid).toBe(true);
      expect(allVerif.type).toBe("all");
    });

    it("rejects tampered tokens", () => {
      const validToken = createUnsubscribeToken(testUserId, "comeback");
      const [, signature] = validToken.split(".");

      // Tamper with payload
      const tamperedPayload = Buffer.from(
        JSON.stringify({ userId: "attacker-id", type: "comeback", exp: Date.now() + 10000 })
      ).toString("base64url");
      const tamperedToken = `${tamperedPayload}.${signature}`;

      const verification = verifyUnsubscribeToken(tamperedToken);
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe("Invalid cryptographic signature");
    });

    it("rejects expired tokens", () => {
      // Create token with negative validity days (already expired)
      const expiredToken = createUnsubscribeToken(testUserId, "comeback", -1);
      const verification = verifyUnsubscribeToken(expiredToken);
      expect(verification.valid).toBe(false);
      expect(verification.error).toBe("Token has expired");
    });

    it("rejects malformed or empty token strings", () => {
      expect(verifyUnsubscribeToken("").valid).toBe(false);
      expect(verifyUnsubscribeToken("invalid-string-no-dot").valid).toBe(false);
      expect(verifyUnsubscribeToken("part1.").valid).toBe(false);
    });

    it("constructs full unsubscribe URL with encoded token", () => {
      const url = createUnsubscribeUrl(testUserId, "comeback", "https://vivre.test");
      expect(url).toContain("https://vivre.test/api/notifications/unsubscribe?token=");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Timezone and Local Date Math
  // ---------------------------------------------------------------------------
  describe("Timezone & Local Date Calculations", () => {
    it("formats local dates accurately across timezones", () => {
      // UTC 2026-09-13 23:30:00 -> in Tokyo (+9) it is 2026-09-14
      const instant = new Date("2026-09-13T23:30:00Z");

      const utcDate = getUserLocalDate("UTC", instant);
      const tokyoDate = getUserLocalDate("Asia/Tokyo", instant);
      const nyDate = getUserLocalDate("America/New_York", instant);

      expect(utcDate).toBe("2026-09-13");
      expect(tokyoDate).toBe("2026-09-14");
      expect(nyDate).toBe("2026-09-13");
    });

    it("handles invalid timezone strings gracefully by falling back to UTC", () => {
      const instant = new Date("2026-09-13T12:00:00Z");
      const result = getUserLocalDate("Invalid/Timezone_Name", instant);
      expect(result).toBe("2026-09-13");
    });

    it("calculates calendar day differences accurately", () => {
      expect(getCalendarDayDiff("2026-09-13", "2026-09-13")).toBe(0);
      expect(getCalendarDayDiff("2026-09-13", "2026-09-12")).toBe(1);
      expect(getCalendarDayDiff("2026-09-13", "2026-09-06")).toBe(7);
      expect(getCalendarDayDiff("2026-09-10", "2026-09-13")).toBe(-3);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Come-back Eligibility Engine
  // ---------------------------------------------------------------------------
  describe("Come-back Eligibility Engine", () => {
    const fixedNow = new Date("2026-09-13T16:00:00Z");
    const userTz = "Asia/Kolkata"; // In IST, 16:00 UTC is 21:30 IST on 2026-09-13

    it("disqualifies users with notifications disabled", () => {
      const res = evaluateComebackEligibility({
        notificationEnabled: false,
        email: "user@example.com",
        timezone: userTz,
        lastCompletionAt: "2026-09-12T10:00:00Z",
        currentStreak: 3,
        incompleteChallengesCount: 1,
        lastComebackSentAt: null,
        hasDeliveryToday: false,
        now: fixedNow,
      });

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("disabled");
    });

    it("disqualifies users without a valid email address", () => {
      const res = evaluateComebackEligibility({
        notificationEnabled: true,
        email: null,
        timezone: userTz,
        lastCompletionAt: "2026-09-12T10:00:00Z",
        currentStreak: 3,
        incompleteChallengesCount: 1,
        lastComebackSentAt: null,
        hasDeliveryToday: false,
        now: fixedNow,
      });

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("No valid email");
    });

    it("disqualifies users who have already completed a quest today in their timezone", () => {
      // Completed earlier today in user's timezone (IST)
      const completionToday = "2026-09-13T06:00:00Z"; // 11:30 AM IST on 2026-09-13

      const res = evaluateComebackEligibility({
        notificationEnabled: true,
        email: "user@example.com",
        timezone: userTz,
        lastCompletionAt: completionToday,
        currentStreak: 3,
        incompleteChallengesCount: 1,
        lastComebackSentAt: null,
        hasDeliveryToday: false,
        now: fixedNow,
      });

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("already completed a quest today");
    });

    it("qualifies users with streak at risk and no completion today", () => {
      // Completed yesterday
      const completionYesterday = "2026-09-12T10:00:00Z";

      const res = evaluateComebackEligibility({
        notificationEnabled: true,
        email: "user@example.com",
        timezone: userTz,
        lastCompletionAt: completionYesterday,
        currentStreak: 4,
        incompleteChallengesCount: 0,
        lastComebackSentAt: null,
        hasDeliveryToday: false,
        now: fixedNow,
      });

      expect(res.eligible).toBe(true);
      expect(res.reason).toContain("Streak at risk (4 days)");
    });

    it("qualifies users with streak = 0 if weekly challenge is incomplete", () => {
      const completionLongAgo = "2026-09-01T10:00:00Z";

      const res = evaluateComebackEligibility({
        notificationEnabled: true,
        email: "user@example.com",
        timezone: userTz,
        lastCompletionAt: completionLongAgo,
        currentStreak: 0,
        incompleteChallengesCount: 2,
        lastComebackSentAt: null,
        hasDeliveryToday: false,
        now: fixedNow,
      });

      expect(res.eligible).toBe(true);
      expect(res.reason).toContain("Weekly challenge incomplete (2 remaining)");
    });

    it("disqualifies users with streak = 0 and 0 incomplete weekly challenges", () => {
      const res = evaluateComebackEligibility({
        notificationEnabled: true,
        email: "user@example.com",
        timezone: userTz,
        lastCompletionAt: "2026-09-10T10:00:00Z",
        currentStreak: 0,
        incompleteChallengesCount: 0,
        lastComebackSentAt: null,
        hasDeliveryToday: false,
        now: fixedNow,
      });

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("Neither streak is at risk");
    });

    it("disqualifies users who already received a comeback notification today (idempotency)", () => {
      const res = evaluateComebackEligibility({
        notificationEnabled: true,
        email: "user@example.com",
        timezone: userTz,
        lastCompletionAt: "2026-09-12T10:00:00Z",
        currentStreak: 5,
        incompleteChallengesCount: 1,
        lastComebackSentAt: "2026-09-13T02:00:00Z",
        hasDeliveryToday: true,
        now: fixedNow,
      });

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("already delivered");
    });

    it("enforces configured cooldown window (e.g. 20 hours)", () => {
      // Last sent 10 hours ago
      const tenHoursAgo = new Date(fixedNow.getTime() - 10 * 60 * 60 * 1000).toISOString();

      const res = evaluateComebackEligibility({
        notificationEnabled: true,
        email: "user@example.com",
        timezone: userTz,
        lastCompletionAt: "2026-09-12T10:00:00Z",
        currentStreak: 5,
        incompleteChallengesCount: 1,
        lastComebackSentAt: tenHoursAgo,
        hasDeliveryToday: false, // simulated timezone cross
        cooldownHours: 20,
        now: fixedNow,
      });

      expect(res.eligible).toBe(false);
      expect(res.reason).toContain("Within cooldown window");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. React Email Templates Rendering
  // ---------------------------------------------------------------------------
  describe("React Email Rendering", () => {
    it("renders ComebackEmail with dynamic streak and unsubscribe link", async () => {
      const html = await render(
        React.createElement(ComebackEmail, {
          username: "Orion",
          currentStreak: 7,
          streakShieldAvailable: true,
          incompleteChallengesCount: 2,
          appUrl: "https://vivre.app",
          unsubscribeUrl: "https://vivre.app/api/notifications/unsubscribe?token=sample",
        })
      );

      expect(html).toContain("Orion");
      expect(html).toContain("7-day streak");
      expect(html).toContain("Streak Shield is charged");
      expect(html).toContain("2");
      expect(html).toContain("https://vivre.app/api/notifications/unsubscribe?token=sample");
      expect(html).toContain("V I V R E");
    });

    it("renders WeeklyRecapEmail with stats grid and milestones", async () => {
      const html = await render(
        React.createElement(WeeklyRecapEmail, {
          username: "Lyra",
          questsCompleted: 12,
          xpGained: 2400,
          currentStreak: 5,
          level: 4,
          challengesClaimed: 2,
          appUrl: "https://vivre.app",
          unsubscribeUrl: "https://vivre.app/api/notifications/unsubscribe?token=recap",
        })
      );

      expect(html).toContain("Lyra");
      expect(html).toContain("12");
      expect(html).toContain("+2400");
      expect(html).toContain("Lvl 4");
      expect(html).toContain("harvesting rare Starlight Embers");
      expect(html).toContain("https://vivre.app/api/notifications/unsubscribe?token=recap");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Cron Route Handler Authorization Security
  // ---------------------------------------------------------------------------
  describe("Vercel Cron Route Handler Authorization", () => {
    it("returns 401 Unauthorized when Authorization header is missing", async () => {
      const { GET } = await import("@/app/api/cron/notifications/route");
      const req = new NextRequest("https://vivre.test/api/cron/notifications", {
        method: "GET",
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Unauthorized/i);
      // Security rule: must not leak the secret
      expect(JSON.stringify(json)).not.toContain("test-cron-secret-12345");
    });

    it("returns 401 Unauthorized when Bearer token is invalid", async () => {
      const { GET } = await import("@/app/api/cron/notifications/route");
      const req = new NextRequest("https://vivre.test/api/cron/notifications", {
        method: "GET",
        headers: {
          authorization: "Bearer wrong-secret-token",
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toMatch(/Unauthorized/i);
      expect(JSON.stringify(json)).not.toContain("test-cron-secret-12345");
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Unsubscribe Route Handler
  // ---------------------------------------------------------------------------
  describe("Unsubscribe Route Handler", () => {
    it("returns 400 when token is missing", async () => {
      const { GET } = await import("@/app/api/notifications/unsubscribe/route");
      const req = new NextRequest("https://vivre.test/api/notifications/unsubscribe", {
        method: "GET",
        headers: { accept: "application/json" },
      });

      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Missing token/i);
    });

    it("returns 400 when token is invalid or forged", async () => {
      const { GET } = await import("@/app/api/notifications/unsubscribe/route");
      const req = new NextRequest(
        "https://vivre.test/api/notifications/unsubscribe?token=tampered.token.here",
        {
          method: "GET",
          headers: { accept: "application/json" },
        }
      );

      const res = await GET(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/signature|invalid/i);
    });
  });
});

