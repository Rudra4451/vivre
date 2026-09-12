import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-atlas-line bg-atlas-surface py-8 text-center text-xs text-atlas-muted transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-display tracking-wider">
            &copy; {new Date().getFullYear()} Vivre Constellation Atlas.
          </span>
          <span className="ml-2 text-atlas-muted/70">Authoritative Cartography.</span>
        </div>
        <div className="flex space-x-6 text-atlas-muted font-mono text-[11px]">
          <Link href="/showcase" className="hover:text-atlas-ink transition-colors">
            Showcase
          </Link>
          <Link href="/api/health" className="hover:text-atlas-ink transition-colors">
            System Telemetry
          </Link>
        </div>
      </div>
    </footer>
  );
}
