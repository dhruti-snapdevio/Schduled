'use client'

import { useState, useTransition, useMemo } from 'react'
import { toast } from 'sonner'
import {
  ArrowLeft, ArrowRight, ArrowSquareOut,
  CalendarBlank, CalendarCheck, CaretDown, CheckCircle,
  Clock, FloppyDisk, Globe, List, Plus, Trash, X,
} from '@phosphor-icons/react'
import {
  updateAvailabilitySchedule,
  addAvailabilityOverride,
  deleteAvailabilityOverride,
  createDefaultSchedule,
  updateUserTimezone,
  type DayOfWeek,
  type TimeSlot,
  type ScheduleData,
  type OverrideData,
} from '@/app/actions/availability'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// ── Time helpers ──────────────────────────────────────────────────────────────

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

function todayISO() { return new Date().toISOString().slice(0, 10) }
function dateToISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function jsDay(iso: string) {
  const [y, mo, d] = iso.split('-').map(Number)
  return new Date(y, mo - 1, d).getDay()
}
function fmtDate(iso: string) {
  const [y, mo, d] = iso.split('-').map(Number)
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const DAY_MAP: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

// ── Timezone helpers ──────────────────────────────────────────────────────────

const COMMON_TZ = [
  'Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles', 'America/Denver',
  'America/Chicago', 'America/New_York', 'America/Sao_Paulo', 'Atlantic/Reykjavik',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore',
  'Asia/Tokyo', 'Australia/Sydney', 'Pacific/Auckland',
]

function getTzLabel(tz: string) {
  try {
    const offset = new Intl.DateTimeFormat('en', { timeZoneName: 'short', timeZone: tz })
      .formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? ''
    return `(${offset}) ${tz.replace(/_/g, ' ')}`
  } catch { return tz.replace(/_/g, ' ') }
}

// ── Day config ────────────────────────────────────────────────────────────────

const DAYS: { key: DayOfWeek; letter: string; label: string }[] = [
  { key: 'sunday',    letter: 'S', label: 'Sunday' },
  { key: 'monday',    letter: 'M', label: 'Monday' },
  { key: 'tuesday',   letter: 'T', label: 'Tuesday' },
  { key: 'wednesday', letter: 'W', label: 'Wednesday' },
  { key: 'thursday',  letter: 'T', label: 'Thursday' },
  { key: 'friday',    letter: 'F', label: 'Friday' },
  { key: 'saturday',  letter: 'S', label: 'Saturday' },
]

// ── Holidays data ─────────────────────────────────────────────────────────────

const HOLIDAY_COUNTRIES = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'IN', label: 'India' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
]

const HOLIDAYS: Record<string, { date: string; name: string }[]> = {
  US: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-19', name: 'Martin Luther King Jr. Day' },
    { date: '2026-02-16', name: "Presidents' Day" },
    { date: '2026-05-25', name: 'Memorial Day' },
    { date: '2026-07-04', name: 'Independence Day' },
    { date: '2026-09-07', name: 'Labor Day' },
    { date: '2026-11-26', name: 'Thanksgiving Day' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
  GB: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-06', name: 'Easter Monday' },
    { date: '2026-05-04', name: 'Early May Bank Holiday' },
    { date: '2026-05-25', name: 'Spring Bank Holiday' },
    { date: '2026-08-31', name: 'Summer Bank Holiday' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-28', name: 'Boxing Day (observed)' },
  ],
  IN: [
    { date: '2026-01-26', name: 'Republic Day' },
    { date: '2026-03-28', name: 'Holi' },
    { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti' },
    { date: '2026-08-15', name: 'Independence Day' },
    { date: '2026-10-02', name: 'Gandhi Jayanti' },
    { date: '2026-11-12', name: 'Diwali' },
    { date: '2026-12-25', name: 'Christmas Day' },
  ],
  CA: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-02-16', name: 'Family Day' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-05-18', name: 'Victoria Day' },
    { date: '2026-07-01', name: 'Canada Day' },
    { date: '2026-09-07', name: 'Labour Day' },
    { date: '2026-10-12', name: 'Thanksgiving' },
    { date: '2026-11-11', name: 'Remembrance Day' },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-28', name: 'Boxing Day' },
  ],
  AU: [
    { date: '2026-01-01', name: "New Year's Day" },
    { date: '2026-01-26', name: 'Australia Day' },
    { date: '2026-04-03', name: 'Good Friday' },
    { date: '2026-04-06', name: 'Easter Monday' },
    { date: '2026-04-25', name: 'ANZAC Day' },
    { date: '2026-06-08', name: "Queen's Birthday" },
    { date: '2026-12-25', name: 'Christmas Day' },
    { date: '2026-12-28', name: 'Boxing Day' },
  ],
}

