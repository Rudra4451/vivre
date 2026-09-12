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
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-sky-400">Reset Password</CardTitle>
          <CardDescription>
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
              If an account with that email exists, a password reset link has been sent. Check your inbox.
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
              placeholder="pilot@vivre.space"
              required
              autoComplete="email"
            />

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Remember your password?{" "}
          <Link href="/login" className="text-sky-400 hover:underline">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
