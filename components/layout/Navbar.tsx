"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/game/store";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface NavbarProps {
  isAuthenticated?: boolean;
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  const router = useRouter();
  const { soundEnabled, toggleSound } = useUIStore();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-atlas-line bg-atlas-surface text-atlas-ink transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5">
            <span className="font-display text-xl font-bold tracking-widest text-atlas-ink">
              VIVRE
            </span>
            <span className="rounded border border-atlas-line px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-atlas-muted">
              ATLAS
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-5 text-xs font-medium uppercase tracking-wider text-atlas-muted">
            <Link href="/" className="hover:text-atlas-ink transition-colors">
              Overview
            </Link>
            {isAuthenticated && (
              <Link href="/app" className="hover:text-atlas-ink transition-colors">
                Command Deck
              </Link>
            )}
            <Link href="/showcase" className="hover:text-atlas-ink transition-colors">
              Atlas System
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {/* Celestial Theme Toggle */}
          <ThemeToggle />

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            aria-label="Toggle audio effects"
            className="hidden sm:inline-flex text-xs text-atlas-muted hover:text-atlas-ink"
          >
            {soundEnabled ? "Audio: On" : "Audio: Muted"}
          </Button>

          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Initialize
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
