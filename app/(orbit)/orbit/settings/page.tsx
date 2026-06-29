import {
  Envelope,
  GearSix,
  GoogleLogo,
  Lock,
  Stack,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/authz";

export const metadata = { title: "Platform Settings" };

export default async function OrbitSettingsPage() {
  await requireAdmin();

  const smtpConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER
  );
  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const zoomConfigured = !!(
    process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET
  );
  const appSecretSet = !!process.env.APP_SECRET;
  const encryptionKeySet = !!process.env.ENCRYPT_KEY;
  const databaseUrlSet = !!process.env.DATABASE_URL;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "—";
  const nodeEnv = process.env.NODE_ENV ?? "—";

  return (
    <div className="space-y-6">
      <OrbitPageHeader
        description="Read-only view of environment configuration and feature status."
        title="Platform Settings"
      />

      <div className="space-y-5">
        {/* General */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center gap-2">
              <GearSix
                className="text-muted-foreground"
                size={16}
                weight="bold"
              />
              <CardTitle className="text-base font-semibold">General</CardTitle>
            </div>
            <CardDescription>Core platform configuration.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ConfigRow label="App URL" mono value={appUrl} />
            <ConfigRow label="Environment" value={nodeEnv} />
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center gap-2">
              <Stack
                className="text-muted-foreground"
                size={16}
                weight="bold"
              />
              <CardTitle className="text-base font-semibold">
                Integrations
              </CardTitle>
            </div>
            <CardDescription>
              Third-party service connection status based on environment
              variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <StatusRow
              description="Outbound transactional email via nodemailer"
              failText="Not configured"
              icon={<Envelope size={15} weight="bold" />}
              label="SMTP / Email"
              ok={smtpConfigured}
              okText="Configured"
            />
            <StatusRow
              description="Social sign-in and Google Calendar integration"
              failText="Not configured"
              icon={<GoogleLogo size={15} weight="bold" />}
              label="Google OAuth + Calendar"
              ok={googleConfigured}
              okText="Configured"
            />
            <StatusRow
              description="Zoom OAuth for automatic meeting creation"
              failText="Not configured"
              icon={<VideoCamera size={15} weight="bold" />}
              label="Zoom"
              ok={zoomConfigured}
              okText="Configured"
            />
            <StatusRow
              description="Background job processing (reminders, emails, calendar)"
              failText="DATABASE_URL missing"
              icon={<Stack size={15} weight="bold" />}
              label="pg-boss Job Queue"
              ok={databaseUrlSet}
              okText="Configured"
            />
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center gap-2">
              <Lock className="text-muted-foreground" size={16} weight="bold" />
              <CardTitle className="text-base font-semibold">
                Security
              </CardTitle>
            </div>
            <CardDescription>
              Authentication secrets and encryption keys.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <StatusRow
              description="Better Auth session signing key (APP_SECRET)"
              failText="Not set — CRITICAL"
              icon={<Lock size={15} weight="bold" />}
              label="App Secret"
              ok={appSecretSet}
              okText="Set"
            />
            <StatusRow
              description="AES-GCM key for OAuth token storage (ENCRYPT_KEY)"
              failText="Not set — CRITICAL"
              icon={<Lock size={15} weight="bold" />}
              label="Encryption Key"
              ok={encryptionKeySet}
              okText="Set"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ConfigRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-3 first:border-0">
      <p className="text-sm font-medium">{label}</p>
      <p
        className={`text-sm text-muted-foreground ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusRow({
  icon,
  label,
  description,
  ok,
  okText,
  failText,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  ok: boolean;
  okText: string;
  failText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-border px-6 py-4 first:border-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-none border px-2.5 py-1 text-xs font-semibold ${
          ok
            ? "border-success/25 bg-success/10 text-success"
            : "border-destructive/25 bg-destructive/10 text-destructive"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-success" : "bg-destructive"}`}
        />
        {ok ? okText : failText}
      </span>
    </div>
  );
}
