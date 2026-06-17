'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, ArrowSquareOut, CheckCircle, FloppyDisk, List, X } from '@phosphor-icons/react'
import { createEventType, updateEventType, type EventTypeFormData } from '@/app/actions/event-types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { TabGeneral } from './tab-general'
import { TabAvailability } from './tab-availability'
import { TabLocation } from './tab-location'
import { TabQuestions } from './tab-questions'
import { TabNotifications } from './tab-notifications'
import { TabCancellation } from './tab-cancellation'

const schema = z.object({
  name:                    z.string().min(1, 'Name is required').max(100),
  slug:                    z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  description:             z.string().max(500).optional(),
  color:                   z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isActive:                z.boolean(),
  isHidden:                z.boolean(),
  durations:               z.array(z.number().min(5).max(480)).min(1, 'At least one duration required'),
  defaultDuration:         z.number(),
  availabilityScheduleId:  z.string().optional(),
  bookingWindow:           z.number().min(1).max(365),
  bookingWindowType:       z.enum(['rolling', 'fixed']),
  minimumNotice:           z.number().min(0).max(1440),
  bufferBefore:            z.number().min(0).max(120),
  bufferAfter:             z.number().min(0).max(120),
  maxBookingsPerDay:       z.number().min(1).max(100).nullable().optional(),
  startTimeIncrement:      z.number().min(5).max(60),
  locationType:            z.enum(['zoom', 'google_meet', 'phone_host_calls', 'phone_invitee_calls', 'in_person', 'custom', 'invitees_choice']),
  locationValue:           z.string().max(500).optional(),
  hostPhoneNumber:         z.string().max(20).optional(),
  confirmationNote:        z.string().max(1000).optional(),
  allowCancellation:       z.boolean(),
  cancellationCutoffHours: z.number().min(0).max(72),
  allowRescheduling:       z.boolean(),
  rescheduleCutoffHours:   z.number().min(0).max(72),
  requireCancellationReason: z.boolean(),
  showPolicyText:          z.boolean(),
  policyText:              z.string().max(1000).optional(),
})

export type BuilderFormValues = z.infer<typeof schema>

export interface ScheduleOption { id: string; name: string; isDefault: boolean }

export interface ExistingQuestion {
  id: string
  label: string
  type: 'short_text' | 'long_text' | 'phone' | 'single_select' | 'dropdown'
  isRequired: boolean
  options: string[] | null
  placeholder: string | null
  position: number
  isActive: boolean
}

interface BuilderProps {
  mode: 'create' | 'edit'
  eventTypeId?: string
  defaultValues: BuilderFormValues
  schedules: ScheduleOption[]
  questions?: ExistingQuestion[]
  username: string | null
}

const TABS = [
  { id: 'general',       label: 'General' },
  { id: 'availability',  label: 'Availability' },
  { id: 'location',      label: 'Location' },
  { id: 'questions',     label: 'Questions' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'cancellation',  label: 'Cancellation' },
]

// Maps each tab to the form fields it owns — used to jump to the tab with errors
const TAB_FIELDS: Record<string, (keyof BuilderFormValues)[]> = {
  general:       ['name', 'slug', 'description', 'color', 'isActive', 'isHidden'],
  availability:  ['durations', 'defaultDuration', 'availabilityScheduleId', 'bookingWindow', 'bookingWindowType', 'minimumNotice', 'bufferBefore', 'bufferAfter', 'maxBookingsPerDay', 'startTimeIncrement'],
  location:      ['locationType', 'locationValue', 'hostPhoneNumber'],
  notifications: ['confirmationNote'],
  cancellation:  ['allowCancellation', 'cancellationCutoffHours', 'allowRescheduling', 'rescheduleCutoffHours', 'requireCancellationReason', 'showPolicyText', 'policyText'],
}

