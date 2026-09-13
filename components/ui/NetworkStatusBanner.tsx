"use client";

import * as React from "react";
import { useAnnouncementStore } from "@/lib/game/announcements";

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function NetworkStatusBanner() {
  const isOnline = React.useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );

  const [justReconnected, setJustReconnected] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleOnline = () => {
      setJustReconnected(true);
      useAnnouncementStore
        .getState()
        .announce("Network connection restored. Telemetry synchronizing.", "polite");

      timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
    };

    const handleOffline = () => {
      setJustReconnected(false);
      useAnnouncementStore
        .getState()
        .announce(
          "Network connection lost. Offline actions will be queued and synchronized upon reconnection.",
          "assertive"
        );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !justReconnected) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live={isOnline ? "polite" : "assertive"}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-xs shadow-lg transition-all animate-fade-in"
      style={{
        backgroundColor: isOnline ? "var(--atlas-surface-elevated)" : "var(--atlas-surface)",
        borderColor: isOnline ? "var(--atlas-success)" : "var(--atlas-warning)",
        color: "var(--atlas-ink)",
      }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: isOnline ? "var(--atlas-success)" : "var(--atlas-warning)",
        }}
      />
      {isOnline ? (
        <span>Telemetry Restored · Synchronized</span>
      ) : (
        <span>Offline Mode · Actions Queued Locally</span>
      )}
    </div>
  );
}
