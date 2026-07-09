"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  CheckCircle,
  CircleNotch,
  Eye,
  EyeSlash,
  LockSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error"); // e.g. INVALID_TOKEN from Better Auth

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const invalidLink = !token || urlError;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const { error: err } = await authClient.resetPassword({
      newPassword: password,
      token: token as string,
    });
    setSubmitting(false);

    if (err) {
      setError(err.message ?? "This reset link is invalid or has expired.");
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/login"), 2000);
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex justify-center lg:hidden">
        <Logo variant="full" size="lg" href="/" />
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <CardHeader>
          <CardTitle className="text-2xl">
            {done ? "Password updated" : "Set a new password"}
          </CardTitle>
          <CardDescription>
            {done
              ? "You can now sign in with your new password."
              : "Choose a new password for your account."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <span className="flex size-12 items-center justify-center bg-primary/10 text-primary">
                  <CheckCircle size={24} weight="fill" />
                </span>
                <p className="text-sm text-muted-foreground">
                  Your password has been reset. Redirecting you to sign in…
                </p>
              </div>
              <Button className="w-full" onClick={() => router.replace("/login")} type="button">
                Go to sign in
              </Button>
            </div>
          ) : invalidLink ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 border border-destructive/25 bg-destructive/[0.06] px-4 py-3">
                <WarningCircle size={18} weight="fill" className="mt-0.5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Invalid or expired link</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    This password reset link is missing, invalid, or has expired.
                    Request a new one from the sign-in page.
                  </p>
                </div>
              </div>
              <Button className="w-full" onClick={() => router.replace("/login")} type="button">
                Back to sign in
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block" htmlFor="new-password">
                <span className="mb-2 block font-semibold text-foreground text-sm">
                  New password
                </span>
                <div className="relative">
                  <LockSimple size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoComplete="new-password"
                    id="new-password"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <Eye size={16} /> : <EyeSlash size={16} />}
                  </button>
                </div>
              </label>
              <label className="block" htmlFor="confirm-password">
                <span className="mb-2 block font-semibold text-foreground text-sm">
                  Confirm new password
                </span>
                <div className="relative">
                  <LockSimple size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoComplete="new-password"
                    id="confirm-password"
                    minLength={8}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder="••••••••"
                    required
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    className="pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <Eye size={16} /> : <EyeSlash size={16} />}
                  </button>
                </div>
              </label>
              {error && (
                <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">
                  {error}
                </p>
              )}
              <Button className="w-full gap-2" disabled={submitting} type="submit">
                {submitting ? <><CircleNotch size={15} className="animate-spin" /> Updating…</> : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
