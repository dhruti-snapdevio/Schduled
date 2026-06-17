import { eq } from 'drizzle-orm'
import { CalendarBlank, GoogleLogo, Plus } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/scaffold/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty } from '@/components/ui/empty'
import { connectedCalendar } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { env } from '@/lib/env'
import { CalendarActions } from './_components/calendar-actions'

export const metadata = { title: 'Calendars' }

export default async function CalendarsPage() {
  const session = await requireSession()

  const calendars = await db
    .select({
      id:              connectedCalendar.id,
      provider:        connectedCalendar.provider,
      accountEmail:    connectedCalendar.accountEmail,
      calendarName:    connectedCalendar.calendarName,
      status:          connectedCalendar.status,
      isPrimary:       connectedCalendar.isPrimary,
      isConflictCheck: connectedCalendar.isConflictCheck,
      isWriteTarget:   connectedCalendar.isWriteTarget,
      createdAt:       connectedCalendar.createdAt,
    })
    .from(connectedCalendar)
    .where(eq(connectedCalendar.userId, session.user.id))
    .orderBy(connectedCalendar.createdAt)

  const connectUrl = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/google?returnTo=/settings/calendars`
  const googleConfigured = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Calendars"
        description="Connect your calendar to check availability and add events automatically."
        action={
          googleConfigured ? (
            <Button asChild size="sm">
              <a href={connectUrl}>
                <Plus size={15} />
                Add calendar
              </a>
            </Button>
          ) : undefined
        }
      />

      {calendars.length === 0 ? (
        <Empty
          icon={<CalendarBlank />}
          title="No calendars connected"
          description="Connect a Google Calendar to automatically check your availability and add bookings."
          action={
            googleConfigured ? (
              <Button asChild>
                <a href={connectUrl}>
                  <GoogleLogo size={16} />
                  Connect Google Calendar
                </a>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Google Calendar integration not configured — add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env
              </p>
            )
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Connected Calendars</CardTitle>
            <CardDescription>
              Schduled checks these calendars for conflicts and writes new bookings to your write target.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {calendars.map((cal) => (
              <CalendarActions
                key={cal.id}
                calendar={{
                  ...cal,
                  createdAt: cal.createdAt.toISOString(),
                }}
                connectUrl={connectUrl}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
