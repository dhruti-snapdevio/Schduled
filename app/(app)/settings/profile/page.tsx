import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import {
  AccountIdentityForms,
  AvatarUploadCard,
  DeleteAccountForm,
} from '@/components/profile/account-forms'
import { PageHeader } from '@/components/scaffold/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { user } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'

export const metadata = { title: 'Profile Settings' }

export default async function ProfilePage() {
  const current = await requireSession()
  const freshUser = await db.query.user.findFirst({ where: eq(user.id, current.user.id) })

  if (!freshUser) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile Settings"
        description="Manage identity and account data."
      />

      <AvatarUploadCard
        currentImageUrl={freshUser.image}
        name={freshUser.name ?? ''}
      />
      <AccountIdentityForms email={freshUser.email} name={freshUser.name} />

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
