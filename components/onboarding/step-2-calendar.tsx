'use client'

import { useState } from 'react'
import { GoogleLogo, CheckCircle, CalendarBlank } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { skipCalendarStep } from '@/app/actions/onboarding'

interface StepCalendarProps {
  calendarConnected: boolean
  appUrl: string
  onNext: () => void
  onBack: () => void
}

export function StepCalendar({
  calendarConnected,
  appUrl,
  onNext,
  onBack,
}: StepCalendarProps) {
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState('')

  async function handleSkip() {
    setSkipping(true)
    setError('')
    const result = await skipCalendarStep()
    setSkipping(false)
    if ('error' in result) { setError(result.error); return }
    onNext()
  }

  function handleConnect() {
    // Redirect to Google OAuth — saves step=2 and redirects back with ?calendar_connected=1
    // onboarding-modal.tsx detects the URL param and advances to step 3 automatically
    window.location.href = `${appUrl}/api/integrations/google?returnTo=/dashboard`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Connect your calendar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Schduled checks your calendar for conflicts so you never get double-booked.
        </p>
      </div>

      {calendarConnected ? (
        /* Already connected — show success state */
        <div className="flex items-start gap-4 border border-green-200 bg-green-50 p-4">
          <CheckCircle size={28} weight="fill" className="shrink-0 text-green-600 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Google Calendar connected</p>
            <p className="text-sm text-green-700 mt-0.5">
              Your bookings will automatically appear in your calendar and we&apos;ll block
              off busy times.
            </p>
          </div>
        </div>
      ) : (
        /* Connect card */
        <button
          type="button"
          onClick={handleConnect}
          className="group w-full border border-border bg-card p-5 text-left transition hover:border-primary hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center border border-border bg-background">
              <GoogleLogo size={24} weight="bold" className="text-[#4285F4]" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">Google Calendar</p>
              <p className="text-sm text-muted-foreground">
                Connect to sync events and block busy times
              </p>
            </div>
            <CalendarBlank
              size={20}
              className="ml-auto shrink-0 text-muted-foreground transition group-hover:text-primary"
            />
          </div>
        </button>
      )}

      {/* What it does */}
      <ul className="space-y-2 text-sm text-muted-foreground">
        {[
          'Block times when you already have meetings',
          'Add new bookings to your calendar automatically',
          'Generate Google Meet links for video meetings',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle size={15} weight="fill" className="shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2">
        {calendarConnected ? (
          <Button className="w-full" onClick={onNext}>
            Continue
          </Button>
        ) : (
          <>
            <Button className="w-full" onClick={handleConnect}>
              <GoogleLogo size={16} weight="bold" className="mr-2" />
              Connect Google Calendar
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={handleSkip}
              disabled={skipping}
            >
              {skipping ? 'Skipping…' : 'Skip for now'}
            </Button>
          </>
        )}

        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  )
}
