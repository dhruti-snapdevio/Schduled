'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, FloppyDisk, X } from '@phosphor-icons/react'
import { createEventType, updateEventType, type EventTypeFormData } from '@/app/actions/event-types'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

export function EventTypeBuilder({
  mode, eventTypeId, defaultValues, schedules, questions = [], username,
}: BuilderProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const isDirty = form.formState.isDirty

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
        const res = await createEventType(data)
        if ('error' in res) { toast.error(res.error); return }
        toast.success('Event type created')
        router.push(`/event-types/${res.id}`)
      } else {
        const res = await updateEventType(eventTypeId!, data)
        if ('error' in res) { toast.error(res.error); return }
        toast.success('Changes saved')
        form.reset(values)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
                : (mode === 'create' ? 'Create event type' : 'Save changes')}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general">
          {/* Tab bar — sticky within the scrollable main area */}
          <div className="sticky top-0 z-10 -mx-4 md:-mx-6 border-b border-border bg-page px-4 md:px-6 mb-6">
            <TabsList className="h-auto bg-transparent p-0 gap-0 overflow-x-auto flex-nowrap">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab content — max-width centered */}
          <div className="max-w-2xl">
            <TabsContent value="general" className="mt-0">
              <TabGeneral form={form} username={username} />
            </TabsContent>
            <TabsContent value="availability" className="mt-0">
              <TabAvailability form={form} schedules={schedules} />
            </TabsContent>
            <TabsContent value="location" className="mt-0">
              <TabLocation form={form} />
            </TabsContent>
            <TabsContent value="questions" className="mt-0">
              <TabQuestions
                eventTypeId={eventTypeId}
                questions={questions}
                mode={mode}
              />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <TabNotifications form={form} />
            </TabsContent>
            <TabsContent value="cancellation" className="mt-0">
              <TabCancellation form={form} />
            </TabsContent>
          </div>
        </Tabs>
      </form>
    </Form>
  )
}
