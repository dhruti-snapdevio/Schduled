'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { StepProfile } from './step-1-profile'
import { StepCalendar } from './step-2-calendar'
import { StepTimezone } from './step-3-timezone'
import { StepEventType } from './step-4-event-type'
import { StepShareLink } from './step-5-share-link'

interface OnboardingModalProps {
  initialStep: number       // user.onboardingStep from DB (0–4)
  userUsername: string | null
  userName: string
  calendarConnected: boolean
  appUrl: string
}

const TOTAL_STEPS = 5

export function OnboardingModal({
  initialStep,
  userUsername,
  userName,
  calendarConnected,
  appUrl,
}: OnboardingModalProps) {
  // initialStep is the last *completed* step (0 = none done).
  // Current UI step = initialStep + 1, capped to 1–5.
  const [step, setStep] = useState<number>(
    Math.min(Math.max(initialStep + 1, 1), TOTAL_STEPS),
  )
  // Track username saved in step 1 so step 5 can show the booking link
  const [savedUsername, setSavedUsername] = useState<string>(userUsername ?? '')
  const router = useRouter()
  const searchParams = useSearchParams()

  // After returning from Google OAuth (calendar_connected=1 in URL), advance to step 3
  useEffect(() => {
    if (searchParams.get('calendar_connected') === '1' && step <= 2) {
      setStep(3)
      // Clean the URL param without full reload
      const url = new URL(window.location.href)
      url.searchParams.delete('calendar_connected')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, step])

  function onNext() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }
  function onBack() {
    setStep((s) => Math.max(s - 1, 1))
  }
  function onComplete() {
    // Server action was already called by step 5 component.
    // Refresh so layout re-fetches onboardingDone=true and modal unmounts.
    router.refresh()
  }

  const progressPct = Math.round((step / TOTAL_STEPS) * 100)

  return (
    <Dialog open modal>
      {/* DialogContent without the built-in close button */}
      <DialogContent
        className="sm:max-w-lg w-full p-0 gap-0 overflow-hidden"
        // Remove the default ✕ close button — onboarding is non-dismissable
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Required by Radix for accessibility — visually hidden, shown to screen readers only */}
        <DialogTitle className="sr-only">Account setup — Step {step} of {TOTAL_STEPS}</DialogTitle>
        <DialogDescription className="sr-only">Complete your Schduled profile setup to get started.</DialogDescription>

        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Step label */}
        <div className="px-6 pt-5 pb-0">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Step content */}
        <div className="px-6 pb-6 pt-3">
          {step === 1 && (
            <StepProfile
              defaultName={userName}
              defaultUsername={savedUsername}
              onNext={(username) => {
                setSavedUsername(username)
                onNext()
              }}
            />
          )}
          {step === 2 && (
            <StepCalendar
              calendarConnected={calendarConnected}
              appUrl={appUrl}
              onNext={onNext}
              onBack={onBack}
            />
          )}
          {step === 3 && (
            <StepTimezone
              onNext={onNext}
              onBack={onBack}
            />
          )}
          {step === 4 && (
            <StepEventType
              onNext={onNext}
              onBack={onBack}
            />
          )}
          {step === 5 && (
            <StepShareLink
              username={savedUsername}
              appUrl={appUrl}
              onComplete={onComplete}
              onBack={onBack}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
