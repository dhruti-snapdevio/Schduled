"use client";

import { useState, useTransition } from "react";
import {
  CircleNotch,
  GoogleLogo,
  type Icon,
  LockKey,
  MagicWand,
  SignIn,
  Warning,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { updateSignInMethodsAction } from "@/app/actions/orbit-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { SignInMethods } from "@/lib/settings/sign-in-methods";

interface Props {
  initial: SignInMethods;
  availability: SignInMethods;
  smtpConfigured: boolean;
}

type MethodKey = keyof SignInMethods;

const METHODS: {
  key: MethodKey;
  icon: Icon;
  label: string;
  description: string;
  unavailableHint: string;
}[] = [
  {
    key: "password",
    icon: LockKey,
    label: "Email & Password",
    description:
      "Sign in with an email and password — works even with no email provider configured.",
    unavailableHint: "Disabled via NEXT_PUBLIC_PASSWORD_AUTH_ENABLED.",
  },
  {
    key: "magicLink",
    icon: MagicWand,
    label: "Magic Link",
    description:
      "Sign in with a one-time link emailed to the user. Requires SMTP to be configured for delivery.",
    unavailableHint: "Configure SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER) to enable.",
  },
  {
    key: "google",
    icon: GoogleLogo,
    label: "Google",
    description: "Sign in with a Google account.",
    unavailableHint: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable.",
  },
];

export function SignInMethodsCard({ initial, availability, smtpConfigured }: Props) {
  const [methods, setMethods] = useState<SignInMethods>(initial);
  const [saved, setSaved] = useState<SignInMethods>(initial);
  const [pending, startTransition] = useTransition();

  const enabledCount = (Object.keys(methods) as MethodKey[]).filter(
    (k) => methods[k] && availability[k]
  ).length;

  const dirty = (Object.keys(methods) as MethodKey[]).some(
    (k) => methods[k] !== saved[k]
  );

  function toggle(key: MethodKey, value: boolean) {
    // Never let the admin turn off the last remaining method.
    if (!value && enabledCount <= 1 && methods[key]) {
      toast.error("At least one sign-in method must stay enabled.");
      return;
    }
    setMethods((m) => ({ ...m, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await updateSignInMethodsAction(methods);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSaved(methods);
      toast.success("Sign-in methods updated.");
    });
  }

  return (
    <Card>
      <CardHeader className="gap-2.5 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
              <SignIn size={15} weight="bold" />
            </span>
            <CardTitle className="text-base font-semibold">
              Sign-in Methods
            </CardTitle>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            {enabledCount} of {METHODS.length} enabled
          </span>
        </div>
        <CardDescription>
          Choose which methods users and admins can use to sign in. At least one
          must stay enabled.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border">
          {METHODS.map(
            ({ key, icon: MethodIcon, label, description, unavailableHint }) => {
              const available = availability[key];
              const checked = available && methods[key];
              return (
                <div
                  className={cn(
                    "flex items-center justify-between gap-6 border-b border-border px-6 py-5 transition-colors last:border-b-0",
                    checked && "bg-primary/[0.02]"
                  )}
                  key={key}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center border transition-colors",
                        checked
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground"
                      )}
                    >
                      <MethodIcon size={18} weight="bold" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <p className="text-sm font-semibold">{label}</p>
                        {available && (
                          <span
                            className={cn(
                              "text-2xs font-bold uppercase tracking-wider",
                              checked ? "text-primary" : "text-muted-foreground/60"
                            )}
                          >
                            {checked ? "Enabled" : "Disabled"}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                      </p>
                      {!available && (
                        <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-500">
                          {unavailableHint}
                        </p>
                      )}
                      {available && key === "magicLink" && checked && !smtpConfigured && (
                        <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-500">
                          No SMTP configured — magic links are written to the
                          server log, not emailed.
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch
                    aria-label={`Toggle ${label}`}
                    checked={checked}
                    disabled={!available || pending}
                    onCheckedChange={(v) => toggle(key, v)}
                  />
                </div>
              );
            }
          )}
        </div>
      </CardContent>

      {/* Sticky save bar — slides up when there are unsaved changes */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background transition-transform duration-200 ease-out md:left-60 ${
          dirty ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Warning size={15} weight="fill" className="text-amber-500" />
            <span>Unsaved changes in Sign-in Methods</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => setMethods(saved)}
              type="button"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={pending}
              onClick={save}
              type="button"
            >
              {pending ? (
                <><CircleNotch className="animate-spin" size={13} /> Saving…</>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
