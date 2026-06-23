'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  Clock,
  HandWaving,
  LinkSimple,
  X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TOUR_STEPS = [
  {
    icon: HandWaving,
    title: "Welcome to Schduled!",
    description:
      "You're all set up. Let's take a quick tour so you can start getting bookings in no time.",
  },
  {
    icon: CalendarPlus,
    title: 'Create Meeting Types',
    description:
      'Meeting types are templates people use to book time with you — a 30-min call, a demo, or a consultation. Create as many as you need.',
  },
  {
    icon: Clock,
    title: 'Set Your Availability',
    description:
      'Tell Schduled when you are free each week. Your booking page will only show slots that match your schedule.',
  },
  {
    icon: LinkSimple,
    title: 'Share Your Booking Link',
    description:
      'Every account gets a unique link. Drop it in your email signature, LinkedIn, or website — invitees pick a slot and you get notified.',
  },
  {
    icon: CalendarCheck,
    title: 'Track Your Bookings',
    description:
      'All confirmed, pending, and past meetings appear in Bookings. Cancel or reschedule any of them with one click.',
  },
]

export function GuidedTour({ userId }: { userId: string }) {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)
  const storageKey = `schduled:tour:${userId}`

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) {
        setShow(true)
      }
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
  }, [storageKey])

  function dismiss() {
    try {
      localStorage.setItem(storageKey, '1')
    } catch {
      // ignore
    }
    setShow(false)
  }

  function next() {
    if (step < TOUR_STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      dismiss()
    }
  }

  if (!show) return null

  const { icon: Icon, title, description } = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-sm bg-background border border-border">

        {/* Close button */}
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close tour"
        >
          <X size={16} weight="bold" />
        </button>

        <div className="flex flex-col items-center px-8 pb-8 pt-10 text-center">

          {/* Icon container */}
          <div className="mb-5 flex h-14 w-14 items-center justify-center bg-primary/10">
            <Icon size={28} weight="duotone" className="text-primary" />
          </div>

          {/* Step counter */}
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Step {step + 1} of {TOUR_STEPS.length}
          </p>

          {/* Title */}
          <h2 className="mb-3 text-lg font-semibold">{title}</h2>

          {/* Description */}
          <p className="mb-8 text-sm leading-relaxed text-muted-foreground">{description}</p>

          {/* Dot indicators */}
          <div className="mb-6 flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  'h-1.5 transition-all duration-200',
                  i === step ? 'w-5 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/40',
                )}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              onClick={dismiss}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
            <Button onClick={next} size="sm" className="gap-1.5">
              {isLast ? 'Get started' : (
                <>Next <ArrowRight size={14} weight="bold" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
