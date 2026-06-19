'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  Check,
  Clock,
  Copy,
  DotsThreeVertical,
  Link as LinkIcon,
  MapPin,
  PencilSimple,
  Phone,
  Globe,
  GoogleLogo,
  Screencast,
  Trash,
  VideoCamera,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  deleteEventType,
  duplicateEventType,
  toggleEventTypeActive,
} from '@/app/actions/event-types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

interface Duration {
  duration: number
  isDefault: boolean
}

export interface EventTypeStats {
  countThisMonth: number
  lastBooked: Date | null
}

interface EventTypeCardProps {
  id: string
  name: string
  slug: string
  color?: string | null
  locationType: string
  isActive: boolean
  isHidden: boolean
  durations: Duration[]
  username: string | null
  stats?: EventTypeStats
}

// ── Location meta ────────────────────────────────────────────────────────────

const LOCATION_META: Record<string, {
  label: string
  bg: string
  text: string
  icon: React.ReactNode
}> = {
  zoom:                { label: 'Zoom',              bg: '#EFF6FF', text: '#2563EB', icon: <VideoCamera size={11} weight="fill" /> },
  google_meet:         { label: 'Google Meet',       bg: '#F0FDF4', text: '#16A34A', icon: <GoogleLogo  size={11} weight="bold"  /> },
  phone_host_calls:    { label: 'Phone call',        bg: '#F0FDFA', text: '#0D9488', icon: <Phone       size={11} weight="fill" /> },
  phone_invitee_calls: { label: 'Phone (invitee)',   bg: '#F0FDFA', text: '#0D9488', icon: <Phone       size={11} weight="fill" /> },
  in_person:           { label: 'In-person',         bg: '#FAF5FF', text: '#9333EA', icon: <MapPin      size={11} weight="fill" /> },
  custom:              { label: 'Custom',            bg: '#F9FAFB', text: '#6B7280', icon: <Globe       size={11} weight="fill" /> },
  invitees_choice:     { label: "Invitee's choice",  bg: '#F9FAFB', text: '#6B7280', icon: <Screencast  size={11} weight="fill" /> },
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function relativeDate(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function EventTypeCard({
  id, name, slug, color, locationType, isActive, isHidden, durations, username, stats,
}: EventTypeCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const loc = LOCATION_META[locationType] ?? LOCATION_META.custom

  const bookingUrl = username ? `${APP_URL}/${username}/${slug}` : null
  const displayUrl = username
    ? `${APP_URL.replace(/^https?:\/\//, '')}/${username}/${slug}`
    : null

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const res = await toggleEventTypeActive(id, checked)
      if ('error' in res) toast.error(res.error)
      else router.refresh()
    })
  }

  function handleDuplicate() {
    startTransition(async () => {
      const res = await duplicateEventType(id)
      if ('error' in res) toast.error(res.error)
      else { toast.success('Event type duplicated'); router.refresh() }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteEventType(id)
      if ('error' in res) toast.error(res.error)
      else { toast.success('Event type deleted'); router.refresh() }
    })
  }

  function copyLink() {
    if (!bookingUrl || copied) return
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const sortedDurations = [...durations].sort((a, b) => a.duration - b.duration)

  return (
    <div className={cn(
      'group flex items-stretch border border-border bg-card',
      'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50',
      !isActive && 'opacity-60',
    )}>
      {/* Colored left bar — uses the event's chosen color */}
      <div className="w-1 shrink-0" style={{ backgroundColor: color || 'var(--primary)' }} />

      {/* Card body */}
      <div className="flex flex-1 items-center gap-4 px-4 py-3.5 min-w-0">

        {/* ── Left: info ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-1.5">

          {/* Name + status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{name}</span>
            {isHidden && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 rounded-none font-medium">
                Hidden
              </Badge>
            )}
            {!isActive && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 rounded-none font-medium">
                Inactive
              </Badge>
            )}
          </div>

          {/* Duration pills + provider badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {sortedDurations.map((d) => (
              <span
                key={d.duration}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-medium bg-primary/10 text-primary"
              >
                <Clock size={10} weight="bold" />
                {formatDuration(d.duration)}
              </span>
            ))}

            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-medium"
              style={{ backgroundColor: loc.bg, color: loc.text }}
            >
              {loc.icon}
              {loc.label}
            </span>
          </div>

          {/* Booking URL */}
          {isActive && displayUrl && (
            <div className="flex items-center gap-1.5">
              <LinkIcon size={11} className="shrink-0 text-muted-foreground/60" />
              <span className="text-[11px] text-muted-foreground truncate max-w-[260px]">
                {displayUrl}
              </span>
              <button
                type="button"
                onClick={copyLink}
                className={cn(
                  'shrink-0 inline-flex items-center gap-0.5 text-[10px] font-semibold transition-colors',
                  copied
                    ? 'text-emerald-600'
                    : 'text-primary hover:underline',
                )}
              >
                {copied ? <Check size={10} weight="bold" /> : <Copy size={10} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Booking stats */}
          {stats && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">{stats.countThisMonth}</span>
              {' '}booking{stats.countThisMonth !== 1 ? 's' : ''} this month
              {stats.lastBooked && (
                <> · Last: <span className="font-medium text-foreground">{relativeDate(stats.lastBooked)}</span></>
              )}
            </p>
          )}
        </div>

        {/* ── Right: controls ─────────────────────────────────────── */}
        <div className="flex items-center gap-1 shrink-0">

          {/* Toggle + ON/OFF label */}
          <div className="flex items-center gap-1 mr-1">
            <Switch
              checked={isActive}
              disabled={isPending}
              onCheckedChange={handleToggle}
              aria-label={isActive ? 'Deactivate' : 'Activate'}
            />
            <span className={cn(
              'w-6 text-[10px] font-bold leading-none',
              isActive ? 'text-primary' : 'text-muted-foreground/50',
            )}>
              {isActive ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Copy link */}
          {isActive && (
            <button
              type="button"
              title={copied ? 'Copied!' : 'Copy link'}
              onClick={copyLink}
              disabled={!bookingUrl}
              className={cn(
                'flex h-8 w-8 items-center justify-center transition-all opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 hover:scale-105 disabled:pointer-events-none',
                copied
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
              )}
            >
              {copied ? <Check size={15} weight="bold" /> : <LinkIcon size={15} />}
            </button>
          )}

          {/* Edit */}
          <Link
            href={`/event-types/${id}`}
            aria-label={`Edit ${name}`}
            title="Edit"
            className="flex h-8 w-8 items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-all hover:bg-primary/10 hover:text-primary hover:scale-105"
          >
            <PencilSimple size={15} />
          </Link>

          {/* ⋮ More */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="More"
                disabled={isPending}
                className="flex h-8 w-8 items-center justify-center rounded-none text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary hover:scale-105 disabled:opacity-50"
              >
                <DotsThreeVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`/event-types/${id}`} className="flex items-center gap-2">
                  <PencilSimple size={14} /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={copyLink}
                disabled={!bookingUrl || !isActive}
              >
                <LinkIcon size={14} /> Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={handleDuplicate}
              >
                <Copy size={14} /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash size={14} /> Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete &ldquo;{name}&rdquo;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this event type and all associated questions.
                      Existing bookings will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
