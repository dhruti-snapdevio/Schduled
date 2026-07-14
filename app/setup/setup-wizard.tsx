"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Desktop,
  Eye,
  EyeSlash,
  Moon,
  Rocket,
  Spinner,
  Sun,
} from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createFirstAdmin } from "@/app/actions/setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCT_NAME } from "@/config/platform";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Appearance = "light" | "dark" | "system";

const APPEARANCE_OPTIONS: {
  value: Appearance;
  label: string;
  Icon: typeof Desktop;
}[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Desktop },
];

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {[1, 2, 3].map((n, i) => (
        <React.Fragment key={n}>
          <div
            className={cn(
              "flex size-7 items-center justify-center text-xs font-semibold transition-colors",
              n < step && "bg-primary text-primary-foreground",
              n === step && "bg-primary text-primary-foreground",
              n > step && "bg-muted text-muted-foreground"
            )}
          >
            {n < step ? <Check size={14} weight="bold" /> : n}
          </div>
          {i < 2 && (
            <div
              className={cn("h-px w-10", n < step ? "bg-primary" : "bg-border")}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function SetupWizard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // next-themes can't know the stored theme until it mounts client-side — gate
  // the selected-option highlight on mount so it never flashes the wrong one.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [step, setStep] = React.useState<"theme" | "account" | "done">("theme");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const appearance: Appearance = mounted ? ((theme as Appearance) ?? "system") : "system";

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      return setError("Full name is required");
    }
    if (!EMAIL_RE.test(email.trim())) {
      return setError("Enter a valid email address");
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
    }
    if (password !== confirm) {
      return setError("Passwords do not match");
    }

    setError("");
    setSubmitting(true);

    const res = await createFirstAdmin({ name, email, password });
    if ("error" in res) {
      setError(res.error);
      setSubmitting(false);
      return;
    }

    setStep("done");
    const signIn = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
    });
    if (signIn.error) {
      router.push("/login");
      return;
    }
    router.push("/onboarding");
  }

  const stepNumber: 1 | 2 | 3 =
    step === "theme" ? 1 : step === "account" ? 2 : 3;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page p-4">
      <div className="w-full max-w-md">
        <Stepper step={stepNumber} />

        <div className="border border-border bg-background p-8">
          {step === "theme" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center bg-primary text-primary-foreground">
                  <Rocket size={24} weight="fill" />
                </div>
                <h1 className="mt-4 text-xl font-bold">
                  Welcome to {PRODUCT_NAME}
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Let's get your instance set up. Pick your preferred appearance — you can change it later in settings.
                </p>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-semibold">Appearance</h2>
                <div className="grid grid-cols-3 gap-2">
                  {APPEARANCE_OPTIONS.map(({ value, label, Icon }) => {
                    const selected = appearance === value;
                    return (
                      <button
                        className={cn(
                          "flex flex-col items-center gap-1.5 border p-3 transition-colors hover:bg-muted/50",
                          selected
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border"
                        )}
                        key={value}
                        onClick={() => setTheme(value)}
                        type="button"
                      >
                        <Icon size={18} className="text-muted-foreground" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="gap-1.5"
                  onClick={() => setStep("account")}
                >
                  Next <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          )}

          {step === "account" && (
            <form className="space-y-5" onSubmit={handleCreate}>
              <div className="text-center">
                <h1 className="text-xl font-bold">Set up your account</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  This is the administrator account for {PRODUCT_NAME}.
                </p>
              </div>

              {error && (
                <div className="rounded-none border border-destructive/30 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="setup-name">Full name</Label>
                <Input
                  autoComplete="name"
                  disabled={submitting}
                  id="setup-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  value={name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-email">Email address</Label>
                <Input
                  autoComplete="username"
                  disabled={submitting}
                  id="setup-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-password">Password</Label>
                <div className="relative">
                  <Input
                    autoComplete="new-password"
                    disabled={submitting}
                    id="setup-password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowPassword((s) => !s)}
                    tabIndex={-1}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeSlash size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup-confirm">Confirm password</Label>
                <Input
                  autoComplete="new-password"
                  disabled={submitting}
                  id="setup-confirm"
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  className="gap-1.5"
                  disabled={submitting}
                  onClick={() => setStep("theme")}
                  type="button"
                  variant="outline"
                >
                  <ArrowLeft size={14} /> Previous
                </Button>
                <Button
                  className="gap-1.5"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting && <Spinner size={14} className="animate-spin" />}
                  Create account <ArrowRight size={14} />
                </Button>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Spinner size={32} className="animate-spin text-muted-foreground" />
              <h1 className="text-lg font-semibold">
                Setting up your workspace…
              </h1>
              <p className="text-sm text-muted-foreground">
                Administrator created successfully. Signing you in…
              </p>
            </div>
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Check size={14} weight="bold" className="text-primary" />
          Runs once — this page disappears after your first admin is created.
        </p>
      </div>
    </div>
  );
}
