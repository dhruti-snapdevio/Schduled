'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash, Power, X, ToggleLeft, ToggleRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { bulkDeleteEventTypes, bulkToggleEventTypes } from '@/app/actions/event-types'
import { EventTypeCard, type EventTypeStats } from './event-type-card'
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
import { Button } from '@/components/ui/button'

interface EventType {
  id: string
  name: string
  slug: string
  color?: string | null
  locationType: string
  isActive: boolean
  isHidden: boolean
  durations: { duration: number; isDefault: boolean }[]
}

interface EventTypeListProps {
  eventTypes: EventType[]
  username: string | null
  statsMap: Map<string, EventTypeStats>
}

export function EventTypeList({ eventTypes, username, statsMap }: EventTypeListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function handleSelect(id: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function handleBulkDelete() {
    startTransition(async () => {
      const res = await bulkDeleteEventTypes(Array.from(selectedIds))
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(`${selectedIds.size} meeting type${selectedIds.size > 1 ? 's' : ''} deleted`)
        setSelectedIds(new Set())
        router.refresh()
      }
    })
  }

  function handleBulkToggle(isActive: boolean) {
    startTransition(async () => {
      const res = await bulkToggleEventTypes(Array.from(selectedIds), isActive)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success(`${selectedIds.size} meeting type${selectedIds.size > 1 ? 's' : ''} turned ${isActive ? 'on' : 'off'}`)
        setSelectedIds(new Set())
        router.refresh()
      }
    })
  }

  const count = selectedIds.size

  return (
    <>
      <div className="space-y-2">
        {eventTypes.map((et) => (
          <EventTypeCard
            key={et.id}
            id={et.id}
            name={et.name}
            slug={et.slug}
            color={et.color}
            locationType={et.locationType}
            isActive={et.isActive}
            isHidden={et.isHidden}
            durations={et.durations}
            username={username}
            stats={statsMap.get(et.id)}
            isSelected={selectedIds.has(et.id)}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {/* ── Bottom selection action bar ──────────────────────────── */}
      {count > 0 && (
        <div className="fixed bottom-4 left-4 md:left-[256px] right-4 z-50 flex items-center gap-3 border border-border bg-background px-5 py-3 ring-1 ring-foreground/10">
          {/* Clear */}
          <button
            type="button"
            onClick={clearSelection}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Clear selection"
          >
            <X size={16} weight="bold" />
          </button>

          {/* Count */}
          <span className="text-sm font-semibold text-foreground">
            {count} selected
          </span>

          <div className="flex-1" />

          {/* Turn On */}
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleBulkToggle(true)}
            className="gap-1.5"
          >
            <ToggleRight size={15} weight="bold" />
            Turn On
          </Button>

          {/* Turn Off */}
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleBulkToggle(false)}
            className="gap-1.5"
          >
            <ToggleLeft size={15} weight="bold" />
            Turn Off
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                className="gap-1.5"
              >
                <Trash size={15} weight="bold" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {count} meeting type{count > 1 ? 's' : ''}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the selected meeting types and all their associated questions.
                  Existing bookings will not be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleBulkDelete}
                >
                  Delete {count}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </>
  )
}
