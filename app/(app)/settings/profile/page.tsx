import { desc, eq } from 'drizzle-orm'
import {
  AccountIdentityForms,
  AvatarUploadCard,
  DeleteAccountForm,
} from '@/components/profile/account-forms'
import { type SessionRow, SessionsCard } from '@/components/profile/sessions-card'
import { PageHeader } from '@/components/scaffold/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { session as sessionTable, user } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'

export const metadata = { title: 'Profile Settings' }

export default async function ProfilePage() {
  const current = await requireSession()
  const [freshUser, sessions] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, current.user.id) }),
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
  ])

  if (!freshUser) return null

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
        eyebrow="Account"
        title="Profile Settings"
        description="Manage identity, sessions, and account data."
      />

      <AvatarUploadCard
        currentImageUrl={freshUser.image}
        name={freshUser.name ?? ''}
      />
      <AccountIdentityForms email={freshUser.email} name={freshUser.name} />
      <SessionsCard sessions={sessionRows} />

      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
          <CardDescription>
            Download a JSON archive of your profile, sessions, and audit entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" size="sm">
            <a download href="/api/account/export">Download JSON export</a>
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountForm email={freshUser.email} />
    </div>
  )
}
