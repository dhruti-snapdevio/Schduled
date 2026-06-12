'use client'

import { useState } from 'react'
import {
  VideoCamera,
  GoogleLogo,
  Phone,
  MapPin,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createFirstEventType } from '@/app/actions/onboarding'

interface StepEventTypeProps {
  onNext: () => void
  onBack: () => void
}

type Duration = 15 | 30 | 45 | 60
type LocationType = 'zoom' | 'google_meet' | 'phone_host_calls' | 'in_person'

const DURATIONS: { value: Duration; label: string }[] = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
]

const LOCATIONS: {
  value: LocationType
  label: string
  sub: string
  icon: React.ReactNode
}[] = [
  {
    value: 'zoom',
    label: 'Zoom',
    sub: 'Auto-generate a Zoom link',
    icon: <VideoCamera size={20} weight="fill" className="text-[#2D8CFF]" />,
  },
  {
    value: 'google_meet',
    label: 'Google Meet',
    sub: 'Auto-generate a Google Meet link',
    icon: <GoogleLogo size={20} weight="bold" className="text-[#4285F4]" />,
  },
  {
    value: 'phone_host_calls',
    label: 'Phone call',
    sub: 'You call the invitee',
    icon: <Phone size={20} weight="fill" className="text-primary" />,
  },
  {
    value: 'in_person',
    label: 'In-person',
    sub: 'Specify a location address',
    icon: <MapPin size={20} weight="fill" className="text-primary" />,
  },
]

export function StepEventType({ onNext, onBack }: StepEventTypeProps) {
  const [name, setName] = useState('30 Minute Meeting')
  const [duration, setDuration] = useState<Duration>(30)
  const [location, setLocation] = useState<LocationType>('google_meet')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter an event name'); return }
    setSaving(true)
    setError('')
    const result = await createFirstEventType({ name: name.trim(), duration, locationType: location })
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Create your first event type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          An event type is what people book with you. You can add more later.
        </p>
      </div>

      {/* Event name */}
      <div className="space-y-1.5">
        <Label htmlFor="ob-event-name">Event name</Label>
        <Input
          id="ob-event-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. 30 Minute Meeting"
          maxLength={100}
          required
        />
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label>Duration</Label>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={cn(
                'border py-2.5 text-sm font-medium transition',
                duration === d.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary hover:bg-muted/50',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="grid grid-cols-2 gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.value}
              type="button"
              onClick={() => setLocation(loc.value)}
              className={cn(
                'flex items-start gap-3 border p-3 text-left transition',
                location === loc.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-primary hover:bg-muted/40',
              )}
            >
              <span className="mt-0.5 shrink-0">{loc.icon}</span>
              <span>
                <span className="block text-sm font-semibold">{loc.label}</span>
                <span className="block text-xs text-muted-foreground">{loc.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Creating…' : 'Continue'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </form>
  )
}
