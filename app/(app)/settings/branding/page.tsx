import { eq } from 'drizzle-orm'
import { PageHeader } from '@/components/scaffold/page-header'
import { BrandingForm } from './_components/branding-form'
import { user, userProfile } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'

export const metadata = { title: 'Branding' }

export default async function BrandingPage() {
  const session = await requireSession()

  const [freshUser, profile] = await Promise.all([
    db.select({ name: user.name, image: user.image })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)
      .then((r) => r[0]),
    db.select({ displayName: userProfile.displayName })
      .from(userProfile)
      .where(eq(userProfile.userId, session.user.id))
      .limit(1)
      .then((r) => r[0]),
  ])

  const displayName = profile?.displayName ?? freshUser?.name ?? ''

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Branding"
        description="Customize how you appear on your public booking page."
      />
      <BrandingForm
        displayName={displayName}
        avatarUrl={freshUser?.image ?? null}
        initials={(displayName || session.user.name || '?').slice(0, 2).toUpperCase()}
      />
    </div>
  )
}
