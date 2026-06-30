'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash, X, ToggleLeft, ToggleRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { bulkDeleteEventTypes, bulkToggleEventTypes, reorderEventTypes } from '@/app/actions/event-types'
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
  meetingType?: string | null
  isActive: boolean
  isHidden: boolean
  durations: { duration: number; isDefault: boolean }[]
}

interface EventTypeListProps {
  eventTypes: EventType[]
  username: string | null
  statsMap: Map<string, EventTypeStats>
}

interface SortableItemProps {
  et: EventType
  username: string | null
  stats?: EventTypeStats
  isSelected: boolean
  onSelect: (id: string, selected: boolean) => void
}

function SortableItem({ et, username, stats, isSelected, onSelect }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: et.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    // Drag listeners on the whole wrapper — any point on the card can initiate drag.
    // The distance:8 activation constraint ensures button/link clicks still fire normally.
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <EventTypeCard
        id={et.id}
        name={et.name}
        slug={et.slug}
        color={et.color}
        locationType={et.locationType}
        meetingType={et.meetingType ?? undefined}
        isActive={et.isActive}
        isHidden={et.isHidden}
        durations={et.durations}
        username={username}
        stats={stats}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    </div>
  )
}

export function EventTypeList({ eventTypes: initialEventTypes, username, statsMap }: EventTypeListProps) {
  const router = useRouter()
  const [orderedTypes, setOrderedTypes] = useState(initialEventTypes)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setOrderedTypes(initialEventTypes) }, [initialEventTypes])

  const sensors = useSensors(
    // Mouse / stylus — activate after 8px movement to avoid click interference
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // Touch — long-press 200ms to distinguish from scroll gestures
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = orderedTypes.findIndex((et) => et.id === active.id)
    const newIndex = orderedTypes.findIndex((et) => et.id === over.id)
    const next = arrayMove(orderedTypes, oldIndex, newIndex)
    setOrderedTypes(next)

    startTransition(async () => {
      const res = await reorderEventTypes(next.map((et) => et.id))
      if ('error' in res) {
        toast.error(res.error)
        setOrderedTypes(orderedTypes)
      }
    })
  }

  function handleDragCancel() {
    setActiveId(null)
  }

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
  const activeType = orderedTypes.find((et) => et.id === activeId)

  const selectedTypes = orderedTypes.filter((et) => selectedIds.has(et.id))
  const allOn = selectedTypes.length > 0 && selectedTypes.every((et) => et.isActive)
  const allOff = selectedTypes.length > 0 && selectedTypes.every((et) => !et.isActive)
  const showTurnOn = !allOn
  const showTurnOff = !allOff

  return (
    <>
      <DndContext
        id="event-type-list"
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={orderedTypes.map((et) => et.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {orderedTypes.map((et) => (
              <SortableItem
                key={et.id}
                et={et}
                username={username}
                stats={statsMap.get(et.id)}
                isSelected={selectedIds.has(et.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </SortableContext>

        {/* Floating overlay — follows the cursor freely in all directions */}
        <DragOverlay dropAnimation={null}>
          {activeType && (
            <div className="ring-1 ring-foreground/10" style={{ opacity: 0.95 }}>
              <EventTypeCard
                id={activeType.id}
                name={activeType.name}
                slug={activeType.slug}
                color={activeType.color}
                locationType={activeType.locationType}
                meetingType={activeType.meetingType ?? undefined}
                isActive={activeType.isActive}
                isHidden={activeType.isHidden}
                durations={activeType.durations}
                username={username}
                stats={statsMap.get(activeType.id)}
                isSelected={false}
                onSelect={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── Bottom selection action bar ──────────────────────────── */}
      {count > 0 && (
        <div className="fixed bottom-4 left-4 md:left-[256px] right-4 z-50 flex items-center gap-3 border border-border bg-background px-5 py-3 ring-1 ring-foreground/10">
          {/* Clear */}
          <button
            type="button"
            onClick={clearSelection}
            className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Clear selection" aria-label="Clear selection"
          >
            <X size={16} weight="bold" />
          </button>

          {/* Count */}
          <span className="text-sm font-semibold text-foreground">
            {count} selected
          </span>

          <div className="flex-1" />

          {showTurnOn && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkToggle(true)}
              className="gap-1.5"
            >
              <ToggleRight size={15} weight="bold" />
              <span className="hidden sm:inline">Turn On</span>
            </Button>
          )}

          {showTurnOff && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkToggle(false)}
              className="gap-1.5"
            >
              <ToggleLeft size={15} weight="bold" />
              <span className="hidden sm:inline">Turn Off</span>
            </Button>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isPending}
                className="gap-1.5"
              >
                <Trash size={15} weight="bold" />
                <span className="hidden sm:inline">Delete</span>
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
