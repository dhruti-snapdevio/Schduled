'use client'

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import {
  addDays,
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import {
  Check,
  Clock,
  CaretDown,
  CaretLeft,
  CaretRight,
  Globe,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  MagnifyingGlass,
  VideoCamera,
  Phone,
  MapPin,
  Link as LinkIcon,
  Spinner,
  CalendarBlank,
  Lightning,
  Briefcase,
} from '@phosphor-icons/react'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn, normalizeTzName, dialCodeFromTz } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface HostInfo {
  id: string
  name: string
  image: string | null
  username: string
  jobTitle?: string | null
  company?: string | null
}

interface Question {
  id: string
  label: string
  type: string
  isRequired: boolean
  options: string[] | null
  placeholder: string | null
}

interface DurationOption {
  duration: number
  isDefault: boolean
}

interface EventTypeInfo {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  durations: DurationOption[]
  locationType: string
  bookingWindow: number
  policyText: string | null
  questions: Question[]
}

interface SlotInfo {
  startUtc: string
  endUtc: string
}

type Step = 'calendar' | 'form'

interface Props {
  isOwner: boolean
  host: HostInfo
  eventType: EventTypeInfo
  today: string       // server-rendered initial value; corrected client-side on mount
  maxDate: string
  availableDaysOfWeek: string[]
  blockedDates: string[]
  specialDates: string[]
}

// ── Outer helpers (stable identity — no remount on every render) ──────────────

const inputCls =
  'w-full border border-input bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60'

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  )
}

