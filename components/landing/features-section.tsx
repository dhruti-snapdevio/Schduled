'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bell,
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  Clock,
  Copy,
  Lightning,
  LinkSimple,
  Plus,
  X,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'calendar',
    icon: CalendarBlank,
    title: 'Connect your calendar',
    description:
      'Link Google Calendar once. Schduled reads your busy blocks in real time and hides them instantly — zero double-bookings, guaranteed.',
  },
  {
    id: 'availability',
    icon: Clock,
    title: 'Set your availability',
    description:
      'Choose which days and hours you\'re open. Your booking page only ever shows slots you can actually take.',
  },
  {
    id: 'meeting-types',
    icon: Lightning,
    title: 'Create meeting types',
    description:
      'Build reusable templates — a 30-min call, a 60-min strategy session, a quick 15-min sync. Each gets its own link.',
  },
  {
    id: 'booking-link',
    icon: LinkSimple,
    title: 'Share your booking link',
    description:
      'Put schduled.com/yourname in your email signature, website, or LinkedIn. Invitees pick a slot and you\'re done.',
  },
  {
    id: 'reminders',
    icon: Bell,
    title: 'Get booked automatically',
    description:
      'Instant confirmation emails. 24h and 1h reminders sent automatically. Reschedule links always included — no no-shows.',
  },
]

// ── Mockup components ─────────────────────────────────────────────────────────

function CalendarMockup() {
  return (
    <div className="w-full">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center bg-primary/10">
          <svg viewBox="0 0 24 24" height="22" fill="currentColor" className="text-primary" aria-hidden>
            <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Google Calendar</p>
          <p className="text-xs text-muted-foreground">jane@example.com</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
          <CheckCircle size={12} weight="fill" />
          Connected
        </div>
      </div>
      <div className="mb-3 border border-border">
        <div className="border-b border-border bg-muted/40 px-4 py-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today&apos;s events (hidden from bookers)</p>
        </div>
        {[
          { time: '9:00 – 10:00 AM', label: 'Team standup',     busy: true },
          { time: '1:00 – 2:00 PM',  label: 'Product review',   busy: true },
          { time: '3:00 – 3:30 PM',  label: 'Focus block',      busy: true },
        ].map((ev) => (
          <div key={ev.label} className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0">
            <div className="h-2 w-2 shrink-0 bg-muted-foreground/30" />
            <div className="min-w-0 flex-1">
              <p className="text-sm line-through text-muted-foreground/50">{ev.label}</p>
              <p className="text-xs text-muted-foreground/40">{ev.time}</p>
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40 border border-dashed border-muted-foreground/20 px-1.5 py-0.5">hidden</span>
          </div>
        ))}
      </div>
      <div className="border border-primary/20 bg-primary/[0.04] px-4 py-3">
        <p className="text-xs font-semibold text-primary">Busy blocks sync in real time — no manual updates needed.</p>
      </div>
    </div>
  )
}

