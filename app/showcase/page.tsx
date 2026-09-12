"use client";

import * as React from "react";
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  Toast,
  ProgressBar,
  Badge,
  EmptyState,
  ErrorState,
  AttributeCard,
} from "@/components/ui";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { QuestCard } from "@/components/quest/QuestCard";
import { QuestBoardHeader } from "@/components/quest/QuestBoardHeader";
import { QuestCompletionEffect } from "@/components/quest/QuestCompletionEffect";
import { useQuestBoardStore } from "@/lib/game/quest-board-store";
import { useUIStore } from "@/lib/game/store";
import { AtlasAudio } from "@/lib/game/audio";
import { AtlasAnnounce, useAnnouncementStore } from "@/lib/game/announcements";
import { useMotionPreferences } from "@/lib/game/motion-config";
import { StarMapShell } from "@/components/starmap/StarMapShell";
import { AttributeRadarChart } from "@/components/attributes";
import { WeeklyChallengesCard } from "@/components/challenges";
import { CosmeticShop } from "@/components/shop";

const DEMO_WEEK_START = "2026-09-13T00:00:00.000Z";
const DEMO_WEEK_END = "2026-09-20T00:00:00.000Z";

export default function ShowcasePage() {
  const { theme, resolvedTheme } = useTheme();

  // State for interactive primitives
  const [modalOpen, setModalOpen] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastType, setToastType] = React.useState<"info" | "success" | "warning" | "danger" | "reward">("info");
  const [inputValue, setInputValue] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("mind");
  const [inputError, setInputError] = React.useState<string | undefined>(undefined);
  const [demoProgress, setDemoProgress] = React.useState(68);
  const [testCompletionNormal, setTestCompletionNormal] = React.useState(false);
  const [testCompletionCritical, setTestCompletionCritical] = React.useState(false);

  const { shouldReduceMotion, isCalmMode, soundEnabled } = useMotionPreferences();
  const toggleCalmMode = useUIStore((s) => s.toggleCalmMode);
  const toggleSound = useUIStore((s) => s.toggleSound);
  const setCelebration = useQuestBoardStore((s) => s.setCelebration);
  const announcementHistory = useAnnouncementStore((s) => s.history);

  const tokens = [
    { name: "--atlas-bg", label: "Atlas Background", desc: "Base canvas plane", cssVar: "var(--atlas-bg)" },
    { name: "--atlas-surface", label: "Atlas Surface", desc: "Cards, panels & elevations", cssVar: "var(--atlas-surface)" },
    { name: "--atlas-ink", label: "Atlas Ink", desc: "Primary text & crisp geometry", cssVar: "var(--atlas-ink)" },
    { name: "--atlas-muted", label: "Atlas Muted", desc: "Subordinate text & subtle guides", cssVar: "var(--atlas-muted)" },
    { name: "--atlas-line", label: "Atlas Line", desc: "Engraved borders & gridlines", cssVar: "var(--atlas-line)" },
    { name: "--atlas-reward", label: "Atlas Reward (Gold)", desc: "STRICT: XP & claims only", cssVar: "var(--atlas-reward)", isReward: true },
    { name: "--atlas-success", label: "Atlas Success", desc: "Completed states & validation", cssVar: "var(--atlas-success)" },
    { name: "--atlas-warning", label: "Atlas Warning", desc: "Streak shield & advisories", cssVar: "var(--atlas-warning)" },
    { name: "--atlas-danger", label: "Atlas Danger", desc: "Destructive acts & streak loss", cssVar: "var(--atlas-danger)" },
  ];

  // Mock task for QuestCard demonstration
  const mockTask = {
    id: "demo-task-1",
    user_id: "demo-user",
    title: "Survey the Orion Nebular coordinates",
    category: "mind",
    is_recurring: false,
    recurrence_interval: null,
    recurrence_days: null,
    sort_order: 1,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Mock profile for QuestBoardHeader
  const mockProfile = {
    id: "demo-user",
    username: "Astraeus",
    level: 7,
    current_xp: 340,
    soft_currency: 120,
    rare_currency: 15,
    current_streak: 5,
    longest_streak: 14,
    streak_shield_available: true,
    streak_shield_refill_at: null,
    last_completion_at: new Date().toISOString(),
    timezone: "Asia/Kolkata",
    theme_preference: "system" as const,
    sound_enabled: true,
    calm_mode: false,
    email: "astraeus@vivre.app",
    notification_email_comeback: true,
    notification_email_weekly_recap: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  function triggerToast(type: "info" | "success" | "warning" | "danger" | "reward") {
    setToastType(type);
    setShowToast(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
      {/* Toast Notification Container */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5">
          <Toast
            type={toastType}
            title={
              toastType === "reward"
                ? "Celestial Reward Bestowed"
                : toastType === "success"
                ? "Directive Verified"
                : toastType === "warning"
                ? "Streak Shield Low"
                : toastType === "danger"
                ? "Telemetry Out of Bounds"
                : "Atlas Codex Updated"
            }
            message={
              toastType === "reward"
                ? "+100 XP gained. Constellation link established."
                : "Telemetry confirmed by the server-authoritative engine."
            }
            onDismiss={() => setShowToast(false)}
          />
        </div>
      )}

      {/* Hero / System Overview */}
      <section className="border-b border-[var(--atlas-line)] pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" size="sm">
                System Spec 1.0
              </Badge>
              <span className="font-mono text-xs text-[var(--atlas-muted)]">
                Active Theme: <strong className="text-[var(--atlas-ink)] uppercase">{theme}</strong> (Resolved: {resolvedTheme})
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[var(--atlas-ink)]">
              Constellation Atlas
            </h1>
            <p className="mt-3 max-w-2xl text-base text-[var(--atlas-muted)] leading-relaxed">
              A dual-state cartographic design system representing personal discipline as a celestial star chart.
              Rendered through engraved linework, authentic ink, and strictly disciplined reward accents.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--atlas-muted)]">
                Toggle Mode:
              </span>
              <ThemeToggle />
            </div>
            <p className="text-[11px] text-[var(--atlas-muted)] font-mono">
              Night Sky: #0B0E1A · Star Atlas: #F2EDE0
            </p>
          </div>
        </div>

        {/* Golden Rule Callout */}
        <div className="mt-8 rounded-lg border border-[var(--atlas-reward)]/40 bg-[var(--atlas-reward)]/5 p-4 sm:p-5 flex items-start gap-4">
          <span className="text-xl text-[var(--atlas-reward)]">⚖</span>
          <div>
            <h2 className="font-display text-sm font-semibold tracking-wide text-[var(--atlas-ink)]">
              The Fundamental Tenet: Gold Means REWARD Only
            </h2>
            <p className="mt-1 text-xs text-[var(--atlas-muted)] leading-relaxed">
              In Vivre, gold (<code className="font-mono text-[var(--atlas-reward)] font-bold">#D4A85A</code>) is an unpurchasable, earned symbol.
              It is strictly reserved for authoritative XP bars, level advancement milestones, completion celebrations, and reward claims.
              It must never be used for generic buttons, borders, warnings, or arbitrary decoration.
            </p>
          </div>
        </div>
      </section>

      {/* 1. Design Tokens & Swatches */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            1. Semantic Design Tokens
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Exclusively managed via CSS variables and Tailwind utilities. Zero hardcoded hexes in components.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token) => (
            <div
              key={token.name}
              className="rounded-lg border border-[var(--atlas-line)] bg-[var(--atlas-surface)] p-4 flex items-center gap-3.5 transition-colors"
            >
              <div
                className="h-10 w-10 shrink-0 rounded border border-[var(--atlas-line)] shadow-inner"
                style={{ backgroundColor: token.cssVar }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[var(--atlas-ink)]">
                    {token.name}
                  </span>
                  {token.isReward && (
                    <Badge variant="reward" size="sm">
                      Strict
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] font-medium text-[var(--atlas-ink)] mt-0.5">
                  {token.label}
                </p>
                <p className="text-[10px] text-[var(--atlas-muted)] truncate">
                  {token.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Typography Hierarchy */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            2. Cartographic Typography
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Distinctive display font (Cinzel) paired with clean geometric sans (Plus Jakarta Sans).
          </p>
        </div>

        <Card className="space-y-6 p-6">
          <div className="border-b border-[var(--atlas-line)] pb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--atlas-muted)]">
              Display Heading 1 · Cinzel Bold
            </span>
            <p className="font-display text-3xl sm:text-4xl font-bold text-[var(--atlas-ink)] mt-1">
              The Celestial Sphere of Human Undertakings
            </p>
          </div>

          <div className="border-b border-[var(--atlas-line)] pb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--atlas-muted)]">
              Display Heading 2 · Cinzel SemiBold
            </span>
            <p className="font-display text-2xl font-semibold text-[var(--atlas-ink)] mt-1">
              Quadrant IV: Discipline and Cartography
            </p>
          </div>

          <div className="border-b border-[var(--atlas-line)] pb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--atlas-muted)]">
              UI Sans Body · Plus Jakarta Sans Regular
            </span>
            <p className="text-sm text-[var(--atlas-ink)] mt-1 leading-relaxed">
              Every verified task completion commits an immutable transaction to the PostgreSQL audit log.
              Through repetitive discipline, coordinates converge into luminous constellations.
            </p>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--atlas-muted)]">
              Telemetry & Coordinates · Monospace
            </span>
            <p className="font-mono text-xs text-[var(--atlas-muted)] mt-1">
              LAT 28°36&apos;N · LON 77°12&apos;E · TX_ID: b48f-9982-ac10 · IDEMPOTENCY: AUTHORITATIVE
            </p>
          </div>
        </Card>
      </section>

      {/* 3. Button Primitives */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            3. Buttons
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Variants designed for cartographic hierarchy. Note: the Reward variant is reserved exclusively for reward claims.
          </p>
        </div>

        <Card className="space-y-6 p-6">
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--atlas-muted)]">
              Variants (Size Medium)
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary Action</Button>
              <Button variant="outline">Outline Cartography</Button>
              <Button variant="ghost">Ghost Element</Button>
              <Button variant="danger">Abandon Directive</Button>
              <Button variant="reward">Claim 100 XP (Reward Only)</Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-[var(--atlas-line)] pt-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--atlas-muted)]">
              Sizes & States
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="outline">Small Size</Button>
              <Button size="md" variant="outline">Medium Size</Button>
              <Button size="lg" variant="outline">Large Size</Button>
              <Button size="md" variant="outline" disabled>Disabled State</Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Form Controls: Input & Select */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            4. Inputs & Selects
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Engraved inputs with clear focus indicators, coordinate styling, and accessible error states.
          </p>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input
              id="showcase-input-default"
              label="Standard Directive"
              placeholder="e.g. Survey quadrant sector 4"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value.length > 0 && e.target.value.length < 3) {
                  setInputError("Directive must be at least 3 characters");
                } else {
                  setInputError(undefined);
                }
              }}
              error={inputError}
            />

            <Select
              id="showcase-select-category"
              label="Aspect Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: "body", label: "☉ Body (Vitality)" },
                { value: "mind", label: "☿ Mind (Acquisition)" },
                { value: "discipline", label: "♄ Discipline (Resolve)" },
                { value: "craft", label: "♃ Craft (Creation)" },
                { value: "spirit", label: "☽ Spirit (Equanimity)" },
              ]}
            />

            <Input
              id="showcase-input-disabled"
              label="Locked Coordinate"
              placeholder="Authoritative telemetry only"
              value="SYS_LOCKED_COORDINATE_77"
              disabled
            />
          </div>
        </Card>
      </section>

      {/* 5. Progress Bars & Badges */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            5. Progress Bars & Badges
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Fine linework progression meters and cartographic badges.
          </p>
        </div>

        <Card className="space-y-6 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--atlas-muted)]">
                Authoritative XP Progression (Gold Reward Variant)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDemoProgress(Math.max(10, demoProgress - 15))}
                >
                  -15%
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDemoProgress(Math.min(100, demoProgress + 15))}
                >
                  +15%
                </Button>
              </div>
            </div>
            <ProgressBar value={demoProgress} variant="reward" size="md" />
          </div>

          <div className="space-y-2 border-t border-[var(--atlas-line)] pt-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--atlas-muted)]">
              Standard Metric Progress (Ink Variant)
            </span>
            <ProgressBar value={45} variant="default" size="sm" />
          </div>

          <div className="space-y-3 border-t border-[var(--atlas-line)] pt-4">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--atlas-muted)]">
              Badge Variants
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge variant="default">Default Ink</Badge>
              <Badge variant="outline">Outline Line</Badge>
              <Badge variant="reward">Reward +100 XP</Badge>
              <Badge variant="success">Completed</Badge>
              <Badge variant="warning">Shield Low</Badge>
              <Badge variant="danger">Streak Broken</Badge>
            </div>
          </div>
        </Card>
      </section>

      {/* 6. Attribute Cards (Discipline Aspects) */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            6. Attribute Cards
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Discipline markers with astronomical glyphs and engraved proficiency bars.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AttributeCard
            name="Body"
            category="body"
            value={72}
            description="Physical endurance, recovery, and corporeal vitality"
          />
          <AttributeCard
            name="Mind"
            category="mind"
            value={85}
            description="Analytical acumen, memory, and cognitive exploration"
          />
          <AttributeCard
            name="Discipline"
            category="discipline"
            value={60}
            description="Consistency of purpose and fidelity to daily rhythm"
          />
          <AttributeCard
            name="Craft"
            category="craft"
            value={48}
            description="Technical mastery, artifact creation, and precision"
          />
          <AttributeCard
            name="Spirit"
            category="spirit"
            value={91}
            description="Equanimity, intentional silence, and contemplative balance"
          />
        </div>
      </section>

      {/* 7. Quest Components Integration */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            7. Quest Board Architecture
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Authoritative gauge header and responsive quest cards in active states.
          </p>
        </div>

        <div className="space-y-6">
          {/* Header Gauge */}
          <QuestBoardHeader initialProfile={mockProfile} todayCompletionsCount={3} />

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--atlas-muted)] block mb-2">
                Standard Active Quest Card
              </span>
              <QuestCard
                quest={mockTask}
                isCompletedToday={false}
              />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--atlas-muted)] block mb-2">
                Completed Quest Card (Reconciled)
              </span>
              <QuestCard
                quest={{
                  ...mockTask,
                  id: "demo-task-completed",
                  title: "Calibrate astrolabe mirrors against Alpha Centauri",
                  category: "craft",
                }}
                isCompletedToday={true}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 8. Empty & Error States */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            8. States: Empty & Error
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Cartographic states with geometric linework and graceful degradation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <EmptyState
              title="No Directives Charted"
              description="Your celestial quadrant currently holds no pending tasks. Add a new endeavor above."
              actionLabel="Chart Directive"
              onAction={() => triggerToast("info")}
            />
          </Card>

          <Card className="p-6">
            <ErrorState
              title="Cartographic Connection Severed"
              message="Unable to verify authoritative telemetry with PostgreSQL server. Check network coordinates."
              onRetry={() => triggerToast("warning")}
            />
          </Card>
        </div>
      </section>

      {/* 9. Modal & Toast Dialogs */}
      <section className="space-y-6 border-t border-[var(--atlas-line)] pt-10">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            9. Overlays: Modal & Toast
          </h2>
          <p className="text-xs text-[var(--atlas-muted)] mt-1">
            Fully accessible dialogs without glassmorphism; restrained paper/sky surface backing.
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Launch System Modal
            </Button>
            <Button variant="outline" onClick={() => triggerToast("info")}>
              Dispatch Info Toast
            </Button>
            <Button variant="outline" onClick={() => triggerToast("success")}>
              Dispatch Success Toast
            </Button>
            <Button variant="outline" onClick={() => triggerToast("warning")}>
              Dispatch Warning Toast
            </Button>
            <Button variant="outline" onClick={() => triggerToast("danger")}>
              Dispatch Danger Toast
            </Button>
            <Button variant="reward" onClick={() => triggerToast("reward")}>
              Dispatch Reward Toast
            </Button>
          </div>
        </Card>

        {/* Modal Instance */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Authoritative Epoch Confirmation"
          description="You are requesting a deep ledger recount for epoch cycles."
        >
          <div className="space-y-4 text-xs text-[var(--atlas-muted)] leading-relaxed">
            <p>
              In Constellation Atlas, dialogs utilize solid surface backings (`var(--atlas-surface)`) with thin engraved
              borders (`var(--atlas-line)`). Glassmorphic blurs are deliberately omitted in favor of clear cartographic contrast.
            </p>
            <p className="rounded border border-[var(--atlas-line)] bg-[var(--atlas-bg)] p-3 font-mono text-[11px] text-[var(--atlas-ink)]">
              FOCUS_TRAP: ACTIVE · ESCAPE_KEY: ENABLED · ARIA_MODAL: TRUE
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--atlas-line)]">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setModalOpen(false);
                  triggerToast("success");
                }}
              >
                Execute Re-alignment
              </Button>
            </div>
          </div>
        </Modal>
      </section>

      {/* 10. Motion System & Accessible Feedback */}
      <section className="space-y-6 border-t border-[var(--atlas-line)] pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
              10. Motion System & Accessible Feedback
            </h2>
            <p className="text-xs text-[var(--atlas-muted)] mt-1">
              Framer Motion transitions, procedural harmonic Web Audio, and screen reader live regions.
            </p>
          </div>

          {/* Live Status Indicators & Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={shouldReduceMotion ? "warning" : "default"}
              size="sm"
            >
              Reduced Motion: {shouldReduceMotion ? "Active" : "Normal"}
            </Badge>

            <Button
              size="sm"
              variant={isCalmMode ? "reward" : "outline"}
              onClick={toggleCalmMode}
              className="text-xs"
            >
              {isCalmMode ? "🌿 Calm Mode: ON" : "🌿 Calm Mode: OFF"}
            </Button>

            <Button
              size="sm"
              variant={soundEnabled ? "secondary" : "outline"}
              onClick={toggleSound}
              className="text-xs"
            >
              {soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: MUTED"}
            </Button>
          </div>
        </div>

        {/* Motion Testbed Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Normal Completion Test Card */}
          <Card className="relative overflow-hidden p-5 flex flex-col justify-between min-h-[190px]">
            <QuestCompletionEffect
              isActive={testCompletionNormal}
              isCritical={false}
              onAnimationEnd={() => setTestCompletionNormal(false)}
            />
            <div>
              <div className="text-[10px] font-mono text-[var(--atlas-muted)] uppercase tracking-wider">
                Normal Completion
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--atlas-ink)] mt-1">
                Restrained In-Situ Motion
              </h3>
              <p className="text-[11px] text-[var(--atlas-muted)] mt-1.5 leading-relaxed">
                Star appears, constellation line connects, subtle spring, and 8 radial particles (<code className="text-xs">&lt; 1s</code> duration).
              </p>
            </div>
            <div className="pt-3">
              <Button
                variant="secondary"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setTestCompletionNormal(true);
                  AtlasAudio.playCompletion(false);
                  AtlasAnnounce.xpGained(50, "Mind");
                }}
              >
                Trigger Normal
              </Button>
            </div>
          </Card>

          {/* Critical Roll Completion Test Card */}
          <Card className="relative overflow-hidden p-5 flex flex-col justify-between min-h-[190px]">
            <QuestCompletionEffect
              isActive={testCompletionCritical}
              isCritical={true}
              onAnimationEnd={() => setTestCompletionCritical(false)}
            />
            <div>
              <div className="text-[10px] font-mono text-[var(--atlas-reward)] font-bold uppercase tracking-wider">
                Critical Bonus Roll
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--atlas-ink)] mt-1">
                Resonant Harmonic Treatment
              </h3>
              <p className="text-[11px] text-[var(--atlas-muted)] mt-1.5 leading-relaxed">
                Dual line drawing, 12 gold particles, resonant pulse ring, and 4-tone celestial triad chime.
              </p>
            </div>
            <div className="pt-3">
              <Button
                variant="reward"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setTestCompletionCritical(true);
                  AtlasAudio.playCompletion(true);
                  AtlasAnnounce.criticalBonus(1.5, "celestial");
                }}
              >
                Trigger Critical
              </Button>
            </div>
          </Card>

          {/* Premium Full-Screen Level Up */}
          <Card className="p-5 flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="text-[10px] font-mono text-[var(--atlas-muted)] uppercase tracking-wider">
                Ascension Moment
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--atlas-ink)] mt-1">
                Full-Screen Level-Up
              </h3>
              <p className="text-[11px] text-[var(--atlas-muted)] mt-1.5 leading-relaxed">
                Astrolabe alignment dial, major 9th chime, skippable with Esc / click, max 2.8s auto-advance.
              </p>
            </div>
            <div className="pt-3">
              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setCelebration({
                    leveledUp: true,
                    newLevel: 8,
                    xpAwarded: 500,
                    category: "Spirit",
                    bonusRoll: "critical",
                    multiplier: 1.5,
                  });
                }}
              >
                Launch Level-Up
              </Button>
            </div>
          </Card>

          {/* Streak Shield Protection */}
          <Card className="p-5 flex flex-col justify-between min-h-[190px]">
            <div>
              <div className="text-[10px] font-mono text-[var(--atlas-muted)] uppercase tracking-wider">
                Telemetry Protection
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--atlas-ink)] mt-1">
                Streak Shield Trigger
              </h3>
              <p className="text-[11px] text-[var(--atlas-muted)] mt-1.5 leading-relaxed">
                Protective acoustic chime and polite aria-live announcement when server consumes shield.
              </p>
            </div>
            <div className="pt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  AtlasAudio.playStreakShield();
                  AtlasAnnounce.streakShieldUsed(7);
                }}
              >
                Deploy Shield
              </Button>
            </div>
          </Card>
        </div>

        {/* Centralized Celestial Sound System Audition Panel */}
        <Card className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--atlas-line)] pb-3 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="reward" size="sm" className="font-mono">
                  HOWLER.JS ENGINE
                </Badge>
                <h3 className="font-display text-sm font-semibold text-[var(--atlas-ink)]">
                  Adaptive Celestial Sound Palette
                </h3>
              </div>
              <p className="text-[11px] text-[var(--atlas-muted)] mt-1">
                Airy, restrained harmonic audio. Preloads essential short sounds; lazy-loads extended assets. Never autoplays before user gesture. Suppressed in Calm Mode.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={soundEnabled ? "reward" : "outline"} size="sm">
                Sound: {soundEnabled ? "Active" : "Muted"}
              </Badge>
              <Badge variant={isCalmMode ? "warning" : "outline"} size="sm">
                Calm: {isCalmMode ? "Filtering Active" : "Full"}
              </Badge>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Completion */}
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center justify-center p-3 h-auto gap-1 border-[var(--atlas-line)] hover:border-[var(--atlas-ink)]"
              onClick={() => AtlasAudio.playCompletion(false)}
            >
              <span className="text-base">✦</span>
              <span className="font-mono text-xs font-bold text-[var(--atlas-ink)]">Completion</span>
              <span className="text-[9px] font-mono text-[var(--atlas-muted)]">Preloaded · Normal</span>
            </Button>

            {/* 2. Bonus */}
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center justify-center p-3 h-auto gap-1 border-[var(--atlas-line)] hover:border-[var(--atlas-ink)]"
              onClick={() => AtlasAudio.playBonus()}
            >
              <span className="text-base">✧</span>
              <span className="font-mono text-xs font-bold text-[var(--atlas-ink)]">Bonus</span>
              <span className="text-[9px] font-mono text-[var(--atlas-muted)]">Preloaded · Twinkle</span>
            </Button>

            {/* 3. Critical */}
            <Button
              variant="reward"
              size="sm"
              className="flex flex-col items-center justify-center p-3 h-auto gap-1"
              onClick={() => AtlasAudio.playCritical()}
            >
              <span className="text-base">★</span>
              <span className="font-mono text-xs font-bold">Critical</span>
              <span className="text-[9px] font-mono opacity-80">Preloaded · Triad</span>
            </Button>

            {/* 4. Level-Up */}
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center justify-center p-3 h-auto gap-1 border-[var(--atlas-line)] hover:border-[var(--atlas-ink)]"
              onClick={() => AtlasAudio.playLevelUp()}
            >
              <span className="text-base">⚚</span>
              <span className="font-mono text-xs font-bold text-[var(--atlas-ink)]">Level-Up</span>
              <span className="text-[9px] font-mono text-[var(--atlas-muted)]">Lazy · Ascendant</span>
            </Button>

            {/* 5. Shield */}
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center justify-center p-3 h-auto gap-1 border-[var(--atlas-line)] hover:border-[var(--atlas-ink)]"
              onClick={() => AtlasAudio.playStreakShield()}
            >
              <span className="text-base">🛡️</span>
              <span className="font-mono text-xs font-bold text-[var(--atlas-ink)]">Shield</span>
              <span className="text-[9px] font-mono text-[var(--atlas-muted)]">Lazy · Protection</span>
            </Button>

            {/* 6. Purchase */}
            <Button
              variant="outline"
              size="sm"
              className="flex flex-col items-center justify-center p-3 h-auto gap-1 border-[var(--atlas-line)] hover:border-[var(--atlas-ink)]"
              onClick={() => AtlasAudio.playPurchase()}
            >
              <span className="text-base">🪙</span>
              <span className="font-mono text-xs font-bold text-[var(--atlas-ink)]">Purchase</span>
              <span className="text-[9px] font-mono text-[var(--atlas-muted)]">Lazy · Astral Coin</span>
            </Button>
          </div>
        </Card>

        {/* Real-time Screen Reader Live Log */}
        <Card className="p-5">
          <div className="flex items-center justify-between border-b border-[var(--atlas-line)] pb-3">
            <div>
              <h3 className="font-display text-sm font-semibold text-[var(--atlas-ink)]">
                Screen Reader Live Region Stream (aria-live)
              </h3>
              <p className="text-[11px] text-[var(--atlas-muted)]">
                Real-time announcements captured for assistive technologies (aria-live=&quot;polite&quot; and aria-live=&quot;assertive&quot;).
              </p>
            </div>
            <Badge variant="outline" size="sm">
              Live Region Active
            </Badge>
          </div>

          <div className="mt-4 space-y-2 font-mono text-xs">
            {announcementHistory.length > 0 ? (
              announcementHistory.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded border border-[var(--atlas-line)] bg-[var(--atlas-bg)] p-2.5"
                >
                  <span className="text-[var(--atlas-ink)]">
                    &quot;{item.message}&quot;
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                      item.priority === "assertive"
                        ? "border-[var(--atlas-danger)]/40 text-[var(--atlas-danger)] bg-[var(--atlas-danger)]/10"
                        : "border-[var(--atlas-line)] text-[var(--atlas-muted)] bg-[var(--atlas-surface)]"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-[var(--atlas-muted)] italic text-xs">
                No announcements dispatched yet. Click any action above to test aria-live output.
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* ------------------------------------------------------------------------ */}
      {/* 6. STAR ATLAS: 3D WEBGL & DEMAND RENDERING                              */}
      {/* ------------------------------------------------------------------------ */}
      <section className="space-y-6">
        <div className="border-b border-[var(--atlas-line)] pb-4">
          <Badge variant="reward" size="sm" className="mb-2 font-mono">
            SECTION 06 · WEBGL ARCHITECTURE
          </Badge>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            Performant Constellation Atlas
          </h2>
          <p className="mt-1 text-xs text-[var(--atlas-muted)] max-w-2xl">
            R3F Canvas using <code className="text-sky-400 font-mono">frameloop=&quot;demand&quot;</code>. Zero idle loop CPU drain. Adaptive DPR (desktop vs mobile), under 1,000 triangles, 10-15 draw calls, and instant static SVG/CSS fallback when WebGL fails, offscreen, or calm mode is enabled.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Active 3D Starmap */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--atlas-line)] bg-[var(--atlas-surface)] flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-[var(--atlas-ink)]">
                  Active Star Atlas (Demand Rendered)
                </h3>
                <p className="text-[11px] text-[var(--atlas-muted)]">
                  Drag to rotate. Dev Telemetry HUD visible in development.
                </p>
              </div>
              <Badge variant="outline" size="sm">
                frameloop=&quot;demand&quot;
              </Badge>
            </div>
            <div className="h-[320px] w-full bg-[var(--atlas-bg)]">
              <StarMapShell
                level={4}
                attributes={[
                  { name: "Body", value: 30 },
                  { name: "Mind", value: 45 },
                  { name: "Discipline", value: 50 },
                  { name: "Craft", value: 20 },
                  { name: "Spirit", value: 35 },
                ]}
              />
            </div>
          </Card>

          {/* Static SVG/CSS Fallback Preview */}
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-[var(--atlas-line)] bg-[var(--atlas-surface)] flex items-center justify-between">
              <div>
                <h3 className="font-display text-sm font-semibold text-[var(--atlas-ink)]">
                  Cartographic Static Fallback Preview
                </h3>
                <p className="text-[11px] text-[var(--atlas-muted)]">
                  Identical visual identity without WebGL / GPU overhead.
                </p>
              </div>
              <Badge variant="outline" size="sm">
                Static SVG/CSS
              </Badge>
            </div>
            <div className="h-[320px] w-full bg-[var(--atlas-bg)]">
              <StarMapShell
                level={4}
                attributes={[
                  { name: "Body", value: 30 },
                  { name: "Mind", value: 45 },
                  { name: "Discipline", value: 50 },
                  { name: "Craft", value: 20 },
                  { name: "Spirit", value: 35 },
                ]}
              />
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------------------ */}
      {/* 7. ATTRIBUTES: RESPONSIVE SVG RADAR PENTAGON CHART                       */}
      {/* ------------------------------------------------------------------------ */}
      <section className="space-y-6">
        <div className="border-b border-[var(--atlas-line)] pb-4">
          <Badge variant="reward" size="sm" className="mb-2 font-mono">
            SECTION 07 · SYNERGY VISUALIZATION
          </Badge>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            Five-Aspect Attribute Radar
          </h2>
          <p className="mt-1 text-xs text-[var(--atlas-muted)] max-w-2xl">
            Lightweight, zero-library responsive SVG pentagon chart. Renders Body, Mind, Discipline, Craft, and Spirit symmetry with interactive vertex inspection and screen-reader accessibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <Card className="p-5 flex flex-col items-center justify-center min-h-[380px]">
            <AttributeRadarChart
              attributes={[
                { name: "Discipline", value: 45 },
                { name: "Mind", value: 38 },
                { name: "Craft", value: 24 },
                { name: "Spirit", value: 35 },
                { name: "Body", value: 30 },
              ]}
              targetMax={50}
            />
          </Card>

          <Card className="p-5 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-[var(--atlas-ink)]">
                Five-Fold Discipline Architecture
              </h3>
              <p className="text-xs text-[var(--atlas-muted)] mt-1 leading-relaxed">
                Vivre avoids flat linear XP meters. Quest completions are partitioned into 5 resonant human faculties to promote holistic lifestyle equilibrium.
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded border border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)]">
                <span className="text-violet-400 font-bold">◈ Discipline (Top)</span>
                <span>Consistency, Habits, Routines</span>
              </div>
              <div className="flex justify-between p-2 rounded border border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)]">
                <span className="text-sky-400 font-bold">✦ Mind (Right)</span>
                <span>Intellect, Reading, Studies</span>
              </div>
              <div className="flex justify-between p-2 rounded border border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)]">
                <span className="text-amber-400 font-bold">⚒ Craft (Lower Right)</span>
                <span>Creation, Code, Engineering</span>
              </div>
              <div className="flex justify-between p-2 rounded border border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)]">
                <span className="text-rose-400 font-bold">✧ Spirit (Lower Left)</span>
                <span>Presence, Breathing, Altruism</span>
              </div>
              <div className="flex justify-between p-2 rounded border border-[var(--atlas-line)] bg-[var(--atlas-surface-elevated)]">
                <span className="text-emerald-400 font-bold">⚡ Body (Upper Left)</span>
                <span>Physical Vitality, Rest, Nutrition</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------------------ */}
      {/* 8. WEEKLY CHALLENGES: AUTHORITATIVE COMPLETION TRACKING                  */}
      {/* ------------------------------------------------------------------------ */}
      <section className="space-y-6">
        <div className="border-b border-[var(--atlas-line)] pb-4">
          <Badge variant="reward" size="sm" className="mb-2 font-mono">
            SECTION 08 · EXPEDITION DIRECTIVES
          </Badge>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            Weekly Celestial Directives
          </h2>
          <p className="mt-1 text-xs text-[var(--atlas-muted)] max-w-2xl">
            Server-generated weekly challenges evaluated against authoritative completion history. Rewards Starlight Embers (rare currency) strictly.
          </p>
        </div>

        <WeeklyChallengesCard
          initialChallenges={[
            {
              id: "demo-ch-1",
              week_number: 37,
              week_start_date: DEMO_WEEK_START,
              week_end_date: DEMO_WEEK_END,
              title: "Way of Discipline",
              description: "Complete 5 Discipline quests to reinforce habits.",
              requirement_type: "category_count",
              target_category: "Discipline",
              target_count: 5,
              reward_rare_currency: 15,
              is_active: true,
              created_at: DEMO_WEEK_START,
              current_count: 5,
              completed: true,
              claimed: false,
              percent: 100,
            },
            {
              id: "demo-ch-2",
              week_number: 37,
              week_start_date: DEMO_WEEK_START,
              week_end_date: DEMO_WEEK_END,
              title: "Scholastic Ascent",
              description: "Complete 4 Mind quests to expand intellectual territory.",
              requirement_type: "category_count",
              target_category: "Mind",
              target_count: 4,
              reward_rare_currency: 12,
              is_active: true,
              created_at: DEMO_WEEK_START,
              current_count: 2,
              completed: false,
              claimed: false,
              percent: 50,
            },
            {
              id: "demo-ch-3",
              week_number: 37,
              week_start_date: DEMO_WEEK_START,
              week_end_date: DEMO_WEEK_END,
              title: "Astral Expedition",
              description: "Complete 7 total quests across any discipline quadrant.",
              requirement_type: "total_count",
              target_category: null,
              target_count: 7,
              reward_rare_currency: 20,
              is_active: true,
              created_at: DEMO_WEEK_START,
              current_count: 7,
              completed: true,
              claimed: true,
              percent: 100,
            },
          ]}
        />
      </section>

      {/* ------------------------------------------------------------------------ */}
      {/* 9. COSMETIC SHOP & INVENTORY ECONOMY                                    */}
      {/* ------------------------------------------------------------------------ */}
      <section className="space-y-6">
        <div className="border-b border-[var(--atlas-line)] pb-4">
          <Badge variant="reward" size="sm" className="mb-2 font-mono">
            SECTION 09 · COSMETIC ECONOMY
          </Badge>
          <h2 className="font-display text-2xl font-bold text-[var(--atlas-ink)]">
            Cosmetic Wardrobe & Atomic Shop
          </h2>
          <p className="mt-1 text-xs text-[var(--atlas-muted)] max-w-2xl">
            Cosmetics only (sky overlays, star colors, avatar frames, constellation styles). Atomic RPC <code className="text-sky-400 font-mono">purchase_item_v1</code> never trusts client prices, validates non-negative balances, prevents duplicate ownership, and enforces single-item equip slots.
          </p>
        </div>

        <CosmeticShop
          initialSoftCurrency={480}
          initialRareCurrency={35}
          initialItems={[
            {
              id: "item-1",
              name: "Aurora Borealis Overlay",
              description: "Atmospheric green and violet curtains illuminating your star map",
              cost: 120,
              currency_type: "soft",
              category: "sky_overlay",
              active: true,
            },
            {
              id: "item-2",
              name: "Nebular Void Overlay",
              description: "Deep cosmic dust cloud with resonant ultraviolet starlight",
              cost: 25,
              currency_type: "rare",
              category: "sky_overlay",
              active: true,
            },
            {
              id: "item-3",
              name: "Supernova Gold Luminary",
              description: "Pure solar gold emission for completed star nodes",
              cost: 80,
              currency_type: "soft",
              category: "star_color",
              active: true,
            },
            {
              id: "item-4",
              name: "Astrolabe Brass Frame",
              description: "Engraved brass navigational dial with quadrant markers",
              cost: 150,
              currency_type: "soft",
              category: "avatar_frame",
              active: true,
            },
            {
              id: "item-5",
              name: "Geometric Vector Style",
              description: "Crisp technical drafting lines between charted celestial nodes",
              cost: 100,
              currency_type: "soft",
              category: "constellation_style",
              active: true,
            },
          ]}
          initialInventory={[
            {
              id: "inv-1",
              user_id: "demo-user",
              item_id: "item-3",
              equipped: true,
              acquired_at: new Date().toISOString(),
              item: {
                id: "item-3",
                name: "Supernova Gold Luminary",
                description: "Pure solar gold emission for completed star nodes",
                cost: 80,
                currency_type: "soft",
                category: "star_color",
                active: true,
              },
            },
          ]}
        />
      </section>
    </div>
  );
}
