'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { BuilderFormValues } from './builder'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  VideoCamera,
  GoogleLogo,
  Phone,
  MapPin,
  Globe,
  Screencast,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

type LocationType = BuilderFormValues['locationType']

interface LocationOption {
  value: LocationType
  label: string
  sub: string
  icon: React.ReactNode
  requiresValue?: boolean
  valuePlaceholder?: string
  valueLabel?: string
  requiresPhone?: boolean
}

const LOCATION_OPTIONS: LocationOption[] = [
  {
    value: 'google_meet',
    label: 'Google Meet',
    sub: 'Auto-generate a Google Meet link for each booking.',
    icon: <GoogleLogo size={22} weight="bold" className="text-[#4285F4]" />,
  },
  {
    value: 'zoom',
    label: 'Zoom',
    sub: 'Auto-generate a Zoom meeting link for each booking.',
    icon: <VideoCamera size={22} weight="fill" className="text-[#2D8CFF]" />,
  },
  {
    value: 'phone_host_calls',
    label: 'Phone call (you call)',
    sub: 'You call the invitee on their provided phone number.',
    icon: <Phone size={22} weight="fill" className="text-primary" />,
  },
  {
    value: 'phone_invitee_calls',
    label: 'Phone call (they call)',
    sub: 'The invitee calls you.',
    icon: <Phone size={22} weight="fill" className="text-primary" />,
    requiresPhone: true,
  },
  {
    value: 'in_person',
    label: 'In-person',
    sub: 'Specify a physical address where you will meet.',
    icon: <MapPin size={22} weight="fill" className="text-orange-500" />,
    requiresValue: true,
    valuePlaceholder: 'e.g. 123 Main St, New York, NY',
    valueLabel: 'Location address',
  },
  {
    value: 'custom',
    label: 'Custom',
    sub: 'Provide your own meeting link or description.',
    icon: <Globe size={22} weight="fill" className="text-muted-foreground" />,
    requiresValue: true,
    valuePlaceholder: 'e.g. https://meet.example.com/my-room',
    valueLabel: 'Custom location',
  },
  {
    value: 'invitees_choice',
    label: "Invitee's choice",
    sub: 'Let the invitee choose their preferred meeting type.',
    icon: <Screencast size={22} weight="fill" className="text-muted-foreground" />,
  },
]

interface TabLocationProps {
  form: UseFormReturn<BuilderFormValues>
}

export function TabLocation({ form }: TabLocationProps) {
  const locationType = form.watch('locationType')
  const selected = LOCATION_OPTIONS.find((o) => o.value === locationType)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Location</h2>
        <p className="text-sm text-muted-foreground mt-1">Where will this meeting take place?</p>
      </div>

      <Separator />

      <FormField
        control={form.control}
        name="locationType"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Location type</FormLabel>
            <div className="grid grid-cols-1 gap-2">
              {LOCATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => field.onChange(opt.value)}
                  className={cn(
                    'flex items-start gap-4 border p-4 text-left transition',
                    field.value === opt.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30',
                  )}
                >
                  <span className="mt-0.5 shrink-0">{opt.icon}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{opt.sub}</span>
                  </span>
                  <span
                    className={cn(
                      'mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition',
                      field.value === opt.value ? 'border-primary bg-primary' : 'border-border',
                    )}
                  />
                </button>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Extra fields when value is required */}
      {selected?.requiresValue && (
        <FormField
          control={form.control}
          name="locationValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{selected.valueLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={selected.valuePlaceholder}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {selected?.requiresPhone && (
        <FormField
          control={form.control}
          name="hostPhoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your phone number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>Shown to invitees so they know how to reach you.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
