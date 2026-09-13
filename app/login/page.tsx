"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
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
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle as="h1" className="text-2xl font-display">Sign In</CardTitle>
          <CardDescription>Enter your credentials to access the command deck</CardDescription>
        </CardHeader>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-[var(--atlas-danger)]/30 bg-[var(--atlas-danger)]/10 p-3 text-xs text-[var(--atlas-danger)]">
            {error}
          </div>
        )}

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
    </div>
  );
}
