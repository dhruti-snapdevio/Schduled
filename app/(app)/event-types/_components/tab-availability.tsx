'use client'

import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { BuilderFormValues, ScheduleOption } from './builder'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

const DURATION_PRESETS = [15, 20, 30, 45, 60, 90, 120]

function formatDuration(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

interface TabAvailabilityProps {
  form: UseFormReturn<BuilderFormValues>
  schedules: ScheduleOption[]
}

export function TabAvailability({ form, schedules }: TabAvailabilityProps) {
  const [customDuration, setCustomDuration] = useState('')
  const durations = form.watch('durations')
  const defaultDuration = form.watch('defaultDuration')

  function addDuration(minutes: number) {
    if (durations.includes(minutes)) return
    const next = [...durations, minutes].sort((a, b) => a - b)
    form.setValue('durations', next, { shouldDirty: true })
    if (next.length === 1) form.setValue('defaultDuration', minutes, { shouldDirty: true })
  }

  function removeDuration(minutes: number) {
    const next = durations.filter((d) => d !== minutes)
    form.setValue('durations', next, { shouldDirty: true })
    if (defaultDuration === minutes && next.length > 0) {
      form.setValue('defaultDuration', next[0], { shouldDirty: true })
    }
  }

  function setDefault(minutes: number) {
    form.setValue('defaultDuration', minutes, { shouldDirty: true })
  }

  function addCustom() {
    const n = parseInt(customDuration, 10)
    if (!n || n < 5 || n > 480) return
    addDuration(n)
    setCustomDuration('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Availability</h2>
        <p className="text-sm text-muted-foreground mt-1">Control when and how people can book this event.</p>
      </div>

      <Separator />

      {/* Duration */}
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Duration</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add one or more durations. Click a duration to set it as default.</p>
        </div>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((d) => {
            const selected = durations.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => selected ? removeDuration(d) : addDuration(d)}
                className={cn(
                  'h-9 px-3 text-sm border transition',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:border-primary hover:bg-muted/50'
                )}
              >
                {formatDuration(d)}
              </button>
            )
          })}

          {/* Custom input */}
          <div className="flex items-stretch gap-1">
            <Input
              type="number"
              min={5}
              max={480}
              placeholder="Custom"
              className="h-9 w-24 text-sm"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={addCustom}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* Selected durations with default picker */}
        {durations.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Click to set as default duration:</p>
            <div className="flex flex-wrap gap-2">
              {[...durations].sort((a, b) => a - b).map((d) => (
                <div key={d} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDefault(d)}
                    className={cn(
                      'h-8 px-2.5 text-xs border transition',
                      d === defaultDuration
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary'
                        : 'border-border text-foreground hover:border-primary'
                    )}
                  >
                    {formatDuration(d)}
                    {d === defaultDuration && <span className="ml-1.5 text-[10px] uppercase tracking-wide opacity-70">default</span>}
                  </button>
                  {durations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDuration(d)}
                      className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {form.formState.errors.durations && (
          <p className="text-xs text-destructive">{form.formState.errors.durations.message}</p>
        )}
      </div>

      <Separator />

      {/* Schedule assignment */}
      {schedules.length > 0 && (
        <FormField
          control={form.control}
          name="availabilityScheduleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Availability schedule</FormLabel>
              <Select
                value={field.value ?? '__none__'}
                onValueChange={(v) => field.onChange(v === '__none__' ? undefined : v)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Use default schedule" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">Use default schedule</SelectItem>
                  {schedules.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.isDefault ? ' (default)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Which availability schedule governs this event type.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Booking window */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bookingWindow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Booking window</FormLabel>
              <FormControl>
                <div className="flex items-stretch border border-input">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    className="border-0 shadow-none focus-visible:ring-0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 60)}
                  />
                  <span className="flex items-center bg-muted px-3 text-xs text-muted-foreground border-l border-input">
                    days
                  </span>
                </div>
              </FormControl>
              <FormDescription>How far ahead people can book.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="minimumNotice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum notice</FormLabel>
              <FormControl>
                <div className="flex items-stretch border border-input">
                  <Input
                    type="number"
                    min={0}
                    max={1440}
                    className="border-0 shadow-none focus-visible:ring-0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                  <span className="flex items-center bg-muted px-3 text-xs text-muted-foreground border-l border-input">
                    min
                  </span>
                </div>
              </FormControl>
              <FormDescription>Minimum lead time for bookings.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Buffers */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bufferBefore"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Buffer before</FormLabel>
              <FormControl>
                <div className="flex items-stretch border border-input">
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    className="border-0 shadow-none focus-visible:ring-0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                  <span className="flex items-center bg-muted px-3 text-xs text-muted-foreground border-l border-input">
                    min
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bufferAfter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Buffer after</FormLabel>
              <FormControl>
                <div className="flex items-stretch border border-input">
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    className="border-0 shadow-none focus-visible:ring-0"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                  <span className="flex items-center bg-muted px-3 text-xs text-muted-foreground border-l border-input">
                    min
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Start time increment */}
      <FormField
        control={form.control}
        name="startTimeIncrement"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Start time increment</FormLabel>
            <Select
              value={String(field.value)}
              onValueChange={(v) => field.onChange(parseInt(v, 10))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {[5, 10, 15, 20, 30, 60].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} minutes</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>How often available start times appear on the booking page.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Max bookings per day */}
      <FormField
        control={form.control}
        name="maxBookingsPerDay"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Max bookings per day</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={100}
                placeholder="Unlimited"
                className="max-w-[160px]"
                value={field.value ?? ''}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10)
                  field.onChange(isNaN(n) ? null : n)
                }}
              />
            </FormControl>
            <FormDescription>Leave empty for unlimited daily bookings.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