function AvailabilityMockup() {
  const days = [
    { short: 'S', label: 'Sun', avail: false },
    { short: 'M', label: 'Mon', avail: true,  from: '9:00 am',  to: '4:30 pm' },
    { short: 'T', label: 'Tue', avail: false },
    { short: 'W', label: 'Wed', avail: true,  from: '9:30 am',  to: '5:00 pm' },
    { short: 'T', label: 'Thu', avail: true,  from: '10:00 am', to: '6:00 pm' },
    { short: 'F', label: 'Fri', avail: true,  from: '10:00 am', to: '3:00 pm' },
    { short: 'S', label: 'Sat', avail: false },
  ]
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center gap-2">
        <Clock size={15} className="text-primary" />
        <p className="text-sm font-bold text-foreground">Weekly hours</p>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">Set when you are typically available for meetings</p>
      <div className="space-y-1">
        {days.map((d, i) => (
          <div key={i} className={cn('flex items-center gap-3 px-1 py-2.5', d.avail ? '' : 'opacity-50')}>
            <div className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center text-xs font-black',
              d.avail ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}>
              {d.short}
            </div>
            {d.avail ? (
              <div className="flex flex-1 items-center gap-2">
                <div className="flex h-8 items-center border border-border bg-background px-3 text-xs font-medium text-foreground min-w-[78px]">
                  {d.from}
                </div>
                <span className="text-xs text-muted-foreground">–</span>
                <div className="flex h-8 items-center border border-border bg-background px-3 text-xs font-medium text-foreground min-w-[72px]">
                  {d.to}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <button className="flex h-7 w-7 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors">
                    <X size={12} />
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors">
                    <Plus size={12} />
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors">
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-between">
                <span className="text-xs text-muted-foreground">Unavailable</span>
                <button className="flex h-7 w-7 items-center justify-center text-muted-foreground/50 hover:text-primary transition-colors">
                  <Plus size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">Timezone:</span>
        <span className="text-xs font-semibold text-foreground">Asia/Kolkata</span>
        <span className="text-xs text-muted-foreground">▾</span>
      </div>
    </div>
  )
}

function MeetingTypesMockup() {
  const types = [
    { label: '30-min Discovery Call',  dur: '30 min', active: true  },
    { label: '60-min Strategy Session', dur: '60 min', active: false },
    { label: '15-min Quick Sync',       dur: '15 min', active: false },
  ]
  return (
    <div className="w-full space-y-2.5">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Your meeting types</p>
      {types.map((t) => (
        <div
          key={t.label}
          className={cn(
            'flex items-center justify-between border px-4 py-4 transition-all',
            t.active ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20',
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn('h-2.5 w-2.5 shrink-0', t.active ? 'bg-primary' : 'bg-muted-foreground/30')} />
            <div>
              <p className={cn('text-sm font-semibold', t.active ? 'text-foreground' : 'text-foreground/80')}>{t.label}</p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={11} /> {t.dur} · Video call
              </p>
            </div>
          </div>
          {t.active && (
            <div className="flex items-center gap-1 text-xs font-semibold text-primary">
              <Lightning size={12} weight="fill" /> Active
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center justify-center border border-dashed border-border py-3">
        <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
          <Plus size={13} /> Add meeting type
        </button>
      </div>
    </div>
  )
}

function BookingLinkMockup() {
  return (
    <div className="w-full">
      <div className="mb-5 flex items-center gap-2 border border-primary/30 bg-primary/5 px-4 py-3">
        <LinkSimple size={14} className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis font-mono text-sm text-foreground/60">
          schduled.com/<span className="font-bold text-primary">yourname</span>
        </span>
        <button className="shrink-0 text-xs font-semibold text-primary hover:underline">Copy</button>
      </div>
      <div className="overflow-hidden border border-border">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary/10 font-black text-lg text-primary">JS</div>
          <div>
            <p className="font-bold text-foreground">Jane Smith</p>
            <p className="text-xs text-muted-foreground">Product Lead · San Francisco</p>
          </div>
        </div>
        <div className="space-y-2 p-4">
          {[
            { label: '30-min Discovery Call', dur: '30 min' },
            { label: '60-min Strategy Session', dur: '60 min' },
          ].map((et, i) => (
            <div key={et.label} className={cn(
              'flex items-center justify-between border px-4 py-3',
              i === 0 ? 'border-primary/30 bg-primary/5' : 'border-border',
            )}>
              <span className="text-sm font-medium text-foreground">{et.label}</span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={11} /> {et.dur}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border bg-muted/30 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">Powered by Schduled · Free forever</p>
        </div>
      </div>
    </div>
  )
}

function RemindersMockup() {
  const notes = [
    { icon: CalendarCheck, label: 'Booking confirmed',  sub: 'Discovery Call · Today at 3:00 PM · Google Meet link included', t: 'just now', accent: true  },
    { icon: Bell,          label: 'Reminder: 24h away', sub: 'Meeting tomorrow at 3:00 PM — click to reschedule',             t: '1 day',   accent: false },
    { icon: Bell,          label: 'Reminder: 1h away',  sub: 'Your meeting starts at 3:00 PM — click to join',                t: '1 hour',  accent: false },
  ]
  return (
    <div className="w-full space-y-2.5">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Automatic emails sent to invitee</p>
      {notes.map((n) => {
        const Icon = n.icon
        return (
          <div
            key={n.label}
            className={cn(
              'flex items-start gap-3 border p-4',
              n.accent ? 'border-primary/40 bg-primary/5' : 'border-border',
            )}
          >
            <div className={cn(
              'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center',
              n.accent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}>
              <Icon size={15} weight={n.accent ? 'fill' : 'regular'} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{n.label}</p>
                <span className="shrink-0 text-[10px] text-muted-foreground/50">{n.t}</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.sub}</p>
            </div>
          </div>
        )
      })}
      <div className="border border-dashed border-border px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground/50">Every email includes a one-click reschedule link</p>
      </div>
    </div>
  )
}

const MOCKUPS = [
  <CalendarMockup key="calendar" />,
  <AvailabilityMockup key="availability" />,
  <MeetingTypesMockup key="meeting-types" />,
  <BookingLinkMockup key="booking-link" />,
  <RemindersMockup key="reminders" />,
]

// ── Main component ────────────────────────────────────────────────────────────

export function FeaturesSection() {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(true)
  const [displayed, setDisplayed] = useState(0)
  const mountedRef = useRef(false)

  // Cross-fade whenever active changes (skip the very first render)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    setVisible(false)
    const t = setTimeout(() => {
      setDisplayed(active)
      setVisible(true)
    }, 220)
    return () => clearTimeout(t)
  }, [active])

  // Auto-advance every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % STEPS.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  function switchTo(idx: number) {
    if (idx === active) return
    setActive(idx)
  }

  return (
    <section id="features" className="border-t border-border bg-muted/20 py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">

        {/* Header */}
        <div className="mb-16 text-center scroll-reveal">
          <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-primary">How it works</p>
          <h2 className="font-black text-3xl leading-tight sm:text-4xl lg:text-5xl">
            Scheduling on autopilot
            <br className="hidden sm:block" />
            <span className="text-muted-foreground"> in five steps</span>
          </h2>
          <p className="mt-4 text-muted-foreground">Set it up once. Bookings come in on their own.</p>
        </div>

        {/* Step accordion + Mockup panel */}
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">

          {/* Left: steps */}
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              const isActive = active === i
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => switchTo(i)}
                  className={cn(
                    'w-full border-b border-border text-left transition-colors last:border-0',
                    isActive ? 'bg-transparent' : 'hover:bg-muted/30',
                  )}
                >
                  <div className="flex items-center gap-4 px-2 py-5">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center transition-colors duration-200',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                    )}>
                      <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        'text-sm font-bold transition-colors duration-200',
                        isActive ? 'text-foreground' : 'text-foreground/50',
                      )}>
                        {step.title}
                      </p>
                      {/* Description expands when active */}
                      <div className={cn(
                        'grid transition-all duration-300',
                        isActive ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                      )}>
                        <div className="overflow-hidden">
                          <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    </div>
                    {/* Step number */}
                    <span className={cn(
                      'shrink-0 text-xs font-black tabular-nums transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-muted-foreground/30',
                    )}>
                      0{i + 1}
                    </span>
                  </div>
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="h-[2px] w-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Right: sticky mockup panel */}
          <div className="lg:sticky lg:top-28">
            <div className="border border-border bg-background p-7 shadow-none ring-1 ring-foreground/10">
              {/* Tab bar */}
              <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center transition-colors duration-200',
                  'bg-primary/10 text-primary',
                )}>
                  {(() => { const Icon = STEPS[displayed].icon; return <Icon size={15} weight="fill" /> })()}
                </div>
                <p className="text-sm font-bold text-foreground">{STEPS[displayed].title}</p>
                <div className="ml-auto flex items-center gap-1">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-1 transition-all duration-300',
                        i === active ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/20',
                      )}
                    />
                  ))}
                </div>
              </div>
              {/* Mockup with fade transition */}
              <div
                className="transition-opacity duration-200"
                style={{ opacity: visible ? 1 : 0 }}
              >
                {MOCKUPS[displayed]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
