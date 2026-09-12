"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/game/store";
import { Button } from "@/components/ui/Button";

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
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-wider text-sky-400">VIVRE</span>
            <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/20">
              EXPEDITION
            </span>
          </Link>
          <nav className="hidden md:flex space-x-4 text-sm text-slate-400">
            <Link href="/" className="hover:text-slate-100 transition-colors">
              Overview
            </Link>
            {isAuthenticated && (
              <Link href="/app" className="hover:text-slate-100 transition-colors">
                Command Deck
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            aria-label="Toggle audio effects"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            {soundEnabled ? "Audio: On" : "Audio: Muted"}
          </Button>

          {isAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
