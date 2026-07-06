"use client";

import { type FormEvent, useState } from "react";
import {
  CheckCircle,
  CircleNotch,
  Envelope,
  GoogleLogo,
  LockSimple,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, signIn } from "@/lib/auth-client";

// All admin sign-in methods route through /api/orbit/verify, which checks the
// admin role before granting access. Non-admins are signed out and redirected
// back to /orbit/login?error=not_admin.
const ADMIN_CALLBACK = "/api/orbit/verify";

interface AdminLoginFormProps {
  isGoogleEnabled: boolean;
  passwordEnabled: boolean;
  magicLinkEnabled: boolean;
}

export function AdminLoginForm({ isGoogleEnabled, passwordEnabled, magicLinkEnabled }: AdminLoginFormProps) {
  // At least one method is always enabled (enforced admin-side). Password is
  // primary; magic link is the fallback email form. With both off it's a
  // Google-only deployment and no email form is shown.
  const hasFormMethod = passwordEnabled || magicLinkEnabled;
  const [mode, setMode] = useState<"password" | "magic-link">(
    passwordEnabled ? "password" : "magic-link",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admins bootstrapped via magic link / Google have no password yet — this lets
  // them set one from the reset email (Better Auth creates the credential on reset).
  async function handleForgot() {
    if (!email) {
      setError("Enter your admin email first, then request a reset link.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: err } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setSubmitting(false);
    if (err) {
      setError(err.message ?? "Couldn't send a reset link. Please try again.");
      return;
    }
    setResetSent(true);
  }

  async function handleGoogle() {
    setError(null);
    setGoogleLoading(true);
    const result = await signIn.social({ provider: "google", callbackURL: ADMIN_CALLBACK });
    if (result?.error) {
      setError(result.error.message ?? "Google sign in failed.");
      setGoogleLoading(false);
    }
  }

  async function onPasswordSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn.email({ email, password, callbackURL: ADMIN_CALLBACK });
    setSubmitting(false);
    if (result?.error) {
      setError(result.error.message ?? "Incorrect email or password.");
    }
    // On success Better Auth redirects to ADMIN_CALLBACK, which role-gates access.
  }

  async function onMagicLinkSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn.magicLink({ email, callbackURL: ADMIN_CALLBACK });
    setSubmitting(false);
    if (result?.error) {
      setError(result.error.message ?? "Failed to send magic link.");
      return;
    }
    setSent(true);
  }

  if (sent || resetSent) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 border border-primary/20 bg-primary/[0.06] p-4">
          <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">Check your inbox</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {resetSent
                ? <>If an admin account exists for <strong className="text-foreground">{email}</strong>, a password reset link is on its way.</>
                : <>Magic link sent to <strong className="text-foreground">{email}</strong>. Click the link to sign in — it expires in 10 minutes.</>}
            </p>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => { setSent(false); setResetSent(false); setError(null); }}
          type="button"
          variant="outline"
        >
          Use a different email
        </Button>
      </div>
    );
  }

  const showMagicSwitch = mode === "password" && magicLinkEnabled;
  const showPasswordSwitch = mode === "magic-link" && passwordEnabled;
  const hasSecondary = isGoogleEnabled || showMagicSwitch || showPasswordSwitch;

  return (
    <div className="space-y-5">
      {/* ── PRIMARY: email + password ── */}
      {!hasFormMethod ? (
        /* No email form available — Google-only, or nothing configured */
        isGoogleEnabled ? (
          <Button className="w-full gap-2" disabled={googleLoading} onClick={handleGoogle} type="button" variant="outline">
            {googleLoading
              ? <><CircleNotch size={14} className="animate-spin" /> Redirecting…</>
              : <><GoogleLogo size={14} weight="bold" /> Continue with Google</>}
          </Button>
        ) : (
          <p className="border border-destructive/20 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive">
            No sign-in methods are currently available. Check your server configuration.
          </p>
        )
      ) : mode === "password" ? (
        <form className="space-y-4" onSubmit={onPasswordSubmit}>
          <label className="block" htmlFor="admin-email">
            <span className="mb-2 block text-sm font-semibold text-foreground">Admin email</span>
            <div className="relative">
              <Envelope size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
          </label>
          <label className="block" htmlFor="admin-password">
            <span className="mb-2 block text-sm font-semibold text-foreground">Password</span>
            <div className="relative">
              <LockSimple size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoComplete="current-password"
                id="admin-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                type="password"
                value={password}
                className="pl-9"
              />
            </div>
          </label>
          {error && (
            <p className="border border-destructive/20 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="w-full gap-2" disabled={submitting} type="submit">
            {submitting
              ? <><CircleNotch size={14} className="animate-spin" /> Signing in…</>
              : "Sign in"}
          </Button>
          <button
            className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            onClick={handleForgot}
            type="button"
          >
            Forgot your password? / No password yet
          </button>
        </form>
      ) : (
        /* ── Magic-link mode ── */
        <form className="space-y-4" onSubmit={onMagicLinkSubmit}>
          <label className="block" htmlFor="admin-magic-email">
            <span className="mb-2 block text-sm font-semibold text-foreground">Admin email</span>
            <div className="relative">
              <Envelope size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoComplete="email"
                id="admin-magic-email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                type="email"
                value={email}
                className="pl-9"
              />
            </div>
          </label>
          {error && (
            <p className="border border-destructive/20 bg-destructive/[0.06] px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="w-full gap-2" disabled={submitting} type="submit">
            {submitting
              ? <><CircleNotch size={14} className="animate-spin" /> Sending magic link…</>
              : <><PaperPlaneTilt size={14} weight="bold" /> Send magic link</>}
          </Button>
        </form>
      )}

      {/* ── SECONDARY options: Google + switch method ── */}
      {hasFormMethod && hasSecondary && (
        <>
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="shrink-0 text-2xs font-medium uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-2">
            {isGoogleEnabled && (
              <Button className="w-full gap-2" disabled={googleLoading} onClick={handleGoogle} type="button" variant="outline">
                {googleLoading
                  ? <><CircleNotch size={14} className="animate-spin" /> Redirecting…</>
                  : <><GoogleLogo size={14} weight="bold" /> Continue with Google</>}
              </Button>
            )}
            {showMagicSwitch && (
              <Button className="w-full gap-2" onClick={() => { setError(null); setMode("magic-link"); }} type="button" variant="outline">
                <PaperPlaneTilt size={14} weight="bold" /> Email me a magic link
              </Button>
            )}
            {showPasswordSwitch && (
              <Button className="w-full gap-2" onClick={() => { setError(null); setMode("password"); }} type="button" variant="outline">
                <LockSimple size={14} weight="bold" /> Sign in with a password
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
