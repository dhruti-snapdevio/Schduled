import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/authz'

export const metadata = { title: 'Onboarding' }

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>
}) {
  await requireSession()
  const { step } = await params
  const stepNum = parseInt(step, 10)

  if (isNaN(stepNum) || stepNum < 1 || stepNum > 5) {
    redirect('/onboarding/1')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-lg text-center">
        <p className="text-muted-foreground text-sm">
          Onboarding step {stepNum} of 5 — coming soon.
        </p>
      </div>
    </main>
  )
}
