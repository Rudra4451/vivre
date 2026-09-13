"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updatePasswordAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      const result = await updatePasswordAction(formData);

      if (!result.success) {
        setError(result.error ?? "Failed to update password");
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
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
          <CardTitle as="h1" className="text-2xl font-display">Update Coordinates</CardTitle>
          <CardDescription>
            Choose a strong passkey for your cartographer account
          </CardDescription>
        </CardHeader>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-[var(--atlas-danger)]/30 bg-[var(--atlas-danger)]/10 p-3 text-xs text-[var(--atlas-danger)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="password"
            name="password"
            label="New Password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />

          <p className="text-[11px] text-[var(--atlas-muted)]">
            Password must be at least 8 characters and include uppercase, lowercase, and numeric characters.
          </p>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Re-aligning..." : "Update Passkey"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
