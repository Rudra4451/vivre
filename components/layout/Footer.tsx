import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span>&copy; {new Date().getFullYear()} Vivre Systems. All rights reserved.</span>
        </div>
        <div className="flex space-x-6 text-slate-400">
          <Link href="/api/health" className="hover:text-slate-200 transition-colors">
            System Health
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-slate-200 transition-colors"
          >
            Documentation
          </a>
        </div>
      </div>
    </footer>
  );
}
