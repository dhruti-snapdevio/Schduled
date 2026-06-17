import { eq } from 'drizzle-orm'
import { GoogleLogo, VideoCamera } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/scaffold/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { connectedCalendar } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { env } from '@/lib/env'

export const metadata = { title: 'Integrations' }

interface IntegrationRowProps {
  icon: React.ReactNode
  name: string
  description: string
  badge?: React.ReactNode
  action?: React.ReactNode
}

function IntegrationRow({ icon, name, description, badge, action }: IntegrationRowProps) {
  return (
    <div className="flex items-center gap-4 py-5">
      <div className="flex size-10 shrink-0 items-center justify-center bg-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{name}</p>
          {badge}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

export default async function IntegrationsPage() {
  const session = await requireSession()

  const googleCal = await db
    .select({ id: connectedCalendar.id, accountEmail: connectedCalendar.accountEmail, status: connectedCalendar.status })
    .from(connectedCalendar)
    .where(eq(connectedCalendar.userId, session.user.id))
    .limit(1)
    .then((r) => r[0])

  const googleConnectUrl = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/google?returnTo=/settings/integrations`
  const googleConfigured = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Integrations"
        description="Connect third-party services to power your meetings."
      />

      <Card>
        <CardHeader>
          <CardTitle>Video Conferencing</CardTitle>
          <CardDescription>Automatically generate meeting links for your bookings.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0 px-6">
          {/* Google Meet */}
          <IntegrationRow
            icon={<GoogleLogo size={20} weight="bold" />}
            name="Google Meet"
            description="Generate Google Meet links automatically when Google Calendar is connected."
            badge={
              googleCal?.status === 'connected'
                ? <Badge variant="secondary" className="text-[var(--success-foreground)]">Active</Badge>
                : <Badge variant="secondary">Not connected</Badge>
            }
            action={
              googleCal?.status === 'connected' ? (
                <Button asChild variant="outline" size="sm">
                  <a href="/settings/calendars">Manage</a>
                </Button>
              ) : googleConfigured ? (
                <Button asChild size="sm">
                  <a href={googleConnectUrl}>Connect</a>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Requires setup</span>
              )
            }
          />

          {/* Zoom */}
          <IntegrationRow
            icon={<VideoCamera size={20} />}
            name="Zoom"
            description="Generate Zoom meeting links automatically for video bookings."
            badge={<Badge variant="secondary">Pending approval</Badge>}
            action={
              <Button variant="outline" size="sm" disabled>
                Coming soon
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>Manage calendar connections used for scheduling.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0 px-6">
          <IntegrationRow
            icon={<GoogleLogo size={20} weight="bold" />}
            name="Google Calendar"
            description={
              googleCal?.status === 'connected'
                ? `Connected as ${googleCal.accountEmail}`
                : 'Sync bookings and check availability with Google Calendar.'
            }
            badge={
              googleCal?.status === 'connected'
                ? <Badge variant="secondary" className="text-[var(--success-foreground)]">Connected</Badge>
                : undefined
            }
            action={
              <Button asChild variant="outline" size="sm">
                <a href="/settings/calendars">
                  {googleCal?.status === 'connected' ? 'Manage' : 'Connect'}
                </a>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
