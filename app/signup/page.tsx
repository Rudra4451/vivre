"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
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
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display">Initialize Callsign</CardTitle>
          <CardDescription>Register your cartographer profile to enter Vivre</CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-4 rounded-lg border border-[var(--atlas-danger)]/30 bg-[var(--atlas-danger)]/10 p-3 text-xs text-[var(--atlas-danger)]">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-[var(--atlas-success)]/30 bg-[var(--atlas-success)]/10 p-4 text-sm text-[var(--atlas-success)]">
              Registration request initiated. Check your inbox to verify your coordinates.
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Return to Sign In
            </Button>
          </div>
        ) : (
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

            <p className="text-[11px] text-[var(--atlas-muted)]">
              Password must be at least 8 characters and include uppercase, lowercase, and numeric characters.
            </p>

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Forge Callsign"}
            </Button>
          </form>
        )}

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
