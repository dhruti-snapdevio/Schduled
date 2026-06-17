import { desc, eq } from 'drizzle-orm'
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { type SessionRow, SessionsCard } from '@/components/profile/sessions-card'
import { PageHeader } from '@/components/scaffold/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { session as sessionTable } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'

export const metadata = { title: 'Security' }

export default async function SecurityPage() {
  const current = await requireSession()

  const sessions = await db
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
    .orderBy(desc(sessionTable.createdAt))

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
        eyebrow="Settings"
        title="Security"
        description="Manage your login method and active sessions."
      />

      {/* Auth method info */}
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
              <p className="text-xs text-muted-foreground">
                We send a one-time sign-in link to{' '}
                <strong>{current.user.email}</strong> — no password required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <SessionsCard sessions={sessionRows} />
    </div>
  )
}