export function EventTypeBuilder({
  mode, eventTypeId, defaultValues, schedules, questions = [], username,
}: BuilderProps) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('general')
  const [pendingQuestions, setPendingQuestions] = useState<ExistingQuestion[]>([])
  const [successInfo, setSuccessInfo] = useState<{ id: string; slug: string; name: string; isCreate: boolean } | null>(null)

  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const isDirty = form.formState.isDirty
  const tabIndex = TABS.findIndex(t => t.id === activeTab)
  const isFirst = tabIndex === 0
  const isLast = tabIndex === TABS.length - 1

  // When validation fails, jump to the first tab that owns an errored field
  function onInvalid(errors: FieldErrors<BuilderFormValues>) {
    for (const tab of TABS) {
      if ((TAB_FIELDS[tab.id] ?? []).some((f) => f in errors)) {
        setActiveTab(tab.id)
        return
      }
    }
  }

  function onSubmit(values: BuilderFormValues) {
    startTransition(async () => {
      const data: EventTypeFormData = {
        ...values,
        description: values.description || undefined,
        locationValue: values.locationValue || undefined,
        hostPhoneNumber: values.hostPhoneNumber || undefined,
        confirmationNote: values.confirmationNote || undefined,
        policyText: values.policyText || undefined,
        availabilityScheduleId: values.availabilityScheduleId || undefined,
        maxBookingsPerDay: values.maxBookingsPerDay ?? null,
      }

      if (mode === 'create') {
        const res = await createEventType(data, pendingQuestions.map((q) => ({
          label: q.label,
          type: q.type,
          isRequired: q.isRequired,
          options: q.options ?? undefined,
          placeholder: q.placeholder ?? undefined,
        })))
        if ('error' in res) { toast.error(res.error); return }
        setSuccessInfo({ id: res.id, slug: res.slug, name: values.name, isCreate: true })
      } else {
        const res = await updateEventType(eventTypeId!, data)
        if ('error' in res) { toast.error(res.error); return }
        form.reset(values)
        setSuccessInfo({ id: eventTypeId!, slug: values.slug, name: values.name, isCreate: false })
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0 text-muted-foreground">
            <Link href="/event-types"><ArrowLeft size={16} /></Link>
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">
              <Link href="/event-types" className="hover:text-foreground transition-colors">Event Types</Link>
              {' / '}
              <span>{mode === 'create' ? 'New Event Type' : form.watch('name') || 'Edit'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {mode === 'edit' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.reset(defaultValues)}
                disabled={!isDirty || isPending}
                className="text-muted-foreground gap-1.5"
              >
                <X size={13} />
                Discard
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={(mode === 'edit' && !isDirty) || isPending}
              className="gap-1.5"
            >
              <FloppyDisk size={13} />
              {isPending
                ? (mode === 'create' ? 'Creating…' : 'Saving…')
                : (mode === 'create' ? 'Create Event Type' : 'Save Changes')}
            </Button>
          </div>
        </div>

        {/* Tab bar — custom, no Radix Tabs to avoid scroll arrows */}
        <div className="sticky top-0 z-10 -mx-4 md:-mx-6 border-b border-border bg-page px-4 md:px-6 mb-6">
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 border-b-2 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="max-w-2xl">
          {activeTab === 'general' && <TabGeneral form={form} username={username} />}
          {activeTab === 'availability' && <TabAvailability form={form} schedules={schedules} />}
          {activeTab === 'location' && <TabLocation form={form} />}
          {activeTab === 'questions' && (
            <TabQuestions
              eventTypeId={eventTypeId}
              questions={questions}
              mode={mode}
              pendingQuestions={pendingQuestions}
              onPendingChange={setPendingQuestions}
            />
          )}
          {activeTab === 'notifications' && <TabNotifications form={form} />}
          {activeTab === 'cancellation' && <TabCancellation form={form} />}

          {/* Prev / Next navigation */}
          <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveTab(TABS[tabIndex - 1].id)}
              disabled={isFirst}
              className="gap-1.5"
            >
              <ArrowLeft size={13} />
              {isFirst ? 'Previous' : TABS[tabIndex - 1].label}
            </Button>

            {isLast ? (
              <Button
                type="submit"
                size="sm"
                disabled={(mode === 'edit' && !isDirty) || isPending}
                className="gap-1.5"
              >
                <FloppyDisk size={13} />
                {isPending
                  ? (mode === 'create' ? 'Creating…' : 'Saving…')
                  : (mode === 'create' ? 'Create Event Type' : 'Save Changes')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(TABS[tabIndex + 1].id)}
                className="gap-1.5"
              >
                {TABS[tabIndex + 1].label}
                <ArrowRight size={13} />
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Post-save success dialog */}
      <Dialog
        open={!!successInfo}
        onOpenChange={(open) => {
          if (!open) {
            if (successInfo?.isCreate) {
              window.location.href = `/event-types/${successInfo.id}`
            } else {
              setSuccessInfo(null)
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="sr-only">Event type saved</DialogTitle>
          <DialogDescription className="sr-only">Your event type has been saved successfully.</DialogDescription>

          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex h-12 w-12 items-center justify-center bg-primary/10 text-primary">
              <CheckCircle size={28} weight="fill" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base">
                {successInfo?.isCreate ? 'Event type created!' : 'Changes saved!'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground truncate max-w-[260px]">
                {successInfo?.name}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {/* Preview booking page */}
            {username && (
              <a
                href={`/${username}/${successInfo?.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ArrowSquareOut size={14} />
                Preview booking page
              </a>
            )}

            {/* Go to event list */}
            <Link
              href="/event-types"
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium border border-border hover:bg-muted transition-colors"
            >
              <List size={14} />
              Go to event list
            </Link>

            {/* Continue editing (create mode only) */}
            {successInfo?.isCreate && (
              <button
                type="button"
                onClick={() => { window.location.href = `/event-types/${successInfo.id}` }}
                className="inline-flex items-center justify-center h-9 px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue editing
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Form>
  )
}
