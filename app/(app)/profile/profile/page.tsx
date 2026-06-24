import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq } from 'drizzle-orm'
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr'
import {
  AccountIdentityForms,
  AvatarUploadCard,
  DeleteAccountForm,
} from '@/components/profile/account-forms'
import { PageHeader } from '@/components/scaffold/page-header'
import { RestartTourButton } from '@/components/tour/restart-tour-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { user } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { env } from '@/lib/env'

export const metadata = { title: 'Profile Settings' }

export default async function ProfilePage() {
  const current = await requireSession()
  const freshUser = await db.query.user.findFirst({ where: eq(user.id, current.user.id) })

  if (!freshUser) notFound()

  const bookingUrl = freshUser.username
    ? `${env.NEXT_PUBLIC_APP_URL}/${freshUser.username}`
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Profile"
        description="Manage your identity and account data."
      />

      {bookingUrl && (
        <div className="flex items-center justify-between gap-4 border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Your public booking page</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground font-mono">{bookingUrl}</p>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 gap-1.5 text-xs">
            <Link href={`/${freshUser.username}`} target="_blank" rel="noopener noreferrer">
              <ArrowSquareOut size={12} />
              View page
            </Link>
          </Button>
        </div>
      )}

      <AvatarUploadCard currentImageUrl={freshUser.image} />
      <AccountIdentityForms email={freshUser.email} name={freshUser.name} />

      <Card>
        <CardHeader>
          <CardTitle>Product Tour</CardTitle>
          <CardDescription>
            Replay the guided walkthrough of meeting types, availability, your booking link, and bookings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RestartTourButton userId={current.user.id} />
        </CardContent>
      </Card>

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
