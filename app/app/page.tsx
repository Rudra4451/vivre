import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StarmapCanvas } from "@/components/starmap/StarmapCanvas";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

export default async function CommandDeckPage() {
  const user = await requireUser();

  // Fetch profile data (scoped by RLS to auth.uid())
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: attributes } = await supabase
    .from("attributes")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

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
              Pilot: {profile?.username ?? user.email ?? "Explorer"}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
            <span className="text-slate-400">Lv.</span>
            <span className="font-mono text-sky-400">{profile?.level ?? 1}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">XP:</span>
            <span className="font-mono text-emerald-400">{profile?.current_xp ?? 0}</span>
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
            <CardTitle className="text-sky-400">Pilot Status</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Current streak and resources
            </CardDescription>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Current Streak</span>
                <span className="font-mono text-emerald-400">{profile?.current_streak ?? 0} days</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Longest Streak</span>
                <span className="font-mono text-sky-400">{profile?.longest_streak ?? 0} days</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Soft Currency</span>
                <span className="font-mono text-amber-400">{profile?.soft_currency ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rare Currency</span>
                <span className="font-mono text-purple-400">{profile?.rare_currency ?? 0}</span>
              </div>
            </div>
          </Card>

          {/* Attributes */}
          <Card>
            <CardTitle className="text-sky-400">Attributes</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Your character development metrics
            </CardDescription>

            <div className="mt-4 space-y-3 text-xs">
              {attributes && attributes.length > 0 ? (
                attributes.map((attr) => (
                  <div key={attr.id} className="flex justify-between border-b border-slate-800 pb-2 last:border-0">
                    <span className="text-slate-400">{attr.name}</span>
                    <span className="font-mono text-sky-400">{attr.value}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Attributes will appear once your profile is initialized.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
