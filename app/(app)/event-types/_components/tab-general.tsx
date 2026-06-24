'use client'

import { useEffect, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  ArrowsClockwise,
  Check,
  CircleNotch,
  Copy,
  Link as LinkIcon,
  Stack,
  User,
  Users,
  Warning,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { BuilderFormValues } from './builder'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

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

export const MEETING_TYPES = [
  { id: 'one_on_one', label: 'One-on-One', desc: 'Single invitee', icon: <User size={15} />, disabled: false },
  { id: 'group', label: 'Group', desc: 'Coming soon', icon: <Users size={15} />, disabled: true },
  { id: 'round_robin', label: 'Round Robin', desc: 'Coming soon', icon: <ArrowsClockwise size={15} />, disabled: true },
  { id: 'collective', label: 'Collective', desc: 'Coming soon', icon: <Stack size={15} />, disabled: true },
]

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

interface TabGeneralProps {
  form: UseFormReturn<BuilderFormValues>
  username: string | null
  meetingType: string
  onMeetingTypeChange: (type: string) => void
  eventTypeId?: string
}

export function TabGeneral({ form, username, meetingType, onMeetingTypeChange, eventTypeId }: TabGeneralProps) {
  const name = form.watch('name')
  const slug = form.watch('slug')
  const color = form.watch('color')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  // Auto-generate slug from name (only when slug hasn't been manually edited)
  useEffect(() => {
    if (!form.formState.dirtyFields.slug) {
      form.setValue('slug', slugify(name), { shouldDirty: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  // Slug availability check (debounced 600ms)
  useEffect(() => {
    if (!slug || slug.length < 1) {
      setSlugStatus('idle')
      return
    }
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ slug })
        if (eventTypeId) params.set('excludeId', eventTypeId)
        const res = await fetch(`/api/slug-check?${params}`)
        const data = await res.json()
        setSlugStatus(data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('idle')
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [slug, eventTypeId])

  const bookingUrl = username && slug ? `${APP_URL}/${username}/${slug}` : null
  const displayUrl = username && slug
    ? `${(APP_URL || 'schduled.com').replace(/^https?:\/\//, '')}/${username}/${slug}`
    : null

  function copyLink() {
    if (!bookingUrl) return
    navigator.clipboard.writeText(bookingUrl)
    toast.success('Link copied!')
  }

  return (
    <div className="space-y-6">

      {/* ── Meeting type selector ───────────────────────────────── */}
      <div>
        <p className="text-sm font-medium mb-3">Meeting Type</p>
        <div className="grid grid-cols-2 gap-2">
          {MEETING_TYPES.map((mt) => (
            <button
              key={mt.id}
              type="button"
              disabled={mt.disabled}
              onClick={() => !mt.disabled && onMeetingTypeChange(mt.id)}
              className={cn(
                'flex items-start gap-2.5 p-3 border text-left transition-colors',
                mt.disabled
                  ? 'border-border opacity-40 cursor-not-allowed'
                  : meetingType === mt.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/40'
              )}
            >
              <span className={cn(
                'mt-0.5 shrink-0',
                mt.disabled ? 'text-muted-foreground' : meetingType === mt.id ? 'text-primary' : 'text-muted-foreground'
              )}>
                {mt.icon}
              </span>
              <div>
                <p className={cn('text-xs font-semibold', mt.disabled ? 'text-muted-foreground' : 'text-foreground')}>{mt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{mt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* ── Event name ─────────────────────────────────────────── */}
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

      {/* ── Description ────────────────────────────────────────── */}
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

      {/* ── Booking URL ────────────────────────────────────────── */}
      <FormField
        control={form.control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Booking URL</FormLabel>
            <FormControl>
              <div className="flex items-stretch border border-input">
                {username && (
                  <span className="flex items-center bg-muted px-3 text-xs text-muted-foreground border-r border-input whitespace-nowrap">
                    /{username}/
                  </span>
                )}
                <Input
                  className="border-0 shadow-none focus-visible:ring-0 flex-1"
                  placeholder="e.g. 30-min-meeting"
                  maxLength={100}
                  {...field}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    field.onChange(val)
                  }}
                />
                {/* Status indicator */}
                <span className="flex items-center px-2.5 border-l border-input">
                  {slugStatus === 'checking' && <CircleNotch size={14} className="animate-spin text-muted-foreground" />}
                  {slugStatus === 'available' && <Check size={14} className="text-green-500" weight="bold" />}
                  {slugStatus === 'taken' && <Warning size={14} className="text-destructive" weight="fill" />}
                </span>
              </div>
            </FormControl>

            {/* URL preview + copy */}
            {displayUrl && (
              <div className="flex items-center justify-between gap-2 mt-1.5 px-3 py-2 bg-muted/50 border border-border">
                <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground truncate">
                  <LinkIcon size={13} />
                  {displayUrl}
                </span>
                <button
                  type="button"
                  onClick={copyLink}
                  className="shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Copy size={13} />
                  Copy
                </button>
              </div>
            )}
            {slugStatus === 'taken' && (
              <p className="text-xs text-destructive mt-1">This URL is already taken. Try a different slug.</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* ── Event Color ────────────────────────────────────────── */}
      <FormField
        control={form.control}
        name="color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Event Color</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => field.onChange(c)}
                    className="h-7 w-7 shrink-0 border-2 transition-opacity hover:opacity-80"
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

      {/* ── Active toggle ──────────────────────────────────────── */}
      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4">
            <div>
              <FormLabel className="text-sm font-medium">Active</FormLabel>
              <FormDescription className="text-xs">
                Visible on your booking page when active.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* ── Private Event (was "Hide from profile") ────────────── */}
      <FormField
        control={form.control}
        name="isHidden"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4">
            <div>
              <FormLabel className="text-sm font-medium">Private Event</FormLabel>
              <FormDescription className="text-xs">
                Only people with the direct link can book this meeting type.
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* ── Require Approval ───────────────────────────────────── */}
      <FormField
        control={form.control}
        name="requiresApproval"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between gap-4">
            <div>
              <FormLabel className="text-sm font-medium">Require Approval</FormLabel>
              <FormDescription className="text-xs">
                Bookings won&apos;t be confirmed until you approve them. You&apos;ll receive an email to review each request.
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
