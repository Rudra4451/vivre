import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

import { sanitizeRedirectUrl } from "@/lib/auth/redirect";
import { createTaskInputSchema } from "@/lib/game/actions";
import { resetLocalFallbackStore } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

describe("Application Security Hardening", () => {
  beforeEach(() => {
    resetLocalFallbackStore();
  });

  // ---------------------------------------------------------------------------
  // 1. Open Redirect Prevention
  // ---------------------------------------------------------------------------
  describe("Open Redirect Protection (CWE-601)", () => {
    it("permits safe local relative paths", () => {
      expect(sanitizeRedirectUrl("/app")).toBe("/app");
      expect(sanitizeRedirectUrl("/app/quest-log")).toBe("/app/quest-log");
      expect(sanitizeRedirectUrl("/showcase?tab=radar")).toBe("/showcase?tab=radar");
    });

    it("rejects absolute external URLs with HTTP/HTTPS", () => {
      expect(sanitizeRedirectUrl("https://evil.com")).toBe("/app");
      expect(sanitizeRedirectUrl("http://phishing.site/login")).toBe("/app");
      expect(sanitizeRedirectUrl("//attacker.com")).toBe("/app");
    });

    it("rejects protocol-relative and backslash evasions", () => {
      expect(sanitizeRedirectUrl("//evil.com/path")).toBe("/app");
      expect(sanitizeRedirectUrl("/\\evil.com")).toBe("/app");
      expect(sanitizeRedirectUrl("/\\\\attacker.com")).toBe("/app");
    });

    it("rejects dangerous URI schemes (javascript:, data:, vbscript:)", () => {
      expect(sanitizeRedirectUrl("javascript:alert(document.cookie)")).toBe("/app");
      expect(sanitizeRedirectUrl("data:text/html;base64,PHNjcmlwdD4=")).toBe("/app");
    });

    it("rejects CRLF injection attempts in redirect paths", () => {
      expect(sanitizeRedirectUrl("/app\r\nSet-Cookie: stolen=1")).toBe("/app");
      expect(sanitizeRedirectUrl("/app\nHost: attacker.com")).toBe("/app");
    });

    it("falls back to specified fallback path when provided", () => {
      expect(sanitizeRedirectUrl("https://evil.com", "/login")).toBe("/login");
      expect(sanitizeRedirectUrl(null, "/custom-fallback")).toBe("/custom-fallback");
      expect(sanitizeRedirectUrl("", "/custom-fallback")).toBe("/custom-fallback");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Input Validation & Stored XSS Prevention
  // ---------------------------------------------------------------------------
  describe("Task Input Validation & Stored XSS Prevention (CWE-79)", () => {
    it("accepts valid task titles", () => {
      const valid = createTaskInputSchema.safeParse({
        title: "Study Stellar Cartography for 45 minutes",
        category: "Mind",
        isRecurring: false,
      });
      expect(valid.success).toBe(true);
    });

    it("rejects task titles containing HTML tags or script markup", () => {
      const scriptAttempt = createTaskInputSchema.safeParse({
        title: "<script>alert('pwned')</script>",
        category: "Craft",
      });
      expect(scriptAttempt.success).toBe(false);
      expect(scriptAttempt.error?.issues[0]?.message).toMatch(/HTML or script/i);

      const imgAttempt = createTaskInputSchema.safeParse({
        title: "Survey nebula <img src=x onerror=alert(1)>",
        category: "Spirit",
      });
      expect(imgAttempt.success).toBe(false);
      expect(imgAttempt.error?.issues[0]?.message).toMatch(/HTML or script/i);
    });

    it("trims whitespace and rejects blank titles", () => {
      const whitespaceOnly = createTaskInputSchema.safeParse({
        title: "     ",
        category: "Body",
      });
      expect(whitespaceOnly.success).toBe(false);
    });

    it("rejects titles exceeding 100 characters", () => {
      const longTitle = "A".repeat(101);
      const res = createTaskInputSchema.safeParse({
        title: longTitle,
        category: "Discipline",
      });
      expect(res.success).toBe(false);
      expect(res.error?.issues[0]?.message).toMatch(/cannot exceed 100 characters/i);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Logout CSRF Origin Validation
  // ---------------------------------------------------------------------------
  describe("Logout Route CSRF Defense (CWE-352)", () => {
    it("rejects cross-origin logout requests with 403 Forbidden", async () => {
      const { POST } = await import("@/app/api/auth/logout/route");
      const req = new NextRequest("https://vivre.app/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "https://malicious-site.com",
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/Cross-origin logout forbidden/i);
    });

    it("allows same-origin logout requests", async () => {
      const { POST } = await import("@/app/api/auth/logout/route");
      const req = new NextRequest("https://vivre.app/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "https://vivre.app",
        },
      });

      const res = await POST(req);
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("https://vivre.app/");
    });
  });
});
