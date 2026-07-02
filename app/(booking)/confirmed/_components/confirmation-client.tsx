'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatInTimeZone } from 'date-fns-tz'
import {
  ArrowLeft,
  CheckCircle,
  CalendarBlank,
  CalendarPlus,
  Clock,
  MapPin,
  VideoCamera,
  Phone,
  Globe,
  ArrowsClockwise,
  X,
  UserCircle,
  Timer,
  EnvelopeSimple,
  Bell,
  Link as LinkIcon,
  Copy,
  Check,
  CaretDown,
  House,
  PencilSimple,
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PRODUCT_NAME } from '@/config/platform'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function useCountdown(startMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, startMs - now)
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return { diff, days, hours, minutes, started: diff === 0 }
}

function googleCalendarUrl(title: string, start: string, end: string, location: string) {
  const fmt = (s: string) => s.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${fmt(start)}/${fmt(end)}` +
    `&location=${encodeURIComponent(location)}`
  )
}

function outlookUrl(title: string, start: string, end: string, location: string) {
  return (
    'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent' +
    `&subject=${encodeURIComponent(title)}` +
    `&startdt=${encodeURIComponent(start)}` +
    `&enddt=${encodeURIComponent(end)}` +
    `&location=${encodeURIComponent(location)}`
  )
}

function icsEscape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsDataUrl(title: string, start: string, end: string, location: string) {
  const fmt = (s: string) => s.replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${PRODUCT_NAME}//EN`,
    'BEGIN:VEVENT',
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    `LOCATION:${icsEscape(location)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  return `data:text/calendar;charset=utf8,${encodeURIComponent(body)}`
}

function locationInfo(type: string): { icon: React.ReactNode; label: string; color: string } {
  switch (type) {
    case 'google_meet':
      return { icon: <VideoCamera size={14} weight="fill" />, label: 'Google Meet', color: 'text-primary' }
    case 'zoom':
      return { icon: <VideoCamera size={14} weight="fill" />, label: 'Zoom', color: 'text-primary' }
    case 'phone_host_calls':
      return { icon: <Phone size={14} weight="fill" />, label: 'Phone (host calls you)', color: 'text-primary' }
    case 'phone_invitee_calls':
      return { icon: <Phone size={14} weight="fill" />, label: 'Phone call', color: 'text-primary' }
    case 'in_person':
      return { icon: <MapPin size={14} weight="fill" />, label: 'In-person meeting', color: 'text-muted-foreground' }
    default:
      return { icon: <LinkIcon size={14} weight="fill" />, label: 'Online meeting', color: 'text-primary' }
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  eventName: string
  hostName: string
  hostUsername: string | null
  eventSlug?: string | null
  eventTypeId?: string | null
  startUtc: string
  endUtc: string | null
  timezone: string
  locationType: string
  locationValue?: string | null
  cancelToken: string | null
  rescheduleToken: string | null
  isPending?: boolean
  isOwner?: boolean
  showPoweredBy?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ConfirmationClient({
  eventName,
  hostName,
  hostUsername,
  eventSlug,
  eventTypeId,
  startUtc,
  endUtc,
  timezone,
  locationType,
  locationValue,
  cancelToken,
  rescheduleToken,
  isPending = false,
  isOwner = false,
  showPoweredBy = true,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [copyLinkDone, setCopyLinkDone] = useState(false)
  useEffect(() => setMounted(true), [])

  function copyPageLink() {
    const bookingUrl = hostUsername && eventSlug
      ? `${window.location.origin}/${hostUsername}/${eventSlug}`
      : window.location.href
    navigator.clipboard.writeText(bookingUrl).then(() => {
      setCopyLinkDone(true)
      setTimeout(() => setCopyLinkDone(false), 2000)
    })
  }

  const startMs = Number.isNaN(Date.parse(startUtc)) ? Date.now() : Date.parse(startUtc)
  const countdown = useCountdown(startMs)

  const startDate = new Date(startMs)
  const endDate = endUtc ? new Date(endUtc) : null

  const dateLine = formatInTimeZone(startDate, timezone, 'EEEE, MMMM d, yyyy')
  const startTime = formatInTimeZone(startDate, timezone, 'h:mm a')
  const endTime = endDate ? formatInTimeZone(endDate, timezone, 'h:mm a') : null
  const tzLabel = formatInTimeZone(startDate, timezone, 'zzz')

  const loc = locationInfo(locationType)
  const icsLocation = locationValue || loc.label
  const gcalUrl = googleCalendarUrl(eventName, startUtc, endUtc ?? startUtc, icsLocation)
  const outlookCalUrl = outlookUrl(eventName, startUtc, endUtc ?? startUtc, icsLocation)
  const icsUrl = icsDataUrl(eventName, startUtc, endUtc ?? startUtc, icsLocation)

  const countdownLabel = (() => {
    if (countdown.days > 0) return `${countdown.days}d ${countdown.hours}h`
    if (countdown.hours > 0) return `${countdown.hours}h ${countdown.minutes}m`
    if (countdown.minutes > 0) return `${countdown.minutes}m`
    return 'Starting soon'
  })()

  return (
    <div className="relative min-h-screen bg-muted/30 p-4 md:flex md:items-center md:justify-center md:p-8">

      {/* Blur decorations */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute right-[10%] top-[8%] h-72 w-72 bg-primary/[0.08] blur-[80px]" />
        <div className="absolute left-[5%] bottom-[10%] h-56 w-56 bg-primary/[0.06] blur-[70px]" />
      </div>

      {/* Toolbar — always visible on confirmation page, like Calendly */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-end gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
            >
              Menu
              <CaretDown size={11} weight="bold" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem asChild>
              {/* Owner → dashboard; invitee → host's booking profile */}
              <Link
                href={isOwner ? '/dashboard' : (hostUsername ? `/${hostUsername}` : '/')}
                className="flex items-center gap-2"
              >
                <House size={14} />
                Home
              </Link>
            </DropdownMenuItem>
            {isOwner && eventTypeId && (
              <DropdownMenuItem asChild>
                <Link href={`/event-types/${eventTypeId}`} className="flex items-center gap-2">
                  <PencilSimple size={14} />
                  Edit event type
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={copyPageLink}
          className="flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
        >
          {copyLinkDone
            ? <Check size={13} weight="bold" className="text-primary" />
            : <Copy size={13} />
          }
          <span>{copyLinkDone ? 'Copied!' : 'Copy link'}</span>
        </button>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[580px]" style={{ paddingTop: '3rem' }}>
        <div className="flex flex-col items-center gap-5 bg-card px-5 py-8 sm:px-8 border border-border">

          {/* Back button */}
          <div className="w-full">
            <Link
              href={hostUsername ? `/${hostUsername}` : '/'}
              className="inline-flex items-center gap-2 border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
          </div>

          {/* ── Icon ── */}
          <div
            className={cn(
              'relative transition-all duration-700 ease-out',
              mounted ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            )}
          >
            {isPending ? (
              <>
                <div className="absolute inset-0 scale-[2.2] bg-amber-400/20 blur-2xl" />
                <Bell
                  size={64}
                  weight="fill"
                  className="relative text-amber-500"
                />
              </>
            ) : (
              <>
                <div className="absolute inset-0 scale-[2.2] bg-primary/[0.09] blur-2xl" />
                <CheckCircle
                  size={64}
                  weight="fill"
                  className="relative text-primary"
                />
              </>
            )}
          </div>

          {/* ── Message ── */}
          <div className="text-center">
            {isPending ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Request Submitted!
                </h1>
                {hostName && (
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Your request for{' '}
                    <span className="text-amber-600">{eventName}</span> with{' '}
                    <span className="text-primary">{hostName}</span> is awaiting approval.
                  </p>
                )}
                <p className="mt-0.5 text-sm text-muted-foreground">
                  You&apos;ll receive a confirmation email once the host approves your request.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  You&apos;re Scheduled!
                </h1>
                {hostName && (
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Your meeting with <span className="text-primary">{hostName}</span> is confirmed.
                  </p>
                )}
                <p className="mt-0.5 text-sm text-muted-foreground">
                  We&apos;ve sent a calendar invite and meeting details to your email.
                </p>
              </>
            )}
          </div>

          {/* ── Meeting details card ── */}
          <div className="w-full border border-border bg-muted/30">
            <div className="border-b border-border px-5 py-2.5">
              <p className="text-sm font-bold text-foreground">{eventName}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 px-5 py-3.5">
              {hostName && (
                <div className="flex items-center gap-2">
                  <UserCircle size={14} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs text-foreground">{hostName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <CalendarBlank size={14} className="shrink-0 text-muted-foreground" />
                <span className="truncate text-xs text-foreground">{dateLine}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="shrink-0 text-muted-foreground" />
                <span className="text-xs text-foreground">
                  {startTime}{endTime ? ` – ${endTime}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('shrink-0', loc.color)}>{loc.icon}</span>
                <span className={cn('text-xs font-medium', loc.color)}>{loc.label}</span>
              </div>
              {locationValue && (
                <div className="col-span-2 flex items-start gap-2">
                  {locationType === 'in_person' ? (
                    <MapPin size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                  ) : locationType === 'phone_invitee_calls' ? (
                    <Phone size={14} className="mt-0.5 shrink-0 text-primary" />
                  ) : (
                    <LinkIcon size={14} className="mt-0.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="break-all text-xs text-foreground">{locationValue}</span>
                </div>
              )}
              <div className="col-span-2 flex items-center gap-2">
                <Globe size={14} className="shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {timezone} · {tzLabel}
                </span>
              </div>
            </div>
          </div>

          {/* ── Countdown ── */}
          {!isPending && !countdown.started && (
            <div className="flex w-full items-center justify-between bg-primary/[0.06] px-5 py-3">
              <div className="flex items-center gap-2 text-primary">
                <Timer size={15} weight="fill" />
                <span className="text-sm font-semibold">Meeting starts in</span>
              </div>
              <span className="text-[17px] font-bold tracking-tight text-primary">
                {countdownLabel}
              </span>
            </div>
          )}

          {/* ── Add to Calendar — hidden for pending bookings ── */}
          {!isPending && <div className="w-full">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add to Calendar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                {
                  href: gcalUrl,
                  download: undefined as string | undefined,
                  label: 'Google Calendar',
                  comingSoon: false,
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M6 2v2M18 2v2M2 8h20M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 14l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
                {
                  href: outlookCalUrl,
                  download: undefined,
                  label: 'Outlook',
                  comingSoon: true,
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 2v4M16 2v4M2 10h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M7 14h4M7 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  ),
                },
                {
                  href: icsUrl,
                  download: 'meeting.ics',
                  label: 'Apple Calendar',
                  comingSoon: true,
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                },
              ].map(({ href, download, label, icon, comingSoon }) =>
                comingSoon ? (
                  <div
                    key={label}
                    title="Coming soon"
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-2 border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground/50"
                  >
                    {icon}
                    <span className="truncate">{label}</span>
                    <span className="ml-auto shrink-0 bg-muted px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                      Soon
                    </span>
                  </div>
                ) : (
                  <a
                    key={label}
                    href={href}
                    download={download}
                    target={download ? undefined : '_blank'}
                    rel={download ? undefined : 'noopener noreferrer'}
                    className="flex items-center gap-2 border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/[0.05] hover:text-primary"
                  >
                    {icon}
                    {label}
                  </a>
                )
              )}
            </div>
          </div>}

          {/* ── Reschedule / Cancel — hidden for pending bookings ── */}
          {!isPending && (rescheduleToken || cancelToken) && (
            <div className="flex w-full flex-col sm:flex-row gap-3">
              {rescheduleToken && (
                <Link
                  href={`/reschedule/${rescheduleToken}`}
                  className="flex flex-1 h-10 items-center justify-center gap-1.5 border border-primary text-sm font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  <ArrowsClockwise size={13} />
                  Reschedule
                </Link>
              )}
              {cancelToken && (
                <Link
                  href={`/cancel/${cancelToken}`}
                  className="flex flex-1 h-10 items-center justify-center gap-1.5 border border-destructive/30 text-sm font-semibold text-destructive/60 transition-all hover:bg-destructive/5 hover:border-destructive hover:text-destructive"
                >
                  <X size={13} />
                  Cancel Event
                </Link>
              )}
            </div>
          )}

          {/* ── What's Next ── */}
          <div className="w-full border border-border px-5 py-3.5">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              What&apos;s Next?
            </p>
            {isPending ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <Bell size={13} weight="fill" className="shrink-0 text-amber-500" />
                  <span className="text-xs text-muted-foreground">You&apos;ll receive an email once the host approves your request</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <EnvelopeSimple size={13} weight="fill" className="shrink-0 text-amber-500" />
                  <span className="text-xs text-muted-foreground">A calendar invite will be sent to you after approval</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <EnvelopeSimple size={13} weight="fill" className="shrink-0 text-primary/70" />
                  <span className="text-xs text-muted-foreground">Check your email for confirmation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Bell size={13} weight="fill" className="shrink-0 text-primary/70" />
                  <span className="text-xs text-muted-foreground">You&apos;ll receive reminder emails before the meeting</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Schedule another meeting ── */}
          {hostUsername && (
            <Link
              href={`/${hostUsername}`}
              className="flex w-full h-10 items-center justify-center gap-1.5 border border-border text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <CalendarPlus size={14} />
              Schedule another meeting
            </Link>
          )}

        </div>
      </div>

      {/* ── Powered by <product> ── */}
      {showPoweredBy && (
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50">
          <span>Scheduling powered by</span>
          <span className="font-semibold text-primary/60">{PRODUCT_NAME}</span>
        </div>
      )}
    </div>
  )
}
