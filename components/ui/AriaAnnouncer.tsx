"use client";

import * as React from "react";
import { useAnnouncementStore } from "@/lib/game/announcements";

/**
 * Screen reader announcer providing polite and assertive aria-live live regions.
 * Visually hidden using the standard sr-only utility class.
 */
export function AriaAnnouncer() {
  const currentPolite = useAnnouncementStore((s) => s.currentPolite);
  const currentAssertive = useAnnouncementStore((s) => s.currentAssertive);

  return (
    <div className="sr-only" aria-hidden="false">
      {/* Polite live region for standard telemetry updates (XP, shields, streak) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        id="atlas-aria-polite"
      >
        {currentPolite}
      </div>

      {/* Assertive live region for critical progression interruptions (Level Up) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        id="atlas-aria-assertive"
      >
        {currentAssertive}
      </div>
    </div>
  );
}