// ── Types ─────────────────────────────────────────────────────────────────────

type WeekGrid = Record<DayOfWeek, TimeSlot[]>
type PageTab = 'schedules' | 'calendar' | 'advanced'
type ViewMode = 'list' | 'calendar'

interface Props {
  initialSchedule: ScheduleData | null
  initialOverrides: OverrideData[]
  userTimezone: string
}

const EMPTY_GRID: WeekGrid = {
  monday: [{ startTime: '09:00', endTime: '17:00' }],
  tuesday: [{ startTime: '09:00', endTime: '17:00' }],
  wednesday: [{ startTime: '09:00', endTime: '17:00' }],
  thursday: [{ startTime: '09:00', endTime: '17:00' }],
  friday: [{ startTime: '09:00', endTime: '17:00' }],
  saturday: [],
  sunday: [],
}

// ── Shared time select ────────────────────────────────────────────────────────

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[120px] text-sm" aria-label={label}>
        <SelectValue>{fmt12(value)}</SelectValue>
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" sideOffset={4} className="w-[120px]" style={{ maxHeight: '220px' }}>
        {TIMES.map((t) => <SelectItem key={t} value={t} className="text-sm">{fmt12(t)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

// ── Override dialog ───────────────────────────────────────────────────────────

function OverrideDialog({
  open, onClose, defaultDate, weekGrid, overrideMap, onApply, isPending,
}: {
  open: boolean
  onClose: () => void
  defaultDate: string
  weekGrid: WeekGrid
  overrideMap: Map<string, OverrideData>
  onApply: (date: string, isBlocked: boolean, slots: TimeSlot[]) => void
  isPending: boolean
}) {
  const [selDate, setSelDate] = useState(defaultDate || todayISO())
  const [isBlocked, setIsBlocked] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([{ startTime: '09:00', endTime: '17:00' }])
  const [cursor, setCursor] = useState(() => {
    const base = defaultDate || todayISO()
    const [y, m] = base.split('-').map(Number)
    return { year: y, month: m - 1 }
  })

  const today = todayISO()
  const { year, month } = cursor
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function pickDate(iso: string) {
    setSelDate(iso)
    const existing = overrideMap.get(iso)
    if (existing) {
      setIsBlocked(existing.isBlocked)
      setSlots(existing.isBlocked || existing.slots.length === 0
        ? [{ startTime: '09:00', endTime: '17:00' }]
        : existing.slots.map((s) => ({ ...s })))
    } else {
      const dow = DAY_MAP[jsDay(iso)]
      const ws = weekGrid[dow]
      setIsBlocked(ws.length === 0)
      setSlots(ws.length > 0 ? ws.map((s) => ({ ...s })) : [{ startTime: '09:00', endTime: '17:00' }])
    }
  }

  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">Set date-specific hours</DialogTitle>
        <DialogDescription className="sr-only">Choose a date and set custom availability hours</DialogDescription>

        <div className="px-5 pt-5 pb-3 border-b border-border">
          <p className="font-semibold text-sm">Select the date(s) you want to assign specific hours</p>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Calendar picker */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <button type="button"
                onClick={() => setCursor(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 })}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={14} />
              </button>
              <span className="text-sm font-semibold">{monthLabel}</span>
              <button type="button"
                onClick={() => setCursor(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 })}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                <div key={d} className="h-7 flex items-center justify-center text-[10px] font-semibold text-muted-foreground">{d}</div>
              ))}
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />
                const iso = dateToISO(year, month, day)
                const isPast = iso < today
                const isToday = iso === today
                const isSelected = iso === selDate
                const dow = DAY_MAP[new Date(year, month, day).getDay()]
                const hasWeekly = weekGrid[dow].length > 0
                const hasOverride = overrideMap.has(iso)
                return (
                  <div key={iso} className="flex flex-col items-center">
                    <button type="button" disabled={isPast} onClick={() => pickDate(iso)}
                      className={cn(
                        'h-9 w-9 flex items-center justify-center text-sm transition-colors rounded-full',
                        isPast && 'text-muted-foreground/40 cursor-not-allowed',
                        !isPast && !isSelected && hasWeekly && 'border border-primary/40 text-primary hover:bg-primary/10',
                        !isPast && !isSelected && !hasWeekly && 'text-muted-foreground hover:bg-muted',
                        isSelected && 'bg-primary text-primary-foreground font-semibold',
                        hasOverride && !isSelected && 'ring-1 ring-primary',
                      )}>
                      {day}
                    </button>
                    {isToday && <span className="h-1 w-1 bg-primary rounded-full mt-0.5" />}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Hours */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">What hours are you available?</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Unavailable</span>
                <Switch checked={isBlocked} onCheckedChange={setIsBlocked} />
              </div>
            </div>

            {!isBlocked && (
              <div className="space-y-2">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <TimeSelect value={slot.startTime} onChange={(v) => setSlots((p) => p.map((s, idx) => idx === i ? { ...s, startTime: v } : s))} />
                    <span className="text-sm text-muted-foreground">-</span>
                    <TimeSelect value={slot.endTime} onChange={(v) => setSlots((p) => p.map((s, idx) => idx === i ? { ...s, endTime: v } : s))} />
                    {slots.length > 1 && (
                      <button type="button" onClick={() => setSlots((p) => p.filter((_, idx) => idx !== i))}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <X size={14} />
                      </button>
                    )}
                    {i === slots.length - 1 && (
                      <button type="button"
                        onClick={() => setSlots((p) => [...p, { startTime: '09:00', endTime: '17:00' }])}
                        className="h-9 w-9 flex items-center justify-center border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors shrink-0"
                        aria-label="Add interval">
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isBlocked && <p className="text-sm text-muted-foreground">This date will be marked as unavailable.</p>}
          </div>
        </div>

        <div className="border-t border-border px-5 py-3 flex justify-end gap-2 bg-background">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={isPending || !selDate}
            onClick={() => onApply(selDate, isBlocked, isBlocked ? [] : slots)}>
            {isPending ? 'Saving…' : 'Apply'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Full calendar grid ────────────────────────────────────────────────────────

function FullCalendarView({ grid, overrides, currentTz, onTzClick, onDateClick }: {
  grid: WeekGrid
  overrides: OverrideData[]
  currentTz: string
  onTzClick: () => void
  onDateClick: (date: string) => void
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const overrideMap = useMemo(() => {
    const m = new Map<string, OverrideData>()
    for (const o of overrides) m.set(o.date, o)
    return m
  }, [overrides])

  const { year, month } = cursor
  const today = todayISO()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const allCells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const weeks: (number | null)[][] = []
  for (let i = 0; i < allCells.length; i += 7) {
    const w = allCells.slice(i, i + 7)
    while (w.length < 7) w.push(null)
    weeks.push(w)
  }

  return (
    <div className="border border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCursor(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={14} /></button>
          <span className="text-sm font-semibold w-32 text-center">{monthLabel}</span>
          <button type="button" onClick={() => setCursor(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 })}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><ArrowRight size={14} /></button>
        </div>
        <button type="button" onClick={onTzClick}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
          <Globe size={13} />{currentTz.replace(/_/g, ' ')}<CaretDown size={11} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-muted/20">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground border-r border-border last:border-r-0">{d}</div>
        ))}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0" style={{ minHeight: 90 }}>
          {week.map((day, di) => {
            if (!day) return (
              <div key={`e-${wi}-${di}`} className="border-r border-border last:border-r-0 bg-muted/10 p-2 text-muted-foreground/30 text-sm" />
            )
            const iso = dateToISO(year, month, day)
            const isToday = iso === today
            const isPast = iso < today
            const override = overrideMap.get(iso)
            const dow = DAY_MAP[new Date(year, month, day).getDay()]
            const weeklySlots = grid[dow]
            const displaySlots = override
              ? (override.isBlocked ? [] : override.slots)
              : weeklySlots

            return (
              <button key={iso} type="button" onClick={() => !isPast && onDateClick(iso)} disabled={isPast}
                className={cn(
                  'border-r border-border last:border-r-0 p-2 text-left transition-colors group',
                  isPast ? 'bg-muted/10 cursor-default' : 'hover:bg-primary/5 cursor-pointer',
                  isToday && 'border-t-2 border-t-primary',
                  override && !isPast && 'bg-primary/5',
                )}>
                <div className="flex items-start justify-between mb-1">
                  <span className={cn('text-sm leading-none',
                    isToday ? 'font-bold text-primary' : isPast ? 'text-muted-foreground/40' : 'text-foreground'
                  )}>{day}</span>
                  {override && !isPast && <CalendarCheck size={11} className="text-primary mt-0.5" />}
                </div>
                <div className="space-y-0.5">
                  {displaySlots.map((s, i) => (
                    <p key={i} className={cn('text-[11px] leading-snug',
                      override ? 'text-primary font-medium' : 'text-muted-foreground'
                    )}>{fmt12(s.startTime)} – {fmt12(s.endTime)}</p>
                  ))}
                  {override?.isBlocked && <p className="text-[11px] text-destructive/60">Unavailable</p>}
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AvailabilityForm({ initialSchedule, initialOverrides, userTimezone }: Props) {
  const [isPending, startTransition] = useTransition()
  const [pageTab, setPageTab] = useState<PageTab>('schedules')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const [scheduleId, setScheduleId] = useState<string | null>(initialSchedule?.id ?? null)
  const [scheduleName, setScheduleName] = useState(initialSchedule?.name ?? 'Working Hours')
  const [grid, setGrid] = useState<WeekGrid>(initialSchedule?.windows ?? EMPTY_GRID)
  const [scheduleEdited, setScheduleEdited] = useState(false)

  const [overrides, setOverrides] = useState<OverrideData[]>(initialOverrides)
  const overrideMap = useMemo(() => {
    const m = new Map<string, OverrideData>()
    for (const o of overrides) m.set(o.date, o)
    return m
  }, [overrides])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDate, setDialogDate] = useState(todayISO())

  const [tzDialogOpen, setTzDialogOpen] = useState(false)
  const [tzSearch, setTzSearch] = useState('')
  const [currentTz, setCurrentTz] = useState(userTimezone)

  // Advanced tab
  const [advName, setAdvName] = useState(initialSchedule?.name ?? 'Working Hours')
  const [holidayCountry, setHolidayCountry] = useState('US')
  const [meetingLimits, setMeetingLimits] = useState<{ period: 'day' | 'week' | 'month'; count: string }[]>([])

  // ── Grid mutations ──────────────────────────────────────────────────────────

  function setDay(day: DayOfWeek, enabled: boolean) {
    setGrid((prev) => ({ ...prev, [day]: enabled ? [{ startTime: '09:00', endTime: '17:00' }] : [] }))
    setScheduleEdited(true)
  }
  function addSlot(day: DayOfWeek) {
    setGrid((prev) => ({ ...prev, [day]: [...prev[day], { startTime: '09:00', endTime: '17:00' }] }))
    setScheduleEdited(true)
  }
  function removeSlot(day: DayOfWeek, index: number) {
    setGrid((prev) => ({ ...prev, [day]: prev[day].filter((_, i) => i !== index) }))
    setScheduleEdited(true)
  }
  function updateSlot(day: DayOfWeek, index: number, field: 'startTime' | 'endTime', value: string) {
    setGrid((prev) => {
      const slots = [...prev[day]]
      slots[index] = { ...slots[index], [field]: value }
      return { ...prev, [day]: slots }
    })
    setScheduleEdited(true)
  }

  // ── Save schedule ───────────────────────────────────────────────────────────

  function handleSave(nameOverride?: string) {
    startTransition(async () => {
      const name = nameOverride ?? scheduleName
      if (!scheduleId) {
        const res = await createDefaultSchedule()
        if ('error' in res) { toast.error(res.error); return }
        setScheduleId(res.id)
        const res2 = await updateAvailabilitySchedule(res.id, name, grid)
        if ('error' in res2) { toast.error(res2.error); return }
      } else {
        const res = await updateAvailabilitySchedule(scheduleId, name, grid)
        if ('error' in res) { toast.error(res.error); return }
      }
      setScheduleEdited(false)
      setScheduleName(name)
      toast.success('Availability saved')
    })
  }

  // ── Override apply ──────────────────────────────────────────────────────────

  function handleApplyOverride(date: string, isBlocked: boolean, slots: TimeSlot[]) {
    startTransition(async () => {
      const dow = DAY_MAP[jsDay(date)]
      const weeklySlots = grid[dow]
      const matchesWeekly = !isBlocked && slots.length === weeklySlots.length &&
        slots.every((s, i) => s.startTime === weeklySlots[i]?.startTime && s.endTime === weeklySlots[i]?.endTime)

      if (matchesWeekly) {
        const existing = overrideMap.get(date)
        if (existing) {
          const res = await deleteAvailabilityOverride(date)
          if ('error' in res) { toast.error(res.error); return }
          setOverrides((prev) => prev.filter((o) => o.date !== date))
          toast.success('Override removed')
        }
        setDialogOpen(false)
        return
      }

      const res = await addAvailabilityOverride({ date, isBlocked, slots: isBlocked ? [] : slots })
      if ('error' in res) { toast.error(res.error); return }

      setOverrides((prev) => {
        const without = prev.filter((o) => o.date !== date)
        return [...without, { date, isBlocked, slots: isBlocked ? [] : slots, reason: null }]
          .sort((a, b) => a.date.localeCompare(b.date))
      })
      setDialogOpen(false)
      toast.success('Date override saved')
    })
  }

  function handleDeleteOverride(date: string) {
    startTransition(async () => {
      const res = await deleteAvailabilityOverride(date)
      if ('error' in res) { toast.error(res.error); return }
      setOverrides((prev) => prev.filter((o) => o.date !== date))
      toast.success('Override removed')
    })
  }

  function openDialog(date?: string) {
    setDialogDate(date ?? todayISO())
    setDialogOpen(true)
  }

  function handleHolidayToggle(date: string, block: boolean) {
    startTransition(async () => {
      if (block) {
        const res = await addAvailabilityOverride({ date, isBlocked: true, slots: [] })
        if ('error' in res) { toast.error(res.error); return }
        setOverrides((prev) => {
          const without = prev.filter((o) => o.date !== date)
          return [...without, { date, isBlocked: true, slots: [], reason: null }]
            .sort((a, b) => a.date.localeCompare(b.date))
        })
        toast.success('Holiday marked as unavailable')
      } else {
        const res = await deleteAvailabilityOverride(date)
        if ('error' in res) { toast.error(res.error); return }
        setOverrides((prev) => prev.filter((o) => o.date !== date))
        toast.success('Holiday override removed')
      }
    })
  }

  function handleAllHolidaysToggle(enable: boolean) {
    const holidays = HOLIDAYS[holidayCountry] ?? []
    startTransition(async () => {
      if (enable) {
        for (const h of holidays) {
          if (!overrideMap.get(h.date)?.isBlocked) {
            await addAvailabilityOverride({ date: h.date, isBlocked: true, slots: [] })
          }
        }
        setOverrides((prev) => {
          const dates = new Set(holidays.map((h) => h.date))
          const without = prev.filter((o) => !dates.has(o.date))
          return [...without, ...holidays.map((h) => ({ date: h.date, isBlocked: true, slots: [], reason: null }))]
            .sort((a, b) => a.date.localeCompare(b.date))
        })
        toast.success('All holidays blocked')
      } else {
        for (const h of holidays) {
          if (overrideMap.has(h.date)) await deleteAvailabilityOverride(h.date)
        }
        const dates = new Set(holidays.map((h) => h.date))
        setOverrides((prev) => prev.filter((o) => !dates.has(o.date)))
        toast.success('All holiday overrides removed')
      }
    })
  }

  // ── Timezone ────────────────────────────────────────────────────────────────

  const filteredTz = useMemo(() => {
    const q = tzSearch.toLowerCase().trim()
    return q ? COMMON_TZ.filter((tz) => tz.toLowerCase().includes(q) || getTzLabel(tz).toLowerCase().includes(q)) : COMMON_TZ
  }, [tzSearch])

  function handleTzChange(tz: string) {
    startTransition(async () => {
      const res = await updateUserTimezone(tz)
      if ('error' in res) { toast.error(res.error); return }
      setCurrentTz(tz)
      setTzDialogOpen(false)
      setTzSearch('')
      toast.success('Timezone updated')
    })
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Page tab bar */}
      <div className="-mx-4 md:-mx-6 border-b border-border px-4 md:px-6 mb-6">
        <div className="flex">
          {([
            { id: 'schedules' as PageTab, label: 'Schedules' },
            { id: 'calendar' as PageTab, label: 'Calendar settings' },
            { id: 'advanced' as PageTab, label: 'Advanced settings' },
          ]).map((tab) => (
            <button key={tab.id} type="button" onClick={() => setPageTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                pageTab === tab.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CALENDAR SETTINGS TAB ── */}
      {pageTab === 'calendar' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-sm font-semibold mb-1">Connected calendars</h2>
            <p className="text-sm text-muted-foreground">Connect a calendar to check for conflicts and automatically add new bookings.</p>
          </div>

          <div className="space-y-3">
            {/* Google Calendar card */}
            <div className="flex items-center justify-between border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center bg-muted">
                  <CalendarBlank size={18} weight="fill" className="text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">Sync availability and create meeting events</p>
                </div>
              </div>
              <a href="/settings/integrations" className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
                Manage <ArrowSquareOut size={12} />
              </a>
            </div>

            {/* Outlook card */}
            <div className="flex items-center justify-between border border-border p-4 opacity-60">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center bg-muted">
                  <CalendarBlank size={18} className="text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Microsoft Outlook</p>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </div>
              </div>
              <span className="text-xs bg-muted px-2 py-1 text-muted-foreground">Soon</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Manage all integrations in{' '}
              <a href="/settings/integrations" className="text-primary hover:underline">Settings → Integrations</a>.
            </p>
          </div>
        </div>
      )}

      {/* ── ADVANCED SETTINGS TAB ── */}
      {pageTab === 'advanced' && (
        <div className="space-y-0 max-w-2xl divide-y divide-border">

          {/* Schedule name */}
          <div className="pb-8">
            <h2 className="font-semibold mb-0.5">Schedule name</h2>
            <p className="text-sm text-muted-foreground mb-4">Rename this availability schedule.</p>
            <div className="flex items-center gap-3">
              <Input id="adv-name" value={advName} onChange={(e) => setAdvName(e.target.value)}
                className="max-w-xs" maxLength={80} />
              <Button size="sm" disabled={isPending || advName.trim() === scheduleName}
                onClick={() => handleSave(advName.trim())} className="gap-1.5 shrink-0">
                <FloppyDisk size={13} />
                {isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Timezone */}
          <div className="py-8">
            <h2 className="font-semibold mb-0.5">Timezone</h2>
            <p className="text-sm text-muted-foreground mb-4">All booking times are displayed in this timezone.</p>
            <button type="button" onClick={() => setTzDialogOpen(true)}
              className="flex items-center gap-2 h-9 px-3 border border-input text-sm hover:bg-muted transition-colors max-w-xs w-full text-left">
              <Globe size={14} className="text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{currentTz.replace(/_/g, ' ')}</span>
              <CaretDown size={12} className="text-muted-foreground shrink-0" />
            </button>
          </div>

          {/* Meeting limits */}
          <div className="py-8">
            <h2 className="font-semibold mb-0.5">Meeting limits</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set a maximum number of total meetings. You can also set specific limits within{' '}
              <a href="/event-types" className="text-primary hover:underline">individual events</a>.
            </p>

            {meetingLimits.length > 0 && (
              <div className="space-y-3 mb-4">
                <p className="text-sm text-muted-foreground font-medium">Schedule no more than...</p>
                {meetingLimits.map((limit, i) => {
                  const usedPeriods = meetingLimits.map((l) => l.period)
                  const availablePeriods = (['day', 'week', 'month'] as const).filter(
                    (p) => p === limit.period || !usedPeriods.includes(p)
                  )
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="number" min={1} max={999} value={limit.count} placeholder="0"
                        onChange={(e) => setMeetingLimits((prev) => prev.map((l, idx) => idx === i ? { ...l, count: e.target.value } : l))}
                        className="w-20 text-center h-9 text-sm"
                      />
                      <span className="text-sm text-muted-foreground shrink-0">meetings per</span>
                      <Select value={limit.period}
                        onValueChange={(v) => setMeetingLimits((prev) => prev.map((l, idx) => idx === i ? { ...l, period: v as 'day' | 'week' | 'month' } : l))}>
                        <SelectTrigger className="w-28 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" sideOffset={4} style={{ maxHeight: '200px' }}>
                          {availablePeriods.map((p) => (
                            <SelectItem key={p} value={p} className="text-sm capitalize">{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button type="button"
                        onClick={() => setMeetingLimits((prev) => prev.filter((_, idx) => idx !== i))}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {meetingLimits.length < 3 && (
              <button type="button"
                onClick={() => {
                  const used = meetingLimits.map((l) => l.period)
                  const next = (['day', 'week', 'month'] as const).find((p) => !used.includes(p))
                  if (next) setMeetingLimits((prev) => [...prev, { period: next, count: '' }])
                }}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
                <Plus size={13} />
                {meetingLimits.length === 0 ? 'Add a meeting limit' : 'Add another meeting limit'}
              </button>
            )}
          </div>

          {/* Holidays */}
          <div className="py-8">
            <h2 className="font-semibold mb-0.5">Holidays</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Automatically block public holidays as unavailable on your calendar.
            </p>

            {(() => {
              const holidays = HOLIDAYS[holidayCountry] ?? []
              const allBlocked = holidays.length > 0 && holidays.every((h) => overrideMap.get(h.date)?.isBlocked)
              return (
                <>
                  <div className="flex items-center justify-between border border-border px-4 py-3 mb-0 bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Select value={holidayCountry} onValueChange={setHolidayCountry}>
                        <SelectTrigger className="w-48 h-9 text-sm border-0 px-3 focus-visible:ring-0 gap-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" sideOffset={4} style={{ maxHeight: '200px' }}>
                          {HOLIDAY_COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code} className="text-sm">{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Switch checked={allBlocked} disabled={isPending}
                      onCheckedChange={handleAllHolidaysToggle} />
                  </div>

                  <div className="border border-t-0 border-border">
                    {holidays.map((h) => {
                      const isBlocked = overrideMap.get(h.date)?.isBlocked === true
                      return (
                        <div key={h.date}
                          className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                          <div>
                            <p className="text-sm font-medium">{h.name}</p>
                            <p className="text-xs text-muted-foreground">{fmtDate(h.date)}</p>
                          </div>
                          <Switch checked={isBlocked} disabled={isPending}
                            onCheckedChange={(checked) => handleHolidayToggle(h.date, checked)} />
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>

        </div>
      )}

      {/* ── SCHEDULES TAB ── */}
      {pageTab === 'schedules' && (
        <div className="space-y-5">
          {/* Schedule header bar */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Schedule</p>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{scheduleName}</span>
                <span className="text-xs text-primary font-medium">(default)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex border border-border overflow-hidden">
                <button type="button" onClick={() => setViewMode('list')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                    viewMode === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}>
                  <List size={13} /> List
                </button>
                <button type="button" onClick={() => setViewMode('calendar')}
                  className={cn('flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border-l border-border transition-colors',
                    viewMode === 'calendar' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}>
                  <CalendarBlank size={13} /> Calendar
                </button>
              </div>
              <Button size="sm" onClick={() => handleSave()} disabled={isPending || !scheduleEdited} className="gap-1.5">
                <FloppyDisk size={13} />
                {isPending ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <FullCalendarView
              grid={grid} overrides={overrides} currentTz={currentTz}
              onTzClick={() => setTzDialogOpen(true)}
              onDateClick={(date) => openDialog(date)}
            />
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 xl:divide-x xl:divide-border">

              {/* Left: Weekly hours */}
              <div className="space-y-4 xl:pr-10">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Weekly hours</p>
                    <p className="text-xs text-muted-foreground">Set when you are typically available for meetings</p>
                  </div>
                </div>

                <div className="space-y-0">
                  {DAYS.map(({ key, letter, label }) => {
                    const slots = grid[key]
                    const enabled = slots.length > 0

                    return (
                      <div key={key} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-b-0">
                        {/* Day letter badge — click to toggle */}
                        <button type="button" onClick={() => setDay(key, !enabled)}
                          title={enabled ? `Disable ${label}` : `Enable ${label}`}
                          className={cn(
                            'flex size-7 shrink-0 items-center justify-center text-xs font-bold select-none transition-colors mt-1',
                            enabled ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/20'
                          )}>
                          {letter}
                        </button>

                        {enabled ? (
                          <div className="flex flex-col gap-1.5 flex-1">
                            {slots.map((slot, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <Select value={slot.startTime} onValueChange={(v) => updateSlot(key, i, 'startTime', v)}>
                                  <SelectTrigger className="h-9 w-[105px] text-sm"><SelectValue>{fmt12(slot.startTime)}</SelectValue></SelectTrigger>
                                  <SelectContent position="popper" side="bottom" sideOffset={4} className="w-[120px]" style={{ maxHeight: '220px' }}>
                                    {TIMES.map((t) => <SelectItem key={t} value={t} className="text-sm">{fmt12(t)}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                <span className="text-muted-foreground text-xs shrink-0">-</span>
                                <Select value={slot.endTime} onValueChange={(v) => updateSlot(key, i, 'endTime', v)}>
                                  <SelectTrigger className="h-9 w-[105px] text-sm"><SelectValue>{fmt12(slot.endTime)}</SelectValue></SelectTrigger>
                                  <SelectContent position="popper" side="bottom" sideOffset={4} className="w-[120px]" style={{ maxHeight: '220px' }}>
                                    {TIMES.map((t) => <SelectItem key={t} value={t} className="text-sm">{fmt12(t)}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                                {/* Remove slot — only when there are multiple slots */}
                                {slots.length > 1 && (
                                  <button type="button" onClick={() => removeSlot(key, i)}
                                    className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                                    <X size={13} />
                                  </button>
                                )}
                                {/* Add slot — only on the last row */}
                                {i === slots.length - 1 && (
                                  <button type="button" onClick={() => addSlot(key)}
                                    className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0" title="Add time interval">
                                    <Plus size={13} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 flex-1 mt-1">
                            <span className="text-sm text-muted-foreground">Unavailable</span>
                            <button type="button" onClick={() => setDay(key, true)}
                              className="p-0.5 text-muted-foreground hover:text-primary transition-colors" title={`Add hours for ${label}`}>
                              <Plus size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

              </div>

              {/* Right: Date-specific hours */}
              <div className="space-y-4 xl:pl-10 pt-6 xl:pt-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarCheck size={15} className="text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">Date-specific hours</p>
                      <p className="text-xs text-muted-foreground">Adjust hours for specific days</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => openDialog()}>
                    <Plus size={13} /> Hours
                  </Button>
                </div>

                {overrides.length > 0 ? (
                  <div className="space-y-2">
                    {overrides.map((o) => (
                      <div key={o.date} className="flex items-center justify-between border border-border bg-card px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{fmtDate(o.date)}</p>
                          {o.isBlocked
                            ? <span className="inline-block text-[11px] text-muted-foreground bg-muted px-2 py-0.5 mt-0.5">Unavailable</span>
                            : <div className="mt-0.5 space-y-0.5">
                                {o.slots.map((s, i) => (
                                  <p key={i} className="text-xs text-muted-foreground">{fmt12(s.startTime)} – {fmt12(s.endTime)}</p>
                                ))}
                              </div>
                          }
                        </div>
                        <button type="button" onClick={() => handleDeleteOverride(o.date)} disabled={isPending}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40">
                          <Trash size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-border py-10 flex flex-col items-center justify-center gap-2 text-center">
                    <CalendarCheck size={24} className="text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No date-specific hours yet.</p>
                    <button type="button" onClick={() => openDialog()} className="text-xs text-primary hover:text-primary/80 transition-colors">
                      + Add an override
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Override dialog */}
      <OverrideDialog
        open={dialogOpen} onClose={() => setDialogOpen(false)}
        defaultDate={dialogDate} weekGrid={grid} overrideMap={overrideMap}
        onApply={handleApplyOverride} isPending={isPending}
      />

      {/* Timezone dialog */}
      <Dialog open={tzDialogOpen} onOpenChange={(open) => { setTzDialogOpen(open); if (!open) setTzSearch('') }}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Change timezone</DialogTitle>
          <DialogDescription className="sr-only">Select your timezone</DialogDescription>
          <div className="space-y-3">
            <Input placeholder="Search timezones…" value={tzSearch} onChange={(e) => setTzSearch(e.target.value)} autoFocus className="h-9" />
            <div className="max-h-64 overflow-y-auto border border-border">
              {filteredTz.map((tz) => (
                <button key={tz} type="button" onClick={() => handleTzChange(tz)} disabled={isPending}
                  className={cn('w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between',
                    tz === currentTz && 'bg-primary/10 text-primary font-medium')}>
                  <span>{getTzLabel(tz)}</span>
                  {tz === currentTz && <CheckCircle size={14} weight="fill" />}
                </button>
              ))}
              {filteredTz.length === 0 && <p className="px-3 py-4 text-sm text-muted-foreground text-center">No matches</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
