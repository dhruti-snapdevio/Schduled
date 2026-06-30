"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { CircleNotch, Envelope, GoogleLogo, LockKey, PaperPlaneTilt, ShieldCheck } from "@phosphor-icons/react";
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
import { signIn, useSession } from "@/lib/auth-client";

export function AuthForm() {
  return (
    <Suspense fallback={null}>
      <AuthFormInner />
    </Suspense>
  );
}

function AuthFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const rawNext = searchParams.get("next");
  const safeNext = rawNext?.startsWith("/") ? rawNext : "/post-auth";

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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn.magicLink({ callbackURL: safeNext, email });

    setSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? "Failed to send magic link.");
      return;
    }
    setSent(true);
  }

  async function resend() {
    setResending(true);
    setError(null);
    const result = await signIn.magicLink({ callbackURL: safeNext, email });
    setResending(false);
    if (result.error) {
      setError(result.error.message ?? "Failed to resend.");
      return;
    }
    setResent(true);
    setTimeout(() => setResent(false), 3000);
  }

  return (
      <div className="w-full max-w-md">
        {/* Logo shown here on mobile; the desktop brand panel carries it on lg+ */}
        <div className="mb-6 flex justify-center lg:hidden">
          <Logo variant="full" size="lg" href="/" />
        </div>

        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <CardHeader>
            <CardTitle className="text-2xl">{sent ? "Check your email" : "Sign in"}</CardTitle>
            <CardDescription>
              {sent
                ? "Your one-time sign-in link is on its way."
                : "Enter your email and we'll send you a secure magic link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center gap-3 py-2 text-center">
                  <span className="flex size-12 items-center justify-center bg-primary/10 text-primary">
                    <PaperPlaneTilt size={24} weight="fill" />
                  </span>
                  <p className="text-sm text-muted-foreground">
                    We sent a sign-in link to
                    <br />
                    <strong className="text-foreground">{email}</strong>
                  </p>
                  {resent && (
                    <p className="bg-success-subtle px-3 py-1.5 text-success-foreground text-xs">
                      Link resent.
                    </p>
                  )}
                </div>
                {error && (
                  <p className="bg-destructive/10 p-3 text-destructive text-sm">{error}</p>
                )}
                <div className="flex flex-col gap-2">
                  <Button className="w-full gap-2" onClick={resend} disabled={resending} type="button" variant="outline">
                    {resending ? <><CircleNotch size={15} className="animate-spin" /> Resending…</> : "Resend link"}
                  </Button>
                  <Button className="w-full" onClick={() => { setSent(false); setError(null); }} type="button" variant="ghost">
                    Use a different email
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <Button
                  className="w-full"
                  onClick={() => signIn.social({ provider: "google", callbackURL: safeNext })}
                  type="button"
                  variant="outline"
                >
                  <GoogleLogo size={16} weight="bold" className="mr-2" />
                  Continue with Google
                </Button>

                <div className="relative flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="shrink-0 text-2xs font-medium uppercase tracking-wider text-muted-foreground">
                    or
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form className="space-y-4" onSubmit={onSubmit}>
                  <label className="block" htmlFor="email">
                    <span className="mb-2 block font-semibold text-foreground text-sm">
                      Email
                    </span>
                    <div className="relative">
                      <Envelope size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoComplete="email"
                        id="email"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        required
                        type="email"
                        value={email}
                        className="pl-9"
                      />
                    </div>
                  </label>
                  {error && (
                    <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">
                      {error}
                    </p>
                  )}
                  <Button className="w-full gap-2" disabled={submitting} type="submit">
                    {submitting ? <><CircleNotch size={15} className="animate-spin" /> Sending…</> : "Send magic link"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    We'll email you a secure sign-in link — no password needed.
                  </p>
                </form>

                {/* Security indicators */}
                <div className="flex items-center justify-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><LockKey size={13} /> Passwordless</span>
                  <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> Encrypted</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
