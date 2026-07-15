import { redirect } from "next/navigation";
import { ShieldCheck, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentSession } from "@/lib/authz";
import { PANEL_ROLES } from "@/config/platform";
import { getEffectiveSignInMethods } from "@/lib/settings/sign-in-methods";
import { AdminLoginForm } from "./_components/admin-login-form";

export const metadata = { title: "Admin Login — Schduled" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getCurrentSession();

  // Already logged in → go to orbit (requireAdmin there handles role check)
  if (session) {
    if (PANEL_ROLES.includes(session.user.role as (typeof PANEL_ROLES)[number])) redirect("/orbit");
    // Logged in but NOT owner/manager — show a clear error instead of silent redirect
  }

  const { error } = await searchParams;
  const methods = await getEffectiveSignInMethods();
  const isGoogleEnabled = methods.google;
  const passwordEnabled = methods.password;
  const magicLinkEnabled = methods.magicLink;

  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-10">
      <div className="w-full max-w-md">

        {/* Brand mark */}
        <div className="mb-7 flex flex-col items-center gap-2">
          <span className="flex size-12 items-center justify-center bg-primary text-primary-foreground">
            <ShieldCheck size={24} weight="fill" />
          </span>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Orbit Admin Panel
          </p>
        </div>

        {/* Non-admin signed-in banner */}
        {session && !PANEL_ROLES.includes(session.user.role as (typeof PANEL_ROLES)[number]) && (
          <div className="mb-4 flex items-start gap-3 border border-destructive/25 bg-destructive/[0.06] px-4 py-3">
            <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Access denied</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <strong className="text-foreground">{session.user.email}</strong> does not have
                admin privileges. Sign in with an admin account below.
              </p>
            </div>
          </div>
        )}

        {/* Error from URL (e.g. after failed callback) */}
        {error === "not_admin" && !session && (
          <div className="mb-4 flex items-start gap-3 border border-destructive/25 bg-destructive/[0.06] px-4 py-3">
            <WarningCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-destructive" />
            <p className="text-xs text-muted-foreground">
              That account does not have admin access. Use your admin email below.
            </p>
          </div>
        )}

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Admin sign in</CardTitle>
            <CardDescription>
              Owner access only — admin role required. Sign in with one of the
              enabled methods below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminLoginForm
              isGoogleEnabled={isGoogleEnabled}
              magicLinkEnabled={magicLinkEnabled}
              passwordEnabled={passwordEnabled}
            />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Not an admin?{" "}
          <a href="/login" className="text-primary underline underline-offset-4 hover:opacity-80">
            Go to user login
          </a>
        </p>
      </div>
    </main>
  );
}
