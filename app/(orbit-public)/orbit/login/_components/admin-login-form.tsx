"use client";

import { type FormEvent, useState } from "react";
import {
  CircleNotch,
  CheckCircle,
  EnvelopeSimple,
  GoogleLogo,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/auth-client";

interface AdminLoginFormProps {
  isGoogleEnabled: boolean;
}

export function AdminLoginForm({ isGoogleEnabled }: AdminLoginFormProps) {
  const [email, setEmail]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent]             = useState(false);
  const [error, setError]           = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    // callbackURL points to the verify route which checks admin role before
    // granting access. Non-admins are signed out and redirected to /orbit/login?error=not_admin.
    const result = await signIn.social({ provider: "google", callbackURL: "/api/orbit/verify" });
    if (result?.error) {
      setError(result.error.message ?? "Google sign in failed.");
      setGoogleLoading(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn.magicLink({ email, callbackURL: "/api/orbit/verify" });
    setSubmitting(false);
    if (result?.error) {
      setError(result.error.message ?? "Failed to send magic link.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 border border-primary/20 bg-primary/[0.06] p-4">
          <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Check your inbox</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Magic link sent to <strong className="text-foreground">{email}</strong>.
              Click the link to sign in — it expires in 10 minutes.
            </p>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => { setSent(false); setEmail(""); }}
          type="button"
          variant="outline"
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isGoogleEnabled && (
        <>
          <Button
            className="w-full gap-2"
            disabled={googleLoading}
            onClick={handleGoogle}
            type="button"
            variant="outline"
          >
            {googleLoading ? (
              <>
                <CircleNotch size={14} className="animate-spin" />
                Redirecting…
              </>
            ) : (
              <>
                <GoogleLogo size={14} weight="bold" />
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-foreground">
            Admin email
          </label>
          <div className="relative">
            <EnvelopeSimple
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              autoComplete="email"
              id="admin-email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              type="email"
              value={email}
              className="pl-9"
            />
          </div>
        </div>

        {error && (
          <p className="border border-destructive/20 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button className="w-full gap-2" disabled={submitting} type="submit">
          {submitting ? (
            <>
              <CircleNotch size={14} className="animate-spin" />
              Sending magic link…
            </>
          ) : (
            <>
              <EnvelopeSimple size={14} weight="bold" />
              Send magic link
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