function QuestionInput({
  q,
  answers,
  setAnswers,
}: {
  q: Question
  answers: Record<string, string | string[]>
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>
}) {
  const strVal = Array.isArray(answers[q.id]) ? '' : ((answers[q.id] as string) ?? '')

  if (q.type === 'long_text') {
    return (
      <textarea
        value={strVal}
        onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
        required={q.isRequired}
        placeholder={q.placeholder ?? ''}
        rows={3}
        className={`${inputCls} resize-none py-2`}
      />
    )
  }
  if (q.type === 'single_select' || q.type === 'dropdown') {
    return (
      <Select
        value={strVal || undefined}
        onValueChange={(v) => setAnswers((p) => ({ ...p, [q.id]: v }))}
      >
        <SelectTrigger className="h-9 w-full text-sm">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {q.options?.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  if (q.type === 'multiple_select') {
    return (
      <div className="flex flex-col gap-1.5">
        {q.options?.map((opt) => {
          const arr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : []
          return (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <Checkbox
                checked={arr.includes(opt)}
                onCheckedChange={(checked) => {
                  const cur = Array.isArray(answers[q.id])
                    ? (answers[q.id] as string[])
                    : []
                  setAnswers((p) => ({
                    ...p,
                    [q.id]: checked === true
                      ? [...cur, opt]
                      : cur.filter((v) => v !== opt),
                  }))
                }}
              />
              {opt}
            </label>
          )
        })}
      </div>
    )
  }
  const typeMap: Record<string, string> = { number: 'number', date: 'date', url: 'url' }
  return (
    <input
      type={typeMap[q.type] ?? 'text'}
      value={strVal}
      onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
      required={q.isRequired}
      placeholder={q.placeholder ?? ''}
      className={`${inputCls} h-9`}
    />
  )
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const STEPS = ['Date', 'Time', 'Details']

// Build the full searchable timezone list once at module load (client-only).
// Each entry carries a pre-computed offset string and search key so filtering
// is cheap: no per-keystroke Intl calls.
interface TzEntry { tz: string; city: string; label: string; searchKey: string }

function buildTzList(): TzEntry[] {
  const now = new Date()
  let zones: string[]
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zones = (Intl as any).supportedValuesOf('timeZone') as string[]
  } catch {
    zones = [
      'Pacific/Honolulu','America/Anchorage','America/Los_Angeles','America/Phoenix',
      'America/Denver','America/Chicago','America/New_York','America/Sao_Paulo',
      'Europe/London','Europe/Paris','Europe/Helsinki','Europe/Moscow',
      'Asia/Dubai','Asia/Karachi','Asia/Kolkata','Asia/Dhaka','Asia/Bangkok',
      'Asia/Singapore','Asia/Tokyo','Australia/Perth','Australia/Sydney','Pacific/Auckland',
    ]
  }

  const offsetMinutes = (tz: string): number => {
    // Compute numeric UTC offset for sort
    try {
      const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
        .formatToParts(now)
      const raw = parts.find(p => p.type === 'timeZoneName')?.value ?? 'UTC'
      const m = raw.match(/([+-])(\d+):(\d+)/)
      if (!m) return 0
      return (m[1] === '-' ? -1 : 1) * (parseInt(m[2]) * 60 + parseInt(m[3]))
    } catch { return 0 }
  }

  return zones
    .map(tz => {
      let offset = 'UTC'
      try {
        const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' })
          .formatToParts(now)
        offset = parts.find(p => p.type === 'timeZoneName')?.value ?? 'UTC'
      } catch { /* keep UTC */ }
      const city = normalizeTzName(tz).split('/').pop() ?? normalizeTzName(tz)
      const label = `${city} (${offset})`
      const searchKey = `${tz.toLowerCase().replace(/_/g, ' ')} ${offset.toLowerCase()}`
      return { tz, city, label, searchKey }
    })
    .sort((a, b) => offsetMinutes(a.tz) - offsetMinutes(b.tz))
}

const ALL_TIMEZONES: TzEntry[] = typeof window !== 'undefined' ? buildTzList() : []

// ── Timezone Search Component ─────────────────────────────────────────────────

function TimezoneSearch({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  const list = useMemo(() => {
    if (!ALL_TIMEZONES.length) return []
    if (!search.trim()) return ALL_TIMEZONES
    const q = search.toLowerCase().replace(/[_/]/g, ' ')
    return ALL_TIMEZONES.filter(e => e.searchKey.includes(q))
  }, [search])

  // ALL_TIMEZONES is empty during SSR (built only in the browser), so the first
  // client render must match the server's plain-city fallback to avoid a
  // hydration mismatch; the offset-rich label is applied after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const currentLabel = useMemo(() => {
    const fallback = value.split('/').pop()?.replace(/_/g, ' ') ?? value
    if (!mounted) return fallback
    const found = ALL_TIMEZONES.find(e => e.tz === value)
    return found ? found.label : fallback
  }, [value, mounted])

  useEffect(() => {
    if (open) {
      // Focus input and scroll selected item into view after paint
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        selectedRef.current?.scrollIntoView({ block: 'nearest' })
      })
    } else {
      setSearch('')
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Globe size={14} className="shrink-0" />
          <span className="flex-1 truncate text-left">{currentLabel}</span>
          <CaretDown size={12} className="shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="w-72 p-0"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <MagnifyingGlass size={14} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search city or timezone…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted-foreground/60 hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Timezone list */}
        <div className="max-h-60 overflow-y-auto">
          {list.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No timezones found</p>
          ) : (
            list.map(entry => {
              const isSelected = entry.tz === value
              return (
                <button
                  key={entry.tz}
                  ref={isSelected ? selectedRef : undefined}
                  type="button"
                  onClick={() => { onChange(entry.tz); setOpen(false) }}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-muted',
                    isSelected && 'bg-primary/8 font-medium text-primary',
                  )}
                >
                  <span className="truncate">{entry.label}</span>
                  {isSelected && <Check size={13} weight="bold" className="ml-2 shrink-0" />}
                </button>
              )
            })
          )}
        </div>

        {!search && (
          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground/60">
            {ALL_TIMEZONES.length} timezones · type to search
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}

function locationMeta(type: string): { icon: React.ReactNode; label: string } {
  if (type === 'zoom' || type === 'google_meet')
    return {
      icon: <VideoCamera size={13} />,
      label: type === 'zoom' ? 'Zoom' : 'Google Meet',
    }
  if (type === 'phone_host_calls') return { icon: <Phone size={13} />, label: 'Phone (host calls you)' }
  if (type === 'phone_invitee_calls') return { icon: <Phone size={13} />, label: 'Phone call' }
  if (type === 'in_person') return { icon: <MapPin size={13} />, label: 'In-person meeting' }
  return { icon: <LinkIcon size={13} />, label: 'Online' }
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BookingCalendar({
  isOwner,
  host,
  eventType,
  today: todayProp,
  maxDate,
  availableDaysOfWeek,
  blockedDates,
  specialDates,
}: Props) {
  const defaultDuration =
    eventType.durations.find((d) => d.isDefault)?.duration ??
    eventType.durations[0]?.duration ??
    30

  const [selectedDuration, setSelectedDuration] = useState(defaultDuration)
  const [inviteeTz, setInviteeTz] = useState(() =>
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const [step, setStep] = useState<Step>('calendar')

  // today is initialised from the server prop then corrected on the client to
  // the invitee's local date (browser timezone), not the host timezone.
  const [today, setToday] = useState(todayProp)
  const [month, setMonth] = useState(() => {
    const [y, m] = todayProp.split('-').map(Number)
    return new Date(y, m - 1, 1)
  })
  useEffect(() => {
    const clientToday = format(new Date(), 'yyyy-MM-dd')
    if (clientToday !== todayProp) {
      setToday(clientToday)
      const [y, m] = clientToday.split('-').map(Number)
      setMonth(new Date(y, m - 1, 1))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Available dates fetched per-month from the server (factors in real bookings)
  const [availableDatesSet, setAvailableDatesSet] = useState<Set<string>>(new Set())
  const [loadingDays, setLoadingDays] = useState(false)

  const fetchAvailableDays = useCallback(
    async (forMonth: Date) => {
      const monthStr = format(forMonth, 'yyyy-MM')
      setLoadingDays(true)
      try {
        const res = await fetch(
          `/api/available-days?username=${host.username}&slug=${eventType.slug}&month=${monthStr}&duration=${selectedDuration}`
        )
        const data = await res.json()
        setAvailableDatesSet(new Set<string>(data.availableDates ?? []))
      } catch {
        setAvailableDatesSet(new Set())
      } finally {
        setLoadingDays(false)
      }
    },
    [host.username, eventType.slug, selectedDuration]
  )

  useEffect(() => {
    fetchAvailableDays(month)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, selectedDuration])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<SlotInfo[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)

  const slotsPanelRef = useRef<HTMLDivElement>(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [prefilled, setPrefilled] = useState(false)
  const [emailBlocked, setEmailBlocked] = useState(false)
  const [checkingBlocked, setCheckingBlocked] = useState(false)

  // Return-booker pre-fill: debounce email → lookup contact + blocklist check
  useEffect(() => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!isValidEmail) { setPrefilled(false); setEmailBlocked(false); return }

    const controller = new AbortController()
    setCheckingBlocked(true)
    const timer = setTimeout(async () => {
      try {
        const [lookupRes, blockedRes] = await Promise.all([
          fetch(
            `/api/contact-lookup?username=${encodeURIComponent(host.username)}&email=${encodeURIComponent(email)}`,
            { signal: controller.signal }
          ),
          fetch(
            `/api/check-blocked?username=${encodeURIComponent(host.username)}&email=${encodeURIComponent(email)}`,
            { signal: controller.signal }
          ),
        ])
        const [lookupData, blockedData] = await Promise.all([lookupRes.json(), blockedRes.json()])
        if (lookupData.found) {
          if (lookupData.name && !name) setName(lookupData.name)
          setPrefilled(true)
        } else {
          setPrefilled(false)
        }
        setEmailBlocked(!!blockedData.blocked)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      } finally {
        setCheckingBlocked(false)
      }
    }, 600)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const availableDowSet = new Set(availableDaysOfWeek)
  const blockedSet = new Set(blockedDates)
  const specialSet = new Set(specialDates)

  const progressStep = step === 'form' ? 3 : selectedDate ? 2 : 1

  // "Back" leaves the booking page entirely — returns the host to wherever they
  // came from (event-type list / dashboard). Falls back to the host's profile.
  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = `/${host.username}`
    }
  }

  function handleDurationChange(d: number) {
    setSelectedDuration(d)
    setSelectedDate(null)
    setSlots([])
    setSelectedSlot(null)
    setStep('calendar')
    // fetchAvailableDays is triggered by the useEffect watching [month, selectedDuration]
  }

  function isDayAvailable(dateStr: string): boolean {
    if (dateStr < today || dateStr > maxDate) return false
    if (blockedSet.has(dateStr)) return false
    // Once the server has responded, use its confirmed set (accounts for real bookings)
    if (!loadingDays) return availableDatesSet.has(dateStr)
    // Optimistic fallback while loading: DOW + special-date check
    if (specialSet.has(dateStr)) return true
    const dayName = format(new Date(`${dateStr}T12:00:00Z`), 'EEEE').toLowerCase()
    return availableDowSet.has(dayName)
  }

  const quickPicks = (() => {
    const picks: { label: string; sub: string; date: string }[] = []
    const labels = ['Today', 'Tomorrow']
    for (let i = 0; i <= 14; i++) {
      if (picks.length >= 3) break
      const d = addDays(new Date(`${today}T12:00:00Z`), i)
      const dStr = format(d, 'yyyy-MM-dd')
      if (isDayAvailable(dStr)) {
        const label = i < 2 ? labels[i] : format(d, 'EEEE')
        picks.push({ label, sub: format(d, 'MMM d'), date: dStr })
      }
    }
    return picks
  })()

  const fetchSlots = useCallback(
    async (date: string) => {
      setLoadingSlots(true)
      setSlots([])
      setSelectedSlot(null)
      try {
        const res = await fetch(
          `/api/slots?username=${host.username}&slug=${eventType.slug}&date=${date}&duration=${selectedDuration}`
        )
        const data = await res.json()
        const raw: SlotInfo[] = data.slots ?? []
        const seen = new Set<string>()
        setSlots(
          raw.filter((s) => {
            if (seen.has(s.startUtc)) return false
            seen.add(s.startUtc)
            return true
          })
        )
      } catch {
        setSlots([])
      } finally {
        setLoadingSlots(false)
      }
    },
    [host.username, eventType.slug, selectedDuration]
  )

  function handleDateClick(dateStr: string) {
    if (!isDayAvailable(dateStr)) return
    setSelectedDate(dateStr)
    fetchSlots(dateStr)
    // On mobile, the slots panel is below the calendar — scroll to it
    setTimeout(() => {
      slotsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function handleContinue() {
    if (!selectedSlot) return
    setStep('form')
    setSubmitError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return

    // Phone-type questions are collected via the dedicated phone field below,
    // not the generic answers map — exclude them from this loop or a required
    // phone question would be permanently unsubmittable.
    for (const q of eventType.questions.filter((q) => q.isRequired && q.type !== 'phone')) {
      const ans = answers[q.id]
      const val = Array.isArray(ans) ? ans.join('') : (ans ?? '')
      if (!val.trim()) {
        setSubmitError(`"${q.label}" is required`)
        return
      }
    }
    const phoneQ = eventType.questions.find((q) => q.type === 'phone')
    const needsPhone = eventType.locationType === 'phone_host_calls'
    const phoneRequired = needsPhone || (phoneQ?.isRequired ?? false)
    if (phoneRequired && !phone.trim()) {
      setSubmitError(
        needsPhone
          ? 'Phone number is required for this meeting type'
          : `"${phoneQ?.label ?? 'Phone'}" is required`
      )
      return
    }
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 7 || digits.length > 15) {
        setSubmitError('Please enter a valid phone number (7–15 digits)')
        return
      }
    }

    setSubmitting(true)
    setSubmitError(null)

    const answersPayload = eventType.questions
      .map((q) => {
        // Phone-type questions are answered via the dedicated phone field.
        if (q.type === 'phone') {
          return { questionId: q.id, questionLabel: q.label, answer: phone.trim() }
        }
        const ans = answers[q.id]
        return {
          questionId: q.id,
          questionLabel: q.label,
          answer: Array.isArray(ans) ? ans.join(', ') : (ans ?? ''),
        }
      })
      .filter((a) => a.answer)

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: host.username,
          eventSlug: eventType.slug,
          startUtc: selectedSlot.startUtc,
          duration: selectedDuration,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          timezone: inviteeTz,
          answers: answersPayload,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        if (res.status === 403) {
          setSubmitError('__blocked__')
        } else {
          setSubmitError(data.error ?? 'Booking failed.')
        }
        return
      }
      const p = new URLSearchParams({
        host: host.name,
        slug: host.username,
        event: eventType.name,
        start: data.startUtc,
        end: data.endUtc,
        tz: inviteeTz,
        cancel: data.cancelToken,
        reschedule: data.rescheduleToken,
        loc: eventType.locationType,
        ...(data.locationValue ? { locValue: data.locationValue } : {}),
        ...(data.isPending ? { pending: '1' } : {}),
      })
      window.location.href = `/confirmed?${p.toString()}`
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Calendar grid data ─────────────────────────────────────────────────────

  if (availableDaysOfWeek.length === 0 && specialDates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm border border-border bg-card p-8 text-center">
          <CalendarBlank size={40} className="mx-auto mb-4 text-muted-foreground/40" />
          <h2 className="text-base font-semibold text-foreground">{host.name} isn&apos;t available right now</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This booking page is not currently accepting new meetings. Please check back later or contact the host directly.
          </p>
        </div>
      </div>
    )
  }

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  const loc = locationMeta(eventType.locationType)
  const hostCompany = [host.jobTitle, host.company].filter(Boolean).join(' @ ')
  const needsPhone = eventType.locationType === 'phone_host_calls'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background p-4 md:p-6 lg:flex lg:h-screen lg:items-center lg:overflow-hidden lg:p-8">

      {/* Decorative blur circles */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute right-[8%] top-[6%] h-80 w-80 bg-teal-400/[0.09] blur-[90px]" />
        <div className="absolute left-[4%] bottom-[15%] h-60 w-60 bg-teal-300/[0.07] blur-[70px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 mx-auto w-full max-w-[900px] overflow-hidden bg-background border border-border lg:flex lg:h-full lg:max-h-[680px] lg:flex-col">

        {/* ── "Powered by Schduled" corner ribbon (Calendly-style, enlarged) ── */}
        <a
          href="/"
          aria-label="Powered by Schduled"
          className="pointer-events-auto absolute -right-[70px] top-[34px] z-30 w-[240px] rotate-45 bg-primary py-2 text-center leading-tight text-primary-foreground transition-opacity hover:opacity-90"
        >
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/85">
            Powered by
          </span>
          <span className="block text-[17px] font-black tracking-tight">Schduled</span>
        </a>

        {/* ── Progress bar ── */}
        <div className="flex items-center gap-2 border-b border-border bg-background px-3 py-3">
          {/* Back — shown only to the host previewing their own page; returns
              them to the event-type list / dashboard they came from. */}
          <div className="flex w-24 shrink-0 justify-start">
            {isOwner && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Go back"
                className="flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
              >
                <ArrowLeft size={14} weight="bold" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
          </div>

          {/* Steps — centered */}
          <div className="flex flex-1 items-center justify-center gap-0">
          {STEPS.map((label, i) => {
            const n = i + 1
            const done = n < progressStep
            const active = n === progressStep
            return (
              <React.Fragment key={label}>
                {i > 0 && (
                  <div
                    className={cn(
                      'h-px flex-1 transition-colors',
                      done ? 'bg-primary/50' : 'bg-border'
                    )}
                  />
                )}
                <div className="flex items-center gap-1.5 px-1">
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center text-xs font-bold transition-all',
                      done && 'bg-primary text-white',
                      active && 'bg-primary text-white ring-[3px] ring-primary/20 ring-offset-1',
                      !done && !active && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {done ? <CheckCircle size={10} weight="bold" /> : n}
                  </div>
                  <span
                    className={cn(
                      'hidden text-xs font-medium sm:block',
                      active ? 'text-primary' : done ? 'text-primary/60' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            )
          })}
          </div>

          {/* Right spacer — balances the back button + leaves room for the ribbon */}
          <div className="w-24 shrink-0" />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">

          {/* ── Left info panel ── */}
          <div className="flex shrink-0 flex-col gap-0 border-b border-border bg-card lg:w-[230px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
            <div className="flex flex-col gap-5 p-6">

              {/* Avatar */}
              {host.image ? (
                <Image
                  src={host.image}
                  alt={host.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-none object-cover ring-1 ring-border"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-none bg-primary text-xl font-bold text-white ring-1 ring-border">
                  {host.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Host identity */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Meeting with
                </p>
                <p className="mt-0.5 text-sm font-bold text-foreground">{host.name}</p>
                {hostCompany && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Briefcase size={11} className="shrink-0" />
                    {hostCompany}
                  </p>
                )}
              </div>

              <div className="-mx-6 border-t border-border" />

              {/* Event info */}
              <div>
                <h1 className="text-[15px] font-bold leading-snug text-foreground">
                  {eventType.name}
                </h1>
                {eventType.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {eventType.description}
                  </p>
                )}
                {eventType.policyText && (
                  <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/50 dark:bg-amber-950/20">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-0.5">Cancellation Policy</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">{eventType.policyText}</p>
                  </div>
                )}
              </div>

              {/* Duration picker — show chips only if multiple durations */}
              {eventType.durations.length > 1 ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Duration
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {eventType.durations.map((d) => (
                      <button
                        key={d.duration}
                        type="button"
                        onClick={() => handleDurationChange(d.duration)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border transition-all',
                          selectedDuration === d.duration
                            ? 'bg-primary border-primary text-white'
                            : 'border-border text-muted-foreground hover:border-primary/50 hover:text-primary',
                        )}
                      >
                        <Clock size={10} className="shrink-0" />
                        {d.duration} min
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Meta */}
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={13} className="shrink-0 text-primary/70" />
                  {selectedDuration} minutes
                </span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 text-primary/70">{loc.icon}</span>
                  {loc.label}
                </span>
                {step === 'form' && selectedSlot && (
                  <span className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <CheckCircle size={13} weight="fill" className="shrink-0" />
                    <span>
                      {formatInTimeZone(new Date(selectedSlot.startUtc), inviteeTz, 'EEE, MMM d')}
                      {' · '}
                      {formatInTimeZone(new Date(selectedSlot.startUtc), inviteeTz, 'h:mm a')}
                      {' – '}
                      {formatInTimeZone(new Date(selectedSlot.endUtc), inviteeTz, 'h:mm a')}
                    </span>
                  </span>
                )}
              </div>

              <div className="-mx-6 border-t border-border" />

              {/* Available days chips */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Available
                </p>
                <div className="flex flex-wrap gap-1">
                  {ALL_DAYS.map((d, i) => (
                    <span
                      key={d}
                      className={cn(
                        'px-1.5 py-0.5 text-xs font-semibold transition-colors',
                        availableDowSet.has(d)
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground/30'
                      )}
                    >
                      {DAY_LABELS[i]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Calendar panel (hidden in form step) ── */}
          {step !== 'form' && (
            <div className="shrink-0 border-b border-border p-6 lg:w-[320px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
              <h2 className="mb-5 text-sm font-semibold text-foreground">
                Select a Date &amp; Time
              </h2>

              {/* Month nav */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setMonth((m) => subMonths(m, 1))}
                  disabled={format(month, 'yyyy-MM') <= today.slice(0, 7)}
                  className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                <span className="text-sm font-semibold text-foreground">
                  {format(month, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() =>
                    setMonth((m) => addMonths(m, 1))
                  }
                  disabled={
                    format(addMonths(month, 1), 'yyyy-MM') > maxDate.slice(0, 7)
                  }
                  className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>

              {/* Day headers */}
              <div className="mb-2 grid grid-cols-7">
                {DAY_LABELS.map((d) => (
                  <span
                    key={d}
                    className="py-1 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Day grid */}
              <div className={cn('grid grid-cols-7 gap-y-0.5 transition-opacity duration-200', loadingDays && 'opacity-40 pointer-events-none')}>
                {calendarDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const inMonth = isSameMonth(day, month)
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === today
                  const available = inMonth && isDayAvailable(dateStr)

                  return (
                    <div key={dateStr} className="flex items-center justify-center p-1">
                      <button
                        onClick={() => handleDateClick(dateStr)}
                        disabled={!available}
                        className={cn(
                          'relative flex h-10 w-10 items-center justify-center text-sm transition-all duration-150',
                          !inMonth && 'invisible pointer-events-none',
                          // Unavailable: grey (ring if it's today so user knows it's today)
                          inMonth && !available && !isToday && 'cursor-default text-muted-foreground/20',
                          inMonth && !available && isToday && 'cursor-default font-bold text-muted-foreground/30 ring-2 ring-inset ring-muted-foreground/20',
                          // Available, not today, not selected
                          inMonth && available && !isSelected && !isToday &&
                            'cursor-pointer font-medium text-foreground hover:bg-primary/10 hover:text-primary',
                          // Available, is today, not selected
                          inMonth && available && isToday && !isSelected &&
                            'cursor-pointer font-bold text-primary ring-2 ring-inset ring-primary',
                          // Selected
                          isSelected &&
                            'cursor-pointer bg-primary font-bold text-white'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Timezone picker */}
              <div className="mt-5 border-t border-border pt-4">
                <TimezoneSearch value={inviteeTz} onChange={setInviteeTz} />
              </div>
            </div>
          )}

          {/* ── Slots panel ── */}
          {step === 'calendar' && (
            <div ref={slotsPanelRef} className="flex flex-1 flex-col overflow-hidden">
              {!selectedDate ? (
                /* Quick pick — no date selected */
                <div className="flex flex-1 flex-col justify-center gap-6 p-6">
                  <div className="flex items-center gap-2">
                    <Lightning size={15} weight="fill" className="text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Quick pick
                    </p>
                  </div>

                  {quickPicks.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {quickPicks.map((pick) => (
                        <button
                          key={pick.date}
                          onClick={() => handleDateClick(pick.date)}
                          className="flex items-center justify-between border border-border bg-background px-4 py-3 text-left text-sm transition-all hover:border-primary/60 hover:bg-primary/5"
                        >
                          <span className="font-semibold text-foreground">{pick.label}</span>
                          <span className="text-xs text-muted-foreground">{pick.sub}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs">or pick from calendar</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <CalendarBlank size={15} />
                    <span className="text-xs">Select any highlighted date on the calendar</span>
                  </div>
                </div>
              ) : (
                /* Slot list */
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="shrink-0 border-b border-border px-6 py-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      {formatInTimeZone(
                        new Date(`${selectedDate}T12:00:00Z`),
                        inviteeTz,
                        'EEEE'
                      )}
                    </p>
                    <h3 className="text-[15px] font-bold text-foreground">
                      {formatInTimeZone(
                        new Date(`${selectedDate}T12:00:00Z`),
                        inviteeTz,
                        'MMMM d, yyyy'
                      )}
                    </h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
                    {loadingSlots && (
                      <div className="flex flex-col items-center gap-3 pt-8">
                        <Spinner size={22} className="animate-spin text-primary" />
                        <p className="text-xs text-muted-foreground">
                          Loading available times…
                        </p>
                      </div>
                    )}

                    {!loadingSlots && slots.length === 0 && (
                      <div className="flex flex-col items-center gap-2 pt-8 text-center">
                        <CalendarBlank size={28} className="text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">No times available</p>
                        <p className="text-xs text-muted-foreground">Try a different date</p>
                      </div>
                    )}

                    {!loadingSlots && slots.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {slots.map((slot) => {
                          const start = formatInTimeZone(new Date(slot.startUtc), inviteeTz, 'h:mm a')
                          const end = formatInTimeZone(new Date(slot.endUtc), inviteeTz, 'h:mm a')
                          const isChosen = selectedSlot?.startUtc === slot.startUtc
                          return (
                            <button
                              key={slot.startUtc}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                'flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold transition-all duration-150',
                                isChosen
                                  ? 'bg-primary text-white'
                                  : 'border border-border bg-background text-foreground hover:border-primary/60 hover:bg-primary/5 hover:text-primary'
                              )}
                            >
                              {isChosen && <CheckCircle size={14} weight="fill" />}
                              {start}
                              <span className={cn('text-xs font-normal', isChosen ? 'text-white/70' : 'text-muted-foreground')}>
                                – {end}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Continue CTA */}
                  {selectedSlot && (
                    <div className="shrink-0 border-t border-border bg-background p-4">
                      <button
                        onClick={handleContinue}
                        className="flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-all hover:bg-primary/90"
                      >
                        Continue
                        <ArrowRight size={15} weight="bold" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Form panel ── */}
          {step === 'form' && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
                <button
                  onClick={() => {
                    setStep('calendar')
                    setSubmitError(null)
                  }}
                  className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft size={13} />
                  Back to times
                </button>

                <h3 className="mb-1 text-[15px] font-bold text-foreground">Your details</h3>
                <p className="mb-5 text-xs text-muted-foreground">
                  Fill in your info to confirm the booking.
                </p>

                <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
                  <FormField label="Name" required>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className={`${inputCls} h-9`}
                    />
                  </FormField>

                  <FormField label="Email" required>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          setPrefilled(false)
                          setEmailBlocked(false)
                          if (submitError === '__blocked__') setSubmitError(null)
                        }}
                        required
                        placeholder="you@example.com"
                        className={`${inputCls} h-9 ${emailBlocked ? 'border-destructive focus:border-destructive focus:ring-destructive/15 pr-8' : ''}`}
                      />
                      {checkingBlocked && (
                        <Spinner size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                      {!checkingBlocked && emailBlocked && (
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-destructive">
                          ✕
                        </span>
                      )}
                    </div>
                    {emailBlocked && (
                      <div className="mt-2 border border-destructive/30 bg-destructive/5 px-4 py-3">
                        <p className="text-sm font-bold text-destructive">Booking Unavailable</p>
                        <p className="mt-1 text-sm text-destructive">You have been blocked from booking with this host.</p>
                        <p className="mt-0.5 text-xs text-destructive/70">Please contact the host if you believe this is an error.</p>
                      </div>
                    )}
                    {!emailBlocked && prefilled && (
                      <p className="mt-1 text-sm text-primary font-medium">
                        Welcome back! We filled in your details from a previous booking.
                      </p>
                    )}
                  </FormField>

                  {(() => {
                    const phoneQ = eventType.questions.find((q) => q.type === 'phone')
                    const phoneRequired = needsPhone || (phoneQ?.isRequired ?? false)
                    return (needsPhone || phoneQ) ? (
                      <FormField label="Phone" required={phoneRequired}>
                        {(() => {
                          const dialCode = dialCodeFromTz(inviteeTz)
                          return (
                            <div className="flex items-stretch border border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all h-9">
                              <div className="flex shrink-0 items-center border-r border-input bg-muted px-2.5 text-sm font-mono font-semibold text-foreground min-w-[48px] justify-center select-none">
                                {dialCode || '+'}
                              </div>
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => {
                                  let v = e.target.value
                                  // Strip invalid chars — only digits, +, space, -, (, ), .
                                  v = v.replace(/[^\d+\s\-().]/g, '')
                                  if (v.indexOf('+') > 0) v = '+' + v.replace(/\+/g, '')
                                  setPhone(v)
                                }}
                                required={phoneRequired}
                                placeholder={dialCode ? `${dialCode} XXXXX XXXXX` : '+91 98765 43210'}
                                className="flex-1 bg-background px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none"
                              />
                            </div>
                          )
                        })()}
                      </FormField>
                    ) : null
                  })()}

                  {eventType.questions
                    .filter((q) => q.type !== 'phone')
                    .map((q) => (
                      <FormField key={q.id} label={q.label} required={q.isRequired}>
                        <QuestionInput q={q} answers={answers} setAnswers={setAnswers} />
                      </FormField>
                    ))}

                  {submitError && (
                    <div className="border border-destructive/30 bg-destructive/5 px-4 py-3">
                      {submitError === '__blocked__' ? (
                        <>
                          <p className="text-sm font-bold text-destructive">Booking Unavailable</p>
                          <p className="mt-1 text-sm text-destructive">You have been blocked from booking with this host.</p>
                          <p className="mt-0.5 text-xs text-destructive/70">Please contact the host if you believe this is an error.</p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-destructive">{submitError}</p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || submitError === '__blocked__' || emailBlocked}
                    className={`mt-1 flex h-11 w-full items-center justify-center gap-2 text-sm font-bold text-white transition-all ${
                      submitError === '__blocked__' || emailBlocked
                        ? 'bg-muted-foreground/40 cursor-not-allowed pointer-events-none'
                        : 'bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Spinner size={15} className="animate-spin" />
                        Scheduling…
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
