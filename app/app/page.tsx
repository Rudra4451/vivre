import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StarmapCanvas } from "@/components/starmap/StarmapCanvas";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { QuestBoardHeader } from "@/components/quest/QuestBoardHeader";
import { QuestBoard } from "@/components/quest/QuestBoard";
import { getLocalDateString } from "@/lib/game/progression";

export default async function CommandDeckPage() {
  const user = await requireUser();
  const supabase = await createClient();

  // 1. Fetch profile data (scoped by RLS to auth.uid())
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch attribute scores
  const { data: attributes } = await supabase
    .from("attributes")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  // 3. Fetch active tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  // 4. Determine user timezone & fetch today's completions
  const userTimezone = profile?.timezone ?? "Asia/Kolkata";
  const todayStr = getLocalDateString(new Date(), userTimezone);

  // Fetch completions created today
  const { data: todayCompletions } = await supabase
    .from("task_completions")
    .select("task_id, completed_at")
    .eq("user_id", user.id);

  const completedTodayTaskIds = (todayCompletions || [])
    .filter((c) => {
      const completionDay = getLocalDateString(new Date(c.completed_at), userTimezone);
      return completionDay === todayStr;
    })
    .map((c) => c.task_id);

  const defaultProfile = profile ?? {
    id: user.id,
    username: user.email?.split("@")[0] ?? "Explorer",
    level: 1,
    current_xp: 0,
    soft_currency: 0,
    rare_currency: 0,
    current_streak: 0,
    longest_streak: 0,
    streak_shield_available: true,
    streak_shield_refill_at: null,
    last_completion_at: null,
    timezone: "Asia/Kolkata",
    theme_preference: "system",
    sound_enabled: true,
    calm_mode: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Command Deck</span>
            <span className="text-xs font-mono uppercase bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
              Flight Ready
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Authoritative telemetry, daily quest directives, and navigation starmap.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">
              Pilot: {defaultProfile.username}
            </span>
          </div>
        </div>
      </div>

      {/* Top Authoritative Header Gauge */}
      <QuestBoardHeader
        initialProfile={defaultProfile}
        todayCompletionsCount={completedTodayTaskIds.length}
      />

      {/* Main Grid: Quest Board (Col 2) & Starmap / Pilot Metrics (Col 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Primary Quest Board Area (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <QuestBoard
            userId={user.id}
            initialTasks={tasks ?? []}
            initialCompletedTaskIds={completedTodayTaskIds}
          />
        </div>

        {/* Sidebar: Starmap & Pilot Status & Attributes */}
        <div className="space-y-6">
          {/* Starmap 3D Visualizer */}
          <Card className="overflow-hidden p-0 border-slate-800 bg-slate-950/60">
            <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/40">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <span>🌌</span>
                <span>Starmap Visualizer</span>
              </div>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                Quadrant 1
              </span>
            </div>
            <div className="h-[280px] w-full">
              <StarmapCanvas />
            </div>
          </Card>

          {/* Pilot Attributes */}
          <Card>
            <CardTitle className="text-sky-400 text-sm flex items-center justify-between">
              <span>Quadrant Mastery</span>
              <span className="text-xs font-mono text-slate-400">Attributes</span>
            </CardTitle>
            <CardDescription className="mt-1 text-xs">
              Direct telemetry from authoritative completion ledger
            </CardDescription>

            <div className="mt-4 space-y-3 text-xs">
              {attributes && attributes.length > 0 ? (
                attributes.map((attr) => (
                  <div
                    key={attr.id}
                    className="flex justify-between items-center border-b border-slate-800/60 pb-2 last:border-0"
                  >
                    <span className="text-slate-300 font-medium">{attr.name}</span>
                    <span className="font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                      {attr.value}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-center py-2">
                  Complete your first quest to unlock attribute metrics.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
