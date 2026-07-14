"use client";

import { useState, useTransition } from "react";
import { LockKey } from "@phosphor-icons/react";
import { toast } from "sonner";
import { setPasswordAction } from "@/app/actions/auth";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { PasswordInput } from "@/components/common/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

// Must match `emailAndPassword.minPasswordLength` in lib/auth.ts.
const MIN_PASSWORD_LENGTH = 8;

interface Props {
  hasPassword: boolean;
  /** Whether the `emailAndPassword` plugin is enabled on this instance (NEXT_PUBLIC_PASSWORD_AUTH_ENABLED). */
  passwordAuthEnabled: boolean;
}

export function PasswordCard({ hasPassword: initialHasPassword, passwordAuthEnabled }: Props) {
  // Tracked locally (not just the server-supplied prop) so a successful "Set a
  // Password" flips the form into "Change password" mode immediately, instead
  // of re-submitting against the server guard that rejects a second set.
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const busy = pending || submitting;

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  function validate(): string | null {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (newPassword.length > 128) {
      return "Password must be at most 128 characters.";
    }
    if (newPassword !== confirmPassword) {
      return "Passwords do not match.";
    }
    if (hasPassword && !currentPassword) {
      return "Enter your current password.";
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validate();
    setError(invalid);
    if (invalid) return;

    if (!hasPassword) {
      startTransition(async () => {
        const result = await setPasswordAction(newPassword);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        reset();
        setHasPassword(true);
        toast.success("Password set", {
          description: "You can now sign in with your email and password.",
        });
      });
      return;
    }

    setSubmitting(true);
    // Keeps THIS session alive and signs out every other device.
    const { error: err } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setSubmitting(false);

    if (err) {
      setError(authErrorMessage(err.code, err.message ?? "Could not change your password."));
      return;
    }
    reset();
    toast.success("Password changed", {
      description: "Your other devices have been signed out.",
    });
  }

  if (!passwordAuthEnabled) {
    return (
      <Card>
        <CardHeader className="gap-2.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
              <LockKey size={15} weight="bold" />
            </span>
            <CardTitle className="text-base font-semibold">Password</CardTitle>
          </div>
          <CardDescription>
            {hasPassword
              ? "Password sign-in is disabled on this instance. Contact your administrator to re-enable it before changing your password."
              : "Password sign-in is disabled on this instance. Use a magic link or Google to sign in."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-2.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
            <LockKey size={15} weight="bold" />
          </span>
          <CardTitle className="text-base font-semibold">
            {hasPassword ? "Change Password" : "Set a Password"}
          </CardTitle>
        </div>
        <CardDescription>
          {hasPassword
            ? "Choose a new password. Your other devices will be signed out."
            : "You currently sign in with a magic link or Google. Add a password to sign in with your email as well."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
          {hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={busy}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={busy}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" size="sm" className="w-fit gap-2" disabled={busy}>
            {busy && <Spinner size="sm" />}
            {hasPassword ? "Change password" : "Set password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
