import {
  CheckCircle,
  Database,
  Envelope,
  GearSix,
  GoogleLogo,
  Key,
  LockKey,
  ShieldCheck,
  Stack,
  VideoCamera,
  Warning,
  XCircle,
} from '@phosphor-icons/react/dist/ssr'
import { OrbitPageHeader } from '@/components/admin/orbit-page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { requireAdmin } from '@/lib/authz'
import { userHasPassword } from '@/lib/auth-password'
import {
  getStoredSignInMethods,
  signInMethodAvailability,
} from '@/lib/settings/sign-in-methods'
import { cn } from '@/lib/utils'
import { SignInMethodsCard } from './_components/sign-in-methods-card'
import { SettingsNav } from './_components/settings-nav'
import { AppearanceCard } from './_components/appearance-card'
import { PasswordCard } from '@/components/profile/password-card'

export const metadata = { title: 'Platform Settings' }

export default async function OrbitSettingsPage() {
  const session = await requireAdmin()

  const [signInMethods, hasPassword] = await Promise.all([
    getStoredSignInMethods(),
    userHasPassword(session.user.id),
  ])

  const smtpConfigured      = !!(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER)
  const googleConfigured    = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const zoomConfigured      = !!(process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET)
  const appSecretSet        = !!process.env.APP_SECRET
  const encryptionKeySet    = !!process.env.ENCRYPT_KEY
  const databaseUrlSet      = !!process.env.DATABASE_URL
  const passwordAuthEnabled = process.env.NEXT_PUBLIC_PASSWORD_AUTH_ENABLED === 'true'
  const signupEnabled       = process.env.SIGNUP_ENABLED === 'true'

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? '—'
  const nodeEnv = process.env.NODE_ENV ?? '—'

  const healthItems = [
    { label: 'Database',       ok: databaseUrlSet,   description: 'PostgreSQL connection',       icon: <Database size={15} weight="bold" /> },
    { label: 'SMTP / Email',   ok: smtpConfigured,   description: 'Transactional email',         icon: <Envelope size={15} weight="bold" /> },
    { label: 'Google OAuth',   ok: googleConfigured, description: 'Social sign-in + Calendar',   icon: <GoogleLogo size={15} weight="bold" /> },
    { label: 'Zoom',           ok: zoomConfigured,   description: 'Meeting creation',            icon: <VideoCamera size={15} weight="bold" /> },
    { label: 'App Secret',     ok: appSecretSet,     description: 'Session signing key',         icon: <LockKey size={15} weight="bold" /> },
    { label: 'Encryption Key', ok: encryptionKeySet, description: 'OAuth token encryption',      icon: <Key size={15} weight="bold" /> },
  ]

  const healthyCount = healthItems.filter(h => h.ok).length
  const totalCount   = healthItems.length
  const allHealthy   = healthyCount === totalCount

  return (
    <div className="space-y-4">
      <OrbitPageHeader
        title="Platform Settings"
        description="Manage sign-in methods and review environment configuration."
      />

      <SettingsNav />

      <div className="space-y-6 pt-1">

        {/* ── Platform Health ── */}
        <section id="health" className="scroll-mt-6">
          <SectionLabel
            icon={<ShieldCheck size={15} weight="bold" />}
            title="Platform Health"
            description="Status of all connected services and credentials, checked on page load."
          />

          <HealthBanner allHealthy={allHealthy} healthyCount={healthyCount} totalCount={totalCount} />

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {healthItems.map(item => (
              <HealthItem key={item.label} {...item} />
            ))}
          </div>
        </section>

        {/* ── Sign-in Methods ── */}
        <section id="sign-in" className="scroll-mt-6">
          <SignInMethodsCard
            availability={signInMethodAvailability}
            initial={signInMethods}
            smtpConfigured={smtpConfigured}
          />
        </section>

        {/* ── General ── */}
        <section id="general" className="scroll-mt-6">
          <Card>
            <SectionHeader
              icon={<GearSix size={15} weight="bold" />}
              title="General"
              description="Core platform configuration and runtime environment."
            />
            <CardContent className="p-0">
              <ConfigRow label="App URL"         value={appUrl}                                      mono />
              <ConfigRow label="Environment"     value={nodeEnv}                                     />
              <ConfigRow label="Password Auth"   value={passwordAuthEnabled ? 'Enabled' : 'Disabled'} ok={passwordAuthEnabled} />
              <ConfigRow label="User Signup"     value={signupEnabled ? 'Enabled' : 'Disabled'}       ok={signupEnabled} />
            </CardContent>
          </Card>
        </section>

        {/* ── Integrations ── */}
        <section id="integrations" className="scroll-mt-6">
          <SectionLabel
            icon={<Stack size={15} weight="bold" />}
            title="Integrations"
            description="Third-party service connection status based on environment variables."
          />
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <IntegrationCard
              icon={<Envelope size={18} weight="bold" />}
              name="SMTP / Email"
              description="Outbound transactional email via nodemailer"
              ok={smtpConfigured}
              docAnchor="email-smtp"
            />
            <IntegrationCard
              icon={<GoogleLogo size={18} weight="bold" />}
              name="Google OAuth + Calendar"
              description="Social sign-in and Google Calendar integration"
              ok={googleConfigured}
              docAnchor="google-calendar--google-meet"
            />
            <IntegrationCard
              icon={<VideoCamera size={18} weight="bold" />}
              name="Zoom"
              description="Zoom OAuth for automatic meeting creation"
              ok={zoomConfigured}
              docAnchor="zoom"
            />
            <IntegrationCard
              icon={<Stack size={18} weight="bold" />}
              name="pg-boss Job Queue"
              description="Background job processing (reminders, emails, calendar)"
              ok={databaseUrlSet}
              failText="DATABASE_URL missing"
            />
          </div>
        </section>

        <section id="security" className="scroll-mt-6">
          <Card>
            <SectionHeader
              icon={<ShieldCheck size={15} weight="bold" />}
              title="Security"
              description="Authentication secrets and encryption keys."
            />
            <CardContent className="p-0">
              <StatusRow
                icon={<LockKey size={15} weight="bold" />}
                label="App Secret"
                description="Better Auth session signing key (APP_SECRET)"
                ok={appSecretSet}
                okText="Set"
                failText="Not set — CRITICAL"
              />
              <StatusRow
                icon={<Key size={15} weight="bold" />}
                label="Encryption Key"
                description="AES-GCM key for OAuth token storage (ENCRYPT_KEY)"
                ok={encryptionKeySet}
                okText="Set"
                failText="Not set — CRITICAL"
              />
            </CardContent>
          </Card>
        </section>

        {/* ── Account (admin's own credentials) ── */}
        <section id="account" className="scroll-mt-6">
          <PasswordCard hasPassword={hasPassword} passwordAuthEnabled={passwordAuthEnabled} />
        </section>

        {/* ── Appearance ── */}
        <section id="appearance" className="scroll-mt-6">
          <AppearanceCard />
        </section>

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({
  icon, title, description,
}: {
  icon: React.ReactNode; title: string; description: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function SectionHeader({
  icon, title, description,
}: {
  icon: React.ReactNode; title: string; description: string
}) {
  return (
    <CardHeader className="gap-2.5 border-b border-border">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
          {icon}
        </span>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  )
}

function HealthItem({
  icon, label, description, ok,
}: {
  icon: React.ReactNode; label: string; description: string; ok: boolean
}) {
  return (
    <div className={cn(
      'flex flex-col gap-3 border p-4 transition-colors',
      ok
        ? 'border-success/20 bg-success/[0.03]'
        : 'border-destructive/20 bg-destructive/[0.03]'
    )}>
      <div className="flex items-center justify-between">
        <span className="flex size-7 items-center justify-center border border-border bg-muted/50 text-muted-foreground">
          {icon}
        </span>
        {ok
          ? <CheckCircle size={16} weight="fill" className="text-success" />
          : <XCircle    size={16} weight="fill" className="text-destructive" />
        }
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function ConfigRow({
  label, value, mono = false, ok,
}: {
  label: string; value: string; mono?: boolean; ok?: boolean
}) {
  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-3 first:border-0">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        {ok !== undefined && (
          <span className={cn('size-1.5 rounded-full', ok ? 'bg-success' : 'bg-muted-foreground/40')} />
        )}
        <p className={cn(
          'text-sm text-muted-foreground',
          mono && 'font-mono text-xs',
          ok === true  && 'text-success',
          ok === false && 'text-muted-foreground',
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}

function StatusRow({
  icon, label, description, ok, okText, failText,
}: {
  icon: React.ReactNode; label: string; description: string
  ok: boolean; okText: string; failText: string
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-t border-border px-6 py-4 first:border-0">
      <div className="flex items-start gap-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <span className={cn(
        'inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold',
        ok
          ? 'border-success/25 bg-success/10 text-success'
          : 'border-destructive/25 bg-destructive/10 text-destructive'
      )}>
        <span className={cn('size-1.5 rounded-full', ok ? 'bg-success' : 'bg-destructive')} />
        {ok ? okText : failText}
      </span>
    </div>
  )
}

function HealthBanner({
  allHealthy, healthyCount, totalCount,
}: {
  allHealthy: boolean; healthyCount: number; totalCount: number
}) {
  const attentionCount = totalCount - healthyCount
  return (
    <div className={cn(
      'mt-4 flex items-center justify-between gap-4 border px-5 py-4',
      allHealthy
        ? 'border-success/25 bg-success/[0.06]'
        : 'border-amber-500/25 bg-amber-500/[0.06]'
    )}>
      <div className="flex items-center gap-3">
        {allHealthy
          ? <CheckCircle size={22} weight="fill" className="shrink-0 text-success" />
          : <Warning size={22} weight="fill" className="shrink-0 text-amber-600 dark:text-amber-500" />
        }
        <div>
          <p className="text-sm font-semibold">
            {allHealthy ? 'All services operational' : `${attentionCount} service${attentionCount === 1 ? '' : 's'} need attention`}
          </p>
          <p className="text-sm text-muted-foreground">
            Checked on this page load — not a live monitor.
          </p>
        </div>
      </div>
      <div className={cn(
        'shrink-0 text-sm font-semibold tabular-nums',
        allHealthy ? 'text-success' : 'text-amber-600 dark:text-amber-500'
      )}>
        {healthyCount}/{totalCount} Healthy
      </div>
    </div>
  )
}

function IntegrationCard({
  icon, name, description, ok, failText = 'Not configured', docAnchor,
}: {
  icon: React.ReactNode; name: string; description: string; ok: boolean
  failText?: string; docAnchor?: string
}) {
  return (
    <div className={cn(
      'flex flex-col gap-3 border p-4 transition-colors',
      ok ? 'border-success/20 bg-success/[0.03]' : 'border-border'
    )}>
      <div className="flex items-center justify-between">
        <span className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
          {icon}
        </span>
        <span className={cn(
          'inline-flex shrink-0 items-center gap-1.5 border px-2 py-0.5 text-xs font-semibold',
          ok
            ? 'border-success/25 bg-success/10 text-success'
            : 'border-destructive/25 bg-destructive/10 text-destructive'
        )}>
          <span className={cn('size-1.5 rounded-full', ok ? 'bg-success' : 'bg-destructive')} />
          {ok ? 'Configured' : failText}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      {!ok && docAnchor && (
        <a
          href={`https://github.com/dhruti-snapdevio/Schduled/blob/main/docs/self-hosting/integrations.md#${docAnchor}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-primary hover:underline"
        >
          Configure →
        </a>
      )}
    </div>
  )
}
