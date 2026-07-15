"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  CircleNotch,
  Envelope,
  GoogleLogo,
  LockSimple,
  PaperPlaneTilt,
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
import { MIN_PASSWORD_LENGTH, PRODUCT_NAME } from "@/config/platform";
import { signIn, signUp, useSession } from "@/lib/auth-client";

interface InviteAcceptFormProps {
  email: string;
  role: "member" | "manager";
  googleEnabled: boolean;
  passwordEnabled: boolean;
  magicLinkEnabled: boolean;
}

type Mode = "magic-link" | "password-signup";

export function InviteAcceptForm({
  email,
  role,
  googleEnabled,
  passwordEnabled,
  magicLinkEnabled,
}: InviteAcceptFormProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const hasFormMethod = passwordEnabled || magicLinkEnabled;
  const [mode, setMode] = useState<Mode>(passwordEnabled ? "password-signup" : "magic-link");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace("/post-auth");
    }
  }, [router, session]);

  if (isPending || session) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <CircleNotch size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  async function onMagicLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn.magicLink({ callbackURL: "/post-auth", email });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? "Failed to send magic link.");
      return;
    }
    setSent(true);
  }

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signUp.email({ email, password, name, callbackURL: "/post-auth" });
    setSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
    }
  }

  const roleLabel = role === "manager" ? "Manager" : "Member";

  return (
    <div className="w-full max-w-md">
      <div className="mb-6 flex justify-center lg:hidden">
        <Logo variant="full" size="lg" href="/" />
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <CardHeader>
          <CardTitle className="text-2xl">
            {sent ? "Check your email" : `Join ${PRODUCT_NAME}`}
          </CardTitle>
          <CardDescription>
            {sent
              ? "Your one-time sign-in link is on its way."
              : (
                <>
                  You've been invited as a{" "}
                  <strong className="text-foreground">{roleLabel}</strong>. Set
                  up your account for{" "}
                  <strong className="text-foreground">{email}</strong> below.
                </>
              )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className="flex size-12 items-center justify-center bg-primary/10 text-primary">
                <PaperPlaneTilt size={24} weight="fill" />
              </span>
              <p className="text-sm text-muted-foreground">
                We sent a sign-in link to
                <br />
                <strong className="text-foreground">{email}</strong>
              </p>
            </div>
          ) : !hasFormMethod ? (
            googleEnabled ? (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => signIn.social({ provider: "google", callbackURL: "/post-auth" })}
                  type="button"
                  variant="outline"
                >
                  <GoogleLogo size={16} weight="bold" className="mr-2" />
                  Continue with Google
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Use the Google account for {email}.
                </p>
              </div>
            ) : (
              <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">
                No sign-in methods are currently available. Please contact
                whoever invited you.
              </p>
            )
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2 border border-border bg-muted/40 px-3 py-2 text-sm">
                <Envelope size={15} className="shrink-0 text-muted-foreground" />
                <span className="truncate font-medium">{email}</span>
              </div>

              {mode === "password-signup" ? (
                <form className="space-y-4" onSubmit={onPasswordSubmit}>
                  <label className="block" htmlFor="name">
                    <span className="mb-2 block font-semibold text-foreground text-sm">
                      Your name
                    </span>
                    <Input
                      autoComplete="name"
                      id="name"
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      type="text"
                      value={name}
                    />
                  </label>
                  <label className="block" htmlFor="password">
                    <span className="mb-2 block font-semibold text-foreground text-sm">
                      Password
                    </span>
                    <div className="relative">
                      <LockSimple size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoComplete="new-password"
                        id="password"
                        minLength={MIN_PASSWORD_LENGTH}
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
                    <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">{error}</p>
                  )}
                  <Button className="w-full gap-2" disabled={submitting} type="submit">
                    {submitting
                      ? <><CircleNotch size={15} className="animate-spin" /> Creating account…</>
                      : "Create account"}
                  </Button>
                  {magicLinkEnabled && (
                    <button
                      className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      onClick={() => { setMode("magic-link"); setError(null); }}
                      type="button"
                    >
                      Use a magic link instead
                    </button>
                  )}
                </form>
              ) : (
                <form className="space-y-4" onSubmit={onMagicLinkSubmit}>
                  {error && (
                    <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">{error}</p>
                  )}
                  <Button className="w-full gap-2" disabled={submitting} type="submit">
                    {submitting
                      ? <><CircleNotch size={15} className="animate-spin" /> Sending…</>
                      : "Send magic link"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    We'll email you a secure sign-in link — no password needed.
                  </p>
                  {passwordEnabled && (
                    <button
                      className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      onClick={() => { setMode("password-signup"); setError(null); }}
                      type="button"
                    >
                      Set a password instead
                    </button>
                  )}
                </form>
              )}

              {googleEnabled && (
                <>
                  <div className="relative flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="shrink-0 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                      or
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      onClick={() => signIn.social({ provider: "google", callbackURL: "/post-auth" })}
                      type="button"
                      variant="outline"
                    >
                      <GoogleLogo size={16} weight="bold" className="mr-2" />
                      Continue with Google
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      Use the Google account for {email}.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
