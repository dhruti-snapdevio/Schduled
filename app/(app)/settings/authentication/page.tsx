import { PageHeader } from "@/components/scaffold/page-header";
import { requireAdmin } from "@/lib/authz";
import { getStoredSignInMethods, signInMethodAvailability } from "@/lib/settings/sign-in-methods";
import { SignInMethodsGrid } from "./_components/sign-in-methods-grid";

export const metadata = { title: "Authentication" };

export default async function SettingsAuthenticationPage() {
  await requireAdmin();

  const signInMethods = await getStoredSignInMethods();
  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Authentication"
        description="Choose which methods users and admins can use to sign in. At least one must stay enabled."
      />

      <SignInMethodsGrid
        availability={signInMethodAvailability}
        initial={signInMethods}
        smtpConfigured={smtpConfigured}
      />
    </div>
  );
}
