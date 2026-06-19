'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
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
  Clock,
  CaretLeft,
  CaretRight,
  CaretDown,
  Globe,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  VideoCamera,
  Phone,
  MapPin,
  Link as LinkIcon,
  Spinner,
  CalendarBlank,
  Lightning,
  Briefcase,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

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
  questions: Question[]
}

interface SlotInfo {
  startUtc: string
  endUtc: string
}

type Step = 'calendar' | 'form'

interface Props {
  host: HostInfo
  eventType: EventTypeInfo
  hostTimezone: string
  today: string       // server-rendered initial value; corrected client-side on mount
  maxDate: string
  availableDaysOfWeek: string[]
  blockedDates: string[]
  specialDates: string[]
}

// ── Outer helpers (stable identity — no remount on every render) ──────────────

const inputCls =
  'w-full border border-input bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60'

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
      <label className="text-[11px] font-semibold text-gray-600">
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
      <select
        value={strVal}
        onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
        required={q.isRequired}
        className={`${inputCls} h-9`}
      >
        <option value="">Select…</option>
        {q.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
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
              className="flex cursor-pointer items-center gap-2 text-[13px] text-gray-700"
            >
              <input
                type="checkbox"
                checked={arr.includes(opt)}
                onChange={(e) => {
                  const cur = Array.isArray(answers[q.id])
                    ? (answers[q.id] as string[])
                    : []
                  setAnswers((p) => ({
                    ...p,
                    [q.id]: e.target.checked
                      ? [...cur, opt]
                      : cur.filter((v) => v !== opt),
                  }))
                }}
                className="accent-primary"
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

const BASE_TIMEZONES = [
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Halifax',
  'America/Sao_Paulo',
  'Atlantic/Azores',
  'Europe/London',
  'Europe/Paris',
  'Europe/Helsinki',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Calcutta',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Perth',
  'Australia/Sydney',
  'Pacific/Auckland',
]

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
  const [commonTimezones] = useState(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    return BASE_TIMEZONES.includes(detected)
      ? BASE_TIMEZONES
      : [...BASE_TIMEZONES, detected]
  })
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

  const availableDowSet = new Set(availableDaysOfWeek)
  const blockedSet = new Set(blockedDates)
  const specialSet = new Set(specialDates)

  const progressStep = step === 'form' ? 3 : selectedDate ? 2 : 1

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

    for (const q of eventType.questions.filter((q) => q.isRequired)) {
      const ans = answers[q.id]
      const val = Array.isArray(ans) ? ans.join('') : (ans ?? '')
      if (!val.trim()) {
        setSubmitError(`"${q.label}" is required`)
        return
      }
    }
    const needsPhone = eventType.locationType === 'phone_host_calls'
    if (needsPhone && !phone.trim()) {
      setSubmitError('Phone number is required for this meeting type')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    const answersPayload = eventType.questions
      .map((q) => {
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
        setSubmitError(data.error ?? 'Booking failed.')
        return
      }
      const p = new URLSearchParams({
        host: host.name,
        event: eventType.name,
        start: data.startUtc,
        end: data.endUtc,
        tz: inviteeTz,
        cancel: data.cancelToken,
        reschedule: data.rescheduleToken,
        loc: eventType.locationType,
        ...(data.locationValue ? { locValue: data.locationValue } : {}),
      })
      window.location.href = `/confirmed?${p.toString()}`
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Calendar grid data ─────────────────────────────────────────────────────

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  })

  const loc = locationMeta(eventType.locationType)
  const hostCompany = [host.jobTitle, host.company].filter(Boolean).join(' @ ')
  const needsPhone = eventType.locationType === 'phone_host_calls'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-[#F3F7F6] p-4 md:p-6 lg:flex lg:h-screen lg:items-center lg:overflow-hidden lg:p-8">

      {/* Decorative blur circles */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute right-[8%] top-[6%] h-80 w-80 rounded-full bg-teal-400/[0.09] blur-[90px]" />
        <div className="absolute left-[4%] bottom-[15%] h-60 w-60 rounded-full bg-teal-300/[0.07] blur-[70px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 mx-auto w-full max-w-[900px] overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.09)] ring-1 ring-black/[0.05] lg:flex lg:h-full lg:max-h-[680px] lg:flex-col">

        {/* ── Progress bar ── */}
        <div className="flex items-center justify-center gap-0 border-b border-gray-100 bg-white px-6 py-3">
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
                      done ? 'bg-primary/50' : 'bg-gray-200'
                    )}
                  />
                )}
                <div className="flex items-center gap-1.5 px-1">
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center text-[10px] font-bold transition-all',
                      done && 'bg-primary text-white',
                      active && 'bg-primary text-white ring-[3px] ring-primary/20 ring-offset-1',
                      !done && !active && 'bg-gray-100 text-gray-400'
                    )}
                  >
                    {done ? <CheckCircle size={10} weight="bold" /> : n}
                  </div>
                  <span
                    className={cn(
                      'hidden text-[11px] font-medium sm:block',
                      active ? 'text-primary' : done ? 'text-primary/60' : 'text-gray-400'
                    )}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            )
          })}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">

          {/* ── Left info panel ── */}
          <div className="flex shrink-0 flex-col gap-0 border-b border-gray-100 bg-[#F8FCFB] lg:w-[230px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
            <div className="flex flex-col gap-5 p-6">

              {/* Avatar */}
              {host.image ? (
                <Image
                  src={host.image}
                  alt={host.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white ring-2 ring-white shadow-sm">
                  {host.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Host identity */}
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">{host.name}</p>
                {hostCompany && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                    <Briefcase size={10} className="shrink-0" />
                    {hostCompany}
                  </p>
                )}
              </div>

              <div className="-mx-6 border-t border-gray-100" />

              {/* Event info */}
              <div>
                <h1 className="text-[15px] font-bold leading-snug text-gray-900">
                  {eventType.name}
                </h1>
                {eventType.description && (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
                    {eventType.description}
                  </p>
                )}
              </div>

              {/* Duration picker — show chips only if multiple durations */}
              {eventType.durations.length > 1 ? (
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    Duration
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {eventType.durations.map((d) => (
                      <button
                        key={d.duration}
                        type="button"
                        onClick={() => handleDurationChange(d.duration)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold border transition-all',
                          selectedDuration === d.duration
                            ? 'bg-primary border-primary text-white'
                            : 'border-gray-200 text-muted-foreground hover:border-primary/50 hover:text-primary',
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
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Clock size={13} className="shrink-0 text-primary/70" />
                  {selectedDuration} minutes
                </span>
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <span className="shrink-0 text-primary/70">{loc.icon}</span>
                  {loc.label}
                </span>
                {step === 'form' && selectedSlot && (
                  <span className="flex items-center gap-2 text-[12px] font-semibold text-primary">
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

              <div className="-mx-6 border-t border-gray-100" />

              {/* Available days chips */}
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Available
                </p>
                <div className="flex flex-wrap gap-1">
                  {ALL_DAYS.map((d, i) => (
                    <span
                      key={d}
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-semibold transition-colors',
                        availableDowSet.has(d)
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-300'
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
            <div className="shrink-0 border-b border-gray-100 p-6 lg:w-[320px] lg:border-b-0 lg:border-r lg:overflow-y-auto">
              <h2 className="mb-5 text-[13px] font-semibold text-gray-800">
                Select a Date &amp; Time
              </h2>

              {/* Month nav */}
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setMonth((m) => subMonths(m, 1))}
                  disabled={format(month, 'yyyy-MM') <= today.slice(0, 7)}
                  className="flex h-11 w-11 items-center justify-center text-gray-400 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <CaretLeft size={14} weight="bold" />
                </button>
                <span className="text-[13px] font-semibold text-gray-700">
                  {format(month, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() =>
                    setMonth((m) => addMonths(m, 1))
                  }
                  disabled={
                    format(addMonths(month, 1), 'yyyy-MM') > maxDate.slice(0, 7)
                  }
                  className="flex h-11 w-11 items-center justify-center text-gray-400 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <CaretRight size={14} weight="bold" />
                </button>
              </div>

              {/* Day headers */}
              <div className="mb-2 grid grid-cols-7">
                {DAY_LABELS.map((d) => (
                  <span
                    key={d}
                    className="py-1 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400"
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
                          'relative flex h-9 w-9 items-center justify-center text-[13px] transition-all duration-150',
                          !inMonth && 'invisible pointer-events-none',
                          // Unavailable: grey (ring if it's today so user knows it's today)
                          inMonth && !available && !isToday && 'cursor-default text-gray-200',
                          inMonth && !available && isToday && 'cursor-default font-bold text-gray-300 ring-2 ring-inset ring-gray-200',
                          // Available, not today, not selected
                          inMonth && available && !isSelected && !isToday &&
                            'cursor-pointer font-medium text-gray-700 hover:scale-110 hover:bg-primary/10 hover:text-primary',
                          // Available, is today, not selected
                          inMonth && available && isToday && !isSelected &&
                            'cursor-pointer font-bold text-primary ring-2 ring-inset ring-primary hover:scale-105',
                          // Selected
                          isSelected &&
                            'cursor-pointer scale-105 bg-primary font-bold text-white shadow-[0_4px_14px_rgba(13,148,136,0.45)]'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Timezone picker */}
              <div className="mt-5 border-t border-gray-100 pt-4">
                <label className="flex cursor-pointer items-center gap-1.5 group">
                  <Globe size={14} className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  <select
                    value={inviteeTz}
                    onChange={(e) => setInviteeTz(e.target.value)}
                    className="flex-1 truncate bg-transparent text-[13px] text-muted-foreground outline-none cursor-pointer group-hover:text-primary transition-colors appearance-none border-none"
                  >
                    {commonTimezones.map((tz) => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                  <CaretDown size={11} className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </label>
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
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">
                      Quick pick
                    </p>
                  </div>

                  {quickPicks.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {quickPicks.map((pick) => (
                        <button
                          key={pick.date}
                          onClick={() => handleDateClick(pick.date)}
                          className="flex items-center justify-between border border-gray-200 bg-white px-4 py-3 text-left text-sm transition-all hover:border-primary/60 hover:bg-primary/5"
                        >
                          <span className="font-semibold text-gray-800">{pick.label}</span>
                          <span className="text-xs text-muted-foreground">{pick.sub}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="text-[11px]">or pick from calendar</span>
                    <div className="h-px flex-1 bg-gray-100" />
                  </div>

                  <div className="flex items-center gap-2 text-muted-foreground/60">
                    <CalendarBlank size={15} />
                    <span className="text-xs">Select any highlighted date on the calendar</span>
                  </div>
                </div>
              ) : (
                /* Slot list */
                <div className="flex flex-1 flex-col overflow-hidden">
                  <div className="shrink-0 border-b border-gray-100 px-6 py-4">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {formatInTimeZone(
                        new Date(`${selectedDate}T12:00:00Z`),
                        inviteeTz,
                        'EEEE'
                      )}
                    </p>
                    <h3 className="text-[15px] font-bold text-gray-900">
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
                        <p className="text-[12px] text-muted-foreground">
                          Loading available times…
                        </p>
                      </div>
                    )}

                    {!loadingSlots && slots.length === 0 && (
                      <div className="flex flex-col items-center gap-2 pt-8 text-center">
                        <CalendarBlank size={28} className="text-gray-300" />
                        <p className="text-[13px] font-medium text-gray-500">No times available</p>
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
                                'flex h-11 w-full items-center justify-center gap-2 text-[13px] font-semibold transition-all duration-150',
                                isChosen
                                  ? 'scale-[1.01] bg-primary text-white shadow-[0_4px_16px_rgba(13,148,136,0.40)]'
                                  : 'border border-gray-200 bg-white text-gray-700 hover:border-primary/60 hover:bg-primary/5 hover:text-primary'
                              )}
                            >
                              {isChosen && <CheckCircle size={14} weight="fill" />}
                              {start}
                              <span className={cn('text-[11px] font-normal', isChosen ? 'text-white/70' : 'text-muted-foreground')}>
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
                    <div className="shrink-0 border-t border-gray-100 bg-white p-4">
                      <button
                        onClick={handleContinue}
                        className="flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-white shadow-[0_4px_14px_rgba(13,148,136,0.35)] transition-all hover:bg-primary/90 hover:shadow-[0_6px_20px_rgba(13,148,136,0.45)]"
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
                  className="mb-5 flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-gray-700"
                >
                  <ArrowLeft size={13} />
                  Back to times
                </button>

                <h3 className="mb-1 text-[15px] font-bold text-gray-900">Your details</h3>
                <p className="mb-5 text-[12px] text-muted-foreground">
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
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className={`${inputCls} h-9`}
                    />
                  </FormField>

                  {(() => {
                    const phoneQ = eventType.questions.find((q) => q.type === 'phone')
                    const phoneRequired = needsPhone || (phoneQ?.isRequired ?? false)
                    return (needsPhone || phoneQ) ? (
                      <FormField label="Phone" required={phoneRequired}>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required={phoneRequired}
                          placeholder="+1 (555) 000-0000"
                          className={`${inputCls} h-9`}
                        />
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
                    <p className="text-[12px] text-destructive">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-1 flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-bold text-white shadow-[0_4px_14px_rgba(13,148,136,0.35)] transition-all hover:bg-primary/90 disabled:opacity-60"
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
