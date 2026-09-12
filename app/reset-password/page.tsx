"use client";

import * as React from "react";
import Link from "next/link";
import { resetPasswordAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function ResetPasswordPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await resetPasswordAction(formData);

      if (!result.success) {
        setError(result.error ?? "Failed to send reset email");
        return;
      }

      setSuccess(true);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display">Reset Coordinates</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-4 rounded-lg border border-[var(--atlas-danger)]/30 bg-[var(--atlas-danger)]/10 p-3 text-xs text-[var(--atlas-danger)]">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-[var(--atlas-success)]/30 bg-[var(--atlas-success)]/10 p-4 text-sm text-[var(--atlas-success)]">
              If an account exists for that address, recovery coordinates have been dispatched. Check your inbox.
            </div>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Return to Sign In
              </Button>
            </Link>
          </div>
        ) : (
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

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Transmitting..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-[var(--atlas-muted)]">
          Remember your password?{" "}
          <Link href="/login" className="text-[var(--atlas-ink)] font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
