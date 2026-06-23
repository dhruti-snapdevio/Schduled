import { desc, eq } from 'drizzle-orm'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { type SessionRow, SessionsCard } from '@/components/profile/sessions-card'
import { PageHeader } from '@/components/scaffold/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { bookingBlocklist, eventType, session as sessionTable } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { BookingVerificationCard } from './_components/booking-verification-card'
import { BlockedSourcesCard } from './_components/blocked-sources-card'

export const metadata = { title: 'Security' }

export default async function SecurityPage() {
  const current = await requireSession()

  const [sessions, eventTypes, blocklist] = await Promise.all([
    db
      .select({
        createdAt: sessionTable.createdAt,
        expiresAt: sessionTable.expiresAt,
        id:        sessionTable.id,
        ipAddress: sessionTable.ipAddress,
        token:     sessionTable.token,
        userAgent: sessionTable.userAgent,
      })
      .from(sessionTable)
      .where(eq(sessionTable.userId, current.user.id))
      .orderBy(desc(sessionTable.createdAt)),

    db
      .select({
        id:                       eventType.id,
        name:                     eventType.name,
        color:                    eventType.color,
        locationType:             eventType.locationType,
        requiresEmailVerification: eventType.requiresEmailVerification,
        updatedAt:                eventType.updatedAt,
      })
      .from(eventType)
      .where(eq(eventType.userId, current.user.id))
      .orderBy(eventType.name),

    db
      .select({
        id:        bookingBlocklist.id,
        pattern:   bookingBlocklist.pattern,
        type:      bookingBlocklist.type,
        note:      bookingBlocklist.note,
        createdAt: bookingBlocklist.createdAt,
      })
      .from(bookingBlocklist)
      .where(eq(bookingBlocklist.userId, current.user.id))
      .orderBy(desc(bookingBlocklist.createdAt)),
  ])

  const sessionRows: SessionRow[] = sessions.map((s) => ({
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    id:        s.id,
    ipAddress: s.ipAddress,
    isCurrent: s.token === current.session.token,
    userAgent: s.userAgent,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Security"
        description="Manage your login method, active sessions, and booking security settings."
      />

      {/* Auth method */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Method</CardTitle>
          <CardDescription>How you sign in to Schduled.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 border border-border bg-muted/40 px-4 py-3">
            <ShieldCheck size={20} className="shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Magic Link (passwordless)</p>
              <p className="text-sm text-muted-foreground">
                We send a one-time sign-in link to{' '}
                <strong>{current.user.email}</strong> — no password required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <SessionsCard sessions={sessionRows} />

      {/* Booking Verification */}
      <BookingVerificationCard
        eventTypes={eventTypes.map((e) => ({
          ...e,
          color: e.color ?? '#0d9488',
        }))}
      />

      {/* Blocked Sources */}
      <BlockedSourcesCard entries={blocklist} />
    </div>
  )
}
