"use client";

import * as React from "react";
import Link from "next/link";
import { signupAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function SignupPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await signupAction(formData);

      if (!result.success) {
        setError(result.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      if (result.redirectTo) {
        window.location.href = result.redirectTo;
      }
    } catch {
      setError("An unexpected error occurred during registration.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle as="h1" className="text-2xl font-display">Initialize Callsign</CardTitle>
          <CardDescription>Register your cartographer profile to enter Vivre</CardDescription>
        </CardHeader>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-[var(--atlas-danger)]/30 bg-[var(--atlas-danger)]/10 p-3 text-xs text-[var(--atlas-danger)]">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Google OAuth Button */}
          <GoogleSignInButton label="Continue with Google" onError={(err) => setError(err)} />

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--atlas-line)]" />
            </div>
            <span className="relative bg-[var(--atlas-surface)] px-3 text-[11px] uppercase tracking-wider text-[var(--atlas-muted)] font-mono">
              or register with email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="username"
              name="username"
              label="Callsign (Username)"
              type="text"
              placeholder="Astraeus"
              required
              autoComplete="username"
            />

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
              autoComplete="new-password"
            />

            <p className="text-[11px] text-[var(--atlas-muted)] font-mono">
              Password must be at least 8 characters and include uppercase, lowercase, and numbers.
            </p>

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Registering & Entering Deck..." : "Forge Callsign & Enter Deck"}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-[var(--atlas-muted)]">
          Already registered?{" "}
          <Link href="/login" className="text-[var(--atlas-ink)] font-semibold hover:underline">
            Access Deck
          </Link>
        </div>
      </Card>
    </div>
  );
}
