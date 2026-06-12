'use client'

import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { BuilderFormValues } from './builder'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

const COLOR_SWATCHES = [
  '#0d9488', // teal (primary)
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#64748b', // slate
  '#292524', // dark
]

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meeting'
}

interface TabGeneralProps {
  form: UseFormReturn<BuilderFormValues>
  username: string | null
}

export function TabGeneral({ form, username }: TabGeneralProps) {
  const name = form.watch('name')
  const slug = form.watch('slug')
  const color = form.watch('color')

  // Auto-generate slug from name (only when slug hasn't been manually edited)
  useEffect(() => {
    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', slugify(name), { shouldDirty: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const bookingUrl = username ? `${APP_URL}/${username}/${slug}` : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">General</h2>
        <p className="text-sm text-muted-foreground mt-1">Basic details about this event type.</p>
      </div>

      <Separator />

      {/* Name */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event name <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input placeholder="e.g. 30 Minute Meeting" maxLength={100} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="What should invitees know about this meeting?"
                rows={3}
                maxLength={500}
                className="resize-none"
                {...field}
                value={field.value ?? ''}
              />
            </FormControl>
            <FormDescription>Shown on your booking page.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* URL slug */}
      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL</FormLabel>
            <FormControl>
              <div className="flex items-stretch border border-input">
                {username && (
                  <span className="flex items-center bg-muted px-3 text-xs text-muted-foreground border-r border-input whitespace-nowrap">
                    /{username}/
                  </span>
                )}
                <Input
                  className="border-0 rounded-none shadow-none focus-visible:ring-0"
                  placeholder="meeting-slug"
                  maxLength={100}
                  {...field}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    field.onChange(val)
                  }}
                />
              </div>
            </FormControl>
            {bookingUrl && (
              <FormDescription className="font-mono text-xs break-all">{bookingUrl}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Color */}
      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Color</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => field.onChange(c)}
                    className="h-7 w-7 shrink-0 border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: field.value === c ? c : 'transparent',
                      outline: field.value === c ? `2px solid ${c}` : undefined,
                      outlineOffset: field.value === c ? '2px' : undefined,
                    }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
                {/* Custom hex input */}
                <div className="flex items-center gap-1.5">
                  <div className="h-7 w-7 shrink-0 border border-input" style={{ backgroundColor: color }} />
                  <Input
                    className="h-7 w-24 text-xs font-mono"
                    maxLength={7}
                    value={field.value}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^#[0-9a-fA-F]{0,6}$/.test(val)) field.onChange(val)
                    }}
                  />
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* Active toggle */}
      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4">
            <div>
              <FormLabel className="text-sm font-medium">Active</FormLabel>
              <FormDescription className="text-xs">
                Inactive event types are hidden from your booking page.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Hidden toggle */}
      <FormField
        control={form.control}
        name="isHidden"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4">
            <div>
              <FormLabel className="text-sm font-medium">Hide from profile page</FormLabel>
              <FormDescription className="text-xs">
                Only people with the direct link can book this event type.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
