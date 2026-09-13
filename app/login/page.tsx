"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function LoginForm() {
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");
  const registered = searchParams.get("registered");

  const [error, setError] = React.useState<string | null>(initialError);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await loginAction(formData);

      if (!result.success) {
        setError(result.error ?? "Authentication failed");
        setLoading(false);
        return;
      }

      if (result.redirectTo) {
        // Full page navigation ensures session cookies are reliably transmitted
        window.location.href = result.redirectTo;
      }
    } catch {
      setError("An unexpected error occurred during authentication.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle as="h1" className="text-2xl font-display">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access the command deck</CardDescription>
      </CardHeader>

      {registered && !error && (
        <div role="status" className="mb-4 rounded-lg border border-[var(--atlas-success)]/30 bg-[var(--atlas-success)]/10 p-3 text-xs text-[var(--atlas-success)] text-center">
          Callsign registered and active. Sign in below.
        </div>
      )}

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-[var(--atlas-danger)]/30 bg-[var(--atlas-danger)]/10 p-3 text-xs text-[var(--atlas-danger)]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Google OAuth Button */}
        <GoogleSignInButton label="Sign in with Google" onError={(err) => setError(err)} />

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--atlas-line)]" />
          </div>
          <span className="relative bg-[var(--atlas-surface)] px-3 text-[11px] uppercase tracking-wider text-[var(--atlas-muted)] font-mono">
            or continue with email
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            name="email"
            label="Email Address"
            type="email"
            placeholder="cartographer@vivre.space"
            required
            autoComplete="email"
          />

          <Input
            id="password"
            name="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Authenticating..." : "Access Deck"}
          </Button>
        </form>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-xs text-[var(--atlas-muted)]">
        <Link href="/reset-password" className="text-[var(--atlas-ink)] hover:underline">
          Forgot your password?
        </Link>
        <span>
          Need an account?{" "}
          <Link href="/signup" className="text-[var(--atlas-ink)] font-semibold hover:underline">
            Register callsign
          </Link>
        </span>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <React.Suspense fallback={
        <Card className="w-full max-w-md p-8 text-center text-xs text-[var(--atlas-muted)] font-mono">
          Loading Cartographer Deck...
        </Card>
      }>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
