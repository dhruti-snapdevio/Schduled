'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  Copy,
  DotsThreeVertical,
  Link as LinkIcon,
  PencilSimple,
  Trash,
  VideoCamera,
  GoogleLogo,
  Phone,
  MapPin,
  Globe,
  Screencast,
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

interface Duration {
  duration: number
  isDefault: boolean
}

interface EventTypeCardProps {
  id: string
  name: string
  slug: string
  color: string
  locationType: string
  isActive: boolean
  isHidden: boolean
  durations: Duration[]
  username: string | null
}

const LOCATION_META: Record<string, { label: string; icon: React.ReactNode }> = {
  zoom:                  { label: 'Zoom',             icon: <VideoCamera size={14} weight="fill" className="text-[#2D8CFF]" /> },
  google_meet:           { label: 'Google Meet',      icon: <GoogleLogo  size={14} weight="bold"  className="text-[#4285F4]" /> },
  phone_host_calls:      { label: 'Phone call',       icon: <Phone       size={14} weight="fill"  className="text-primary"   /> },
  phone_invitee_calls:   { label: 'Phone (invitee)',  icon: <Phone       size={14} weight="fill"  className="text-primary"   /> },
  in_person:             { label: 'In-person',        icon: <MapPin      size={14} weight="fill"  className="text-primary"   /> },
  custom:                { label: 'Custom',           icon: <Globe       size={14} weight="fill"  className="text-muted-foreground" /> },
  invitees_choice:       { label: "Invitee's choice", icon: <Screencast  size={14} weight="fill"  className="text-muted-foreground" /> },
}

function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function EventTypeCard({
  id, name, slug, color, locationType, isActive, isHidden, durations, username,
}: EventTypeCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const loc = LOCATION_META[locationType] ?? LOCATION_META.custom

  const bookingUrl = username
    ? `${APP_URL}/${username}/${slug}`
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
      else {
        toast.success('Event type duplicated')
        router.refresh()
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteEventType(id)
      if ('error' in res) toast.error(res.error)
      else {
        toast.success('Event type deleted')
        router.refresh()
      }
    })
  }

  function copyLink() {
    if (!bookingUrl) return
    navigator.clipboard.writeText(bookingUrl)
    toast.success('Link copied to clipboard')
  }

  const sortedDurations = [...durations].sort((a, b) => a.duration - b.duration)

  return (
    <div className="group flex items-stretch border border-border bg-card transition-colors hover:border-primary/30">
      {/* Color bar */}
      <div className="w-1 shrink-0" style={{ backgroundColor: color }} />

      {/* Content */}
      <div className="flex flex-1 items-center gap-4 px-4 py-4 min-w-0">
        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold truncate">{name}</span>
            {isHidden && (
              <Badge variant="outline" className="text-xs py-0">Hidden</Badge>
            )}
            {!isActive && (
              <Badge variant="secondary" className="text-xs py-0">Inactive</Badge>
            )}
          </div>

          {/* Duration pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {sortedDurations.map((d) => (
              <span
                key={d.duration}
                className={`inline-flex items-center px-2 py-0.5 text-xs border ${
                  d.isDefault
                    ? 'border-primary/40 bg-primary/5 text-primary font-medium'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {formatDuration(d.duration)}
              </span>
            ))}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {loc.icon}
            <span>{loc.label}</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active toggle */}
          <Switch
            checked={isActive}
            disabled={isPending}
            onCheckedChange={handleToggle}
            aria-label={isActive ? 'Deactivate event type' : 'Activate event type'}
          />

          {/* Copy link */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy booking link"
            onClick={copyLink}
            disabled={!bookingUrl}
          >
            <LinkIcon size={15} />
          </Button>

          {/* Edit */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit"
            asChild
          >
            <Link href={`/event-types/${id}`}>
              <PencilSimple size={15} />
            </Link>
          </Button>

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled={isPending}
              >
                <DotsThreeVertical size={16} />
              </Button>
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
                disabled={!bookingUrl}
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
                    <AlertDialogTitle>Delete "{name}"?</AlertDialogTitle>
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
