"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validation/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validation = signupSchema.safeParse({ email, password, username });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? "Invalid registration details");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          },
          emailRedirectTo: `${origin}/api/auth/callback`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
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
      <Card className="w-full max-w-md border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-sky-400">Initialize Callsign</CardTitle>
          <CardDescription>Register your explorer profile to enter Vivre</CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
            {error}
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
              Registration request initiated! Check your email inbox to verify your account.
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
              label="Callsign (Username)"
              type="text"
              placeholder="Astraeus_9"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />

            <Input
              id="email"
              label="Email Address"
              type="email"
              placeholder="pilot@vivre.space"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <p className="text-[11px] text-slate-500">
              Password must be at least 8 characters and include uppercase, lowercase, and numeric characters.
            </p>

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Create Callsign"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Already registered?{" "}
          <Link href="/login" className="text-sky-400 hover:underline">
            Access Deck
          </Link>
        </div>
      </Card>
    </div>
  );
}
