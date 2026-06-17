import { eq } from 'drizzle-orm'
import { PageHeader } from '@/components/scaffold/page-header'
import { MyLinkForm } from './_components/my-link-form'
import { user } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { env } from '@/lib/env'

export const metadata = { title: 'My Link' }

export default async function MyLinkPage() {
  const session = await requireSession()

  const [freshUser] = await db
    .select({ username: user.username })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="My Link"
        description="Your personal booking URL. Share it anywhere to let people schedule time with you."
      />
      <MyLinkForm
        currentUsername={freshUser?.username ?? ''}
        appUrl={env.NEXT_PUBLIC_APP_URL}
      />
    </div>
  )
}
