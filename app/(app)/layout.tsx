import { eq } from 'drizzle-orm'
import { AppShell } from '@/components/scaffold/app-shell'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { ADMIN_ROLE } from '@/config/platform'
import { user } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()

  const [freshUser] = await db
    .select({
      email:          user.email,
      role:           user.role,
      name:           user.name,
      username:       user.username,
      image:          user.image,
      onboardingDone: user.onboardingDone,
      onboardingStep: user.onboardingStep,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  return (
    <AppShell
      email={freshUser?.email ?? session.user.email}
      isAdmin={freshUser?.role === ADMIN_ROLE}
      userImage={freshUser?.image ?? null}
    >
      {freshUser && !freshUser.onboardingDone && (
        <OnboardingModal
          name={freshUser.name ?? session.user.name ?? ''}
          username={freshUser.username ?? null}
          onboardingStep={freshUser.onboardingStep ?? 0}
          userImage={freshUser.image ?? null}
        />
      )}
      {children}
    </AppShell>
  )
}
