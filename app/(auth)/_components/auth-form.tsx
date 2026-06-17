"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { CircleNotch } from "@phosphor-icons/react";
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

  useEffect(() => {
    if (session) {
      router.replace("/post-auth");
    }
  }, [router, session]);

  if (isPending || session) {
    return (
      <main className="grid min-h-screen place-items-center bg-page">
        <CircleNotch size={28} className="animate-spin text-primary" />
      </main>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const callbackURL = searchParams.get("next") ?? "/post-auth";
    const result = await signIn.magicLink({ callbackURL, email });

    setSubmitting(false);
    if (result.error) {
      setError(result.error.message ?? "Failed to send magic link.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo variant="full" size="lg" href="/" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{sent ? "Check your email" : "Sign in"}</CardTitle>
            <CardDescription>
              {sent
                ? "Your one-time sign-in link is on its way."
                : "Enter your email and we'll send you a magic link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <p className="rounded-none bg-success-subtle p-3 text-success-foreground text-sm">
                  Magic link sent to <strong>{email}</strong>.
                </p>
                <Button
                  className="w-full"
                  onClick={() => setSent(false)}
                  type="button"
                  variant="secondary"
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => signIn.social({ provider: "google", callbackURL: "/post-auth" })}
                  type="button"
                  variant="outline"
                >
                  Continue with Google
                </Button>

                <div className="relative flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <form className="space-y-4" onSubmit={onSubmit}>
                  <label className="block" htmlFor="email">
                    <span className="mb-2 block font-semibold text-foreground text-sm">
                      Email
                    </span>
                    <Input
                      autoComplete="email"
                      id="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </label>
                  {error && (
                    <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">
                      {error}
                    </p>
                  )}
                  <Button className="w-full" disabled={submitting} type="submit">
                    {submitting ? "Sending..." : "Send magic link"}
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
