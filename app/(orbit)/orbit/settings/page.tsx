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
} from '@phosphor-icons/react/dist/ssr'
import { OrbitPageHeader } from '@/components/admin/orbit-page-header'
import { CopyButton } from '@/components/orbit/copy-button'
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
    { label: 'Database',       ok: databaseUrlSet,   description: 'PostgreSQL connection',    okText: 'Connected', failText: 'Disconnected',   icon: <Database size={16} weight="bold" /> },
    { label: 'SMTP / Email',   ok: smtpConfigured,   description: 'Transactional email',      okText: 'Connected', failText: 'Not configured', icon: <Envelope size={16} weight="bold" /> },
    { label: 'Google OAuth',   ok: googleConfigured, description: 'Social sign-in + Calendar',okText: 'Connected', failText: 'Not configured', icon: <GoogleLogo size={16} weight="bold" /> },
    { label: 'Zoom',           ok: zoomConfigured,   description: 'Meeting creation',         okText: 'Connected', failText: 'Not configured', icon: <VideoCamera size={16} weight="bold" /> },
    { label: 'Job Queue',      ok: databaseUrlSet,   description: 'pg-boss background jobs',   okText: 'Running',   failText: 'Stopped',        icon: <Stack size={16} weight="bold" /> },
    { label: 'App Secret',     ok: appSecretSet,     description: 'Session signing key',       okText: 'Healthy',   failText: 'Missing',        icon: <LockKey size={16} weight="bold" /> },
    { label: 'Encryption Key', ok: encryptionKeySet, description: 'OAuth token encryption',    okText: 'Healthy',   failText: 'Missing',        icon: <Key size={16} weight="bold" /> },
  ]

  const healthyCount = healthItems.filter(h => h.ok).length
  const totalCount   = healthItems.length
  const allHealthy   = healthyCount === totalCount

  const version = process.env.npm_package_version ?? '0.1.0'
  const envName = String(nodeEnv)
  const envBadge =
    envName === 'production'
      ? { label: 'Production',  cls: 'border-success/25 bg-success/10 text-success',                          dot: 'bg-success' }
      : envName === 'staging' || envName === 'test'
      ? { label: 'Staging',     cls: 'border-primary/25 bg-primary/10 text-primary',                          dot: 'bg-primary' }
      : { label: 'Development',  cls: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-500', dot: 'bg-amber-500' }

  return (
    <div className="space-y-4">
      <OrbitPageHeader
        title="Platform Settings"
        description="Manage authentication, integrations, security and platform configuration."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold', envBadge.cls)}>
              <span className={cn('size-1.5 rounded-full', envBadge.dot)} />
              {envBadge.label}
            </span>
            <span className="inline-flex items-center border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              v{version}
            </span>
          </div>
        }
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
              <ConfigRow label="App URL"         value={appUrl}                                      mono copyable />
              <ConfigRow label="Environment"     value={nodeEnv}                                     />
              <ConfigRow label="Password Auth"   value={passwordAuthEnabled ? 'Enabled' : 'Disabled'} ok={passwordAuthEnabled} />
              <ConfigRow label="User Signup"     value={signupEnabled ? 'Enabled' : 'Disabled'}       ok={signupEnabled} />
            </CardContent>
          </Card>
        </section>


        {/* ── Account (left) + Appearance (right), side by side, equal height ── */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Account (admin's own credentials) */}
          <section id="account" className="scroll-mt-6 h-full">
            <PasswordCard hasPassword={hasPassword} passwordAuthEnabled={passwordAuthEnabled} />
          </section>

          {/* Appearance */}
          <section id="appearance" className="scroll-mt-6 h-full">
            <AppearanceCard />
          </section>
        </div>

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
  icon, label, description, ok, okText = 'Healthy', failText = 'Attention',
}: {
  icon: React.ReactNode; label: string; description: string; ok: boolean
  okText?: string; failText?: string
}) {
  return (
    <div className={cn(
      'flex flex-col gap-3 border p-4 transition-colors',
      ok
        ? 'border-success/20 bg-success/[0.03] hover:border-success/40'
        : 'border-destructive/20 bg-destructive/[0.03] hover:border-destructive/40'
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn(
          'flex size-9 shrink-0 items-center justify-center border',
          ok ? 'border-success/25 bg-success/10 text-success' : 'border-destructive/25 bg-destructive/10 text-destructive'
        )}>
          {icon}
        </span>
        <span className={cn(
          'inline-flex shrink-0 items-center gap-1.5 border px-2 py-0.5 text-xs font-semibold',
          ok ? 'border-success/25 bg-success/10 text-success' : 'border-destructive/25 bg-destructive/10 text-destructive'
        )}>
          <span className={cn('size-1.5 rounded-full', ok ? 'bg-success' : 'bg-destructive')} />
          {ok ? okText : failText}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function ConfigRow({
  label, value, mono = false, ok, copyable = false,
}: {
  label: string; value: string; mono?: boolean; ok?: boolean; copyable?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-3 first:border-0">
      <p className="shrink-0 text-sm font-medium">{label}</p>
      <div className="flex min-w-0 items-center gap-2">
        {ok !== undefined && (
          <span className={cn('size-1.5 shrink-0 rounded-full', ok ? 'bg-success' : 'bg-muted-foreground/40')} />
        )}
        <p className={cn(
          'truncate text-sm text-muted-foreground',
          mono && 'font-mono text-xs',
          ok === true  && 'text-success',
          ok === false && 'text-muted-foreground',
        )}>
          {value}
        </p>
        {copyable && value !== '—' && <CopyButton value={value} />}
      </div>
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
