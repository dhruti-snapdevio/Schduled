import { eq } from 'drizzle-orm'
import { AppShell } from '@/components/scaffold/app-shell'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { ADMIN_ROLE } from '@/config/platform'
import { user, connectedCalendar } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { env } from '@/lib/env'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  const [freshUser] = await db
    .select({
      email:          user.email,
      role:           user.role,
      name:           user.name,
      username:       user.username,
      onboardingDone: user.onboardingDone,
      onboardingStep: user.onboardingStep,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  // Check if Google Calendar is already connected (needed for step 2 state)
  const calendarConnected = freshUser && !freshUser.onboardingDone
    ? !!(await db
        .select({ id: connectedCalendar.id })
        .from(connectedCalendar)
        .where(eq(connectedCalendar.userId, session.user.id))
        .limit(1)
        .then((rows) => rows[0]))
    : false

  return (
    <AppShell
      email={freshUser?.email ?? session.user.email}
      isAdmin={freshUser?.role === ADMIN_ROLE}
    >
      {freshUser && !freshUser.onboardingDone && (
        <OnboardingModal
          initialStep={freshUser.onboardingStep ?? 0}
          userUsername={freshUser.username ?? null}
          userName={freshUser.name ?? session.user.name ?? ''}
          calendarConnected={calendarConnected}
          appUrl={env.NEXT_PUBLIC_APP_URL}
        />
      )}
      {children}
    </AppShell>
  )
}
