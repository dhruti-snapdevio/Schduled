'use client'

import { useEffect, useState } from 'react'
import { Globe } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { saveTimezoneStep } from '@/app/actions/onboarding'

interface StepTimezoneProps {
  onNext: () => void
  onBack: () => void
}

// Curated list of common timezones grouped by region with friendly display names
const TIMEZONES: { label: string; value: string }[] = [
  // Americas
  { label: 'Pacific Time — US & Canada (PT)', value: 'America/Los_Angeles' },
  { label: 'Mountain Time — US & Canada (MT)', value: 'America/Denver' },
  { label: 'Central Time — US & Canada (CT)', value: 'America/Chicago' },
  { label: 'Eastern Time — US & Canada (ET)', value: 'America/New_York' },
  { label: 'Atlantic Time — Canada (AT)', value: 'America/Halifax' },
  { label: 'Newfoundland Time — Canada (NT)', value: 'America/St_Johns' },
  { label: 'São Paulo — Brazil (BRT)', value: 'America/Sao_Paulo' },
  { label: 'Buenos Aires — Argentina (ART)', value: 'America/Argentina/Buenos_Aires' },
  { label: 'Bogotá — Colombia (COT)', value: 'America/Bogota' },
  { label: 'Mexico City (CST)', value: 'America/Mexico_City' },
  { label: 'Vancouver — Canada (PT)', value: 'America/Vancouver' },
  { label: 'Toronto — Canada (ET)', value: 'America/Toronto' },
  // Europe
  { label: 'UTC / Greenwich Mean Time (GMT)', value: 'UTC' },
  { label: 'London — UK (GMT/BST)', value: 'Europe/London' },
  { label: 'Dublin — Ireland (GMT/IST)', value: 'Europe/Dublin' },
  { label: 'Lisbon — Portugal (WET)', value: 'Europe/Lisbon' },
  { label: 'Paris / Berlin / Rome (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Amsterdam / Brussels (CET/CEST)', value: 'Europe/Amsterdam' },
  { label: 'Madrid — Spain (CET/CEST)', value: 'Europe/Madrid' },
  { label: 'Stockholm — Sweden (CET/CEST)', value: 'Europe/Stockholm' },
  { label: 'Warsaw — Poland (CET/CEST)', value: 'Europe/Warsaw' },
  { label: 'Helsinki — Finland (EET/EEST)', value: 'Europe/Helsinki' },
  { label: 'Athens — Greece (EET/EEST)', value: 'Europe/Athens' },
  { label: 'Kyiv — Ukraine (EET/EEST)', value: 'Europe/Kyiv' },
  { label: 'Istanbul — Turkey (TRT)', value: 'Europe/Istanbul' },
  { label: 'Moscow — Russia (MSK)', value: 'Europe/Moscow' },
  // Africa
  { label: 'Cairo — Egypt (EET)', value: 'Africa/Cairo' },
  { label: 'Lagos — Nigeria (WAT)', value: 'Africa/Lagos' },
  { label: 'Johannesburg — South Africa (SAST)', value: 'Africa/Johannesburg' },
  { label: 'Nairobi — Kenya (EAT)', value: 'Africa/Nairobi' },
  { label: 'Casablanca — Morocco (WET)', value: 'Africa/Casablanca' },
  // Middle East
  { label: 'Dubai — UAE (GST)', value: 'Asia/Dubai' },
  { label: 'Riyadh — Saudi Arabia (AST)', value: 'Asia/Riyadh' },
  { label: 'Doha — Qatar (AST)', value: 'Asia/Qatar' },
  { label: 'Kuwait City (AST)', value: 'Asia/Kuwait' },
  { label: 'Baghdad — Iraq (AST)', value: 'Asia/Baghdad' },
  { label: 'Tehran — Iran (IRST)', value: 'Asia/Tehran' },
  // Asia
  { label: 'Karachi — Pakistan (PKT)', value: 'Asia/Karachi' },
  { label: 'Kolkata — India (IST)', value: 'Asia/Kolkata' },
  { label: 'Dhaka — Bangladesh (BST)', value: 'Asia/Dhaka' },
  { label: 'Colombo — Sri Lanka (IST)', value: 'Asia/Colombo' },
  { label: 'Kathmandu — Nepal (NPT)', value: 'Asia/Kathmandu' },
  { label: 'Almaty — Kazakhstan (ALMT)', value: 'Asia/Almaty' },
  { label: 'Bangkok — Thailand (ICT)', value: 'Asia/Bangkok' },
  { label: 'Ho Chi Minh City — Vietnam (ICT)', value: 'Asia/Ho_Chi_Minh' },
  { label: 'Jakarta — Indonesia (WIB)', value: 'Asia/Jakarta' },
  { label: 'Singapore / Kuala Lumpur (SGT)', value: 'Asia/Singapore' },
  { label: 'Manila — Philippines (PST)', value: 'Asia/Manila' },
  { label: 'Shanghai / Beijing — China (CST)', value: 'Asia/Shanghai' },
  { label: 'Hong Kong (HKT)', value: 'Asia/Hong_Kong' },
  { label: 'Taipei — Taiwan (CST)', value: 'Asia/Taipei' },
  { label: 'Seoul — South Korea (KST)', value: 'Asia/Seoul' },
  { label: 'Tokyo — Japan (JST)', value: 'Asia/Tokyo' },
  // Oceania
  { label: 'Perth — Western Australia (AWST)', value: 'Australia/Perth' },
  { label: 'Darwin — Northern Territory (ACST)', value: 'Australia/Darwin' },
  { label: 'Adelaide — South Australia (ACST)', value: 'Australia/Adelaide' },
  { label: 'Brisbane — Queensland (AEST)', value: 'Australia/Brisbane' },
  { label: 'Sydney / Melbourne (AEST/AEDT)', value: 'Australia/Sydney' },
  { label: 'Auckland — New Zealand (NZST)', value: 'Pacific/Auckland' },
]

function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

export function StepTimezone({ onNext, onBack }: StepTimezoneProps) {
  const [timezone, setTimezone] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Auto-detect on mount
  useEffect(() => {
    const detected = detectBrowserTimezone()
    const match = TIMEZONES.find((tz) => tz.value === detected)
    setTimezone(match ? detected : 'UTC')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!timezone) { setError('Please select your timezone'); return }
    setSaving(true)
    setError('')
    const result = await saveTimezoneStep(timezone)
    setSaving(false)
    if ('error' in result) { setError(result.error); return }
    onNext()
  }

  // Show current local time in selected timezone
  const localTime = timezone
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        weekday: 'short',
      }).format(new Date())
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">What&apos;s your timezone?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We use this to show available slots in the right time for you and your invitees.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ob-timezone">Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger id="ob-timezone" className="w-full">
            <Globe size={16} className="shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Select your timezone…" />
          </SelectTrigger>
          <SelectContent
            className="max-h-60 overflow-y-auto"
            position="popper"
            sideOffset={4}
          >
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Live current-time preview */}
      {localTime && (
        <div className="flex items-center gap-2 border border-border bg-muted/40 px-4 py-3">
          <Globe size={16} className="shrink-0 text-primary" />
          <span className="text-sm">
            Your current local time: <strong>{localTime}</strong>
          </span>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full" disabled={saving || !timezone}>
          {saving ? 'Saving…' : 'Continue'}
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
