import { getCurrentUser } from "@/lib/auth";
import { StarmapCanvas } from "@/components/starmap/StarmapCanvas";
import { QuestList } from "@/components/quest/QuestList";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import type { QuestDefinition } from "@/types";

const mockQuests: QuestDefinition[] = [
  {
    id: "q-1",
    title: "Orion Belt Signal Reconnaissance",
    description: "Analyze anomalous radio bursts emanating from coordinates 05h 35m 17s.",
    rewardXp: 120,
    isCompleted: false,
  },
  {
    id: "q-2",
    title: "Cryo-Containment Calibrations",
    description: "Verify core containment pressures and calibrate navigational sensors.",
    rewardXp: 250,
    isCompleted: true,
  },
  {
    id: "q-3",
    title: "Vanguard Relay Synchronization",
    description: "Align the quantum transceivers with the orbital station cluster.",
    rewardXp: 400,
    isCompleted: false,
  },
];

export default async function CommandDeckPage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Command Deck</h1>
          <p className="mt-1 text-sm text-slate-400">
            Telemetry, navigational starmap, and active quadrant assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">
              Pilot: {user?.email ?? "Guest Explorer"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 3D Starmap & Sector Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-200">Starmap Visualizer</h2>
            <span className="text-xs font-mono text-sky-400">Three.js / WebGL</span>
          </div>
          <div className="h-[420px] w-full">
            <StarmapCanvas />
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle className="text-sky-400">Telemetry Status</CardTitle>
            <CardDescription className="mt-1 text-xs">
              System health and server-authoritative integrity check
            </CardDescription>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Core Sync</span>
                <span className="font-mono text-emerald-400">Optimal</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Auth Paradigm</span>
                <span className="font-mono text-sky-400">PKCE SSR</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Service-Role Isolation</span>
                <span className="font-mono text-emerald-400">Enforced</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rate Limiter</span>
                <span className="font-mono text-sky-400">Active</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quests Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Quadrant Quests</h2>
            <p className="text-xs text-slate-400">
              Assigned exploratory missions (presentation contracts only)
            </p>
          </div>
        </div>

        <QuestList quests={mockQuests} />
      </div>
    </div>
  );
}
