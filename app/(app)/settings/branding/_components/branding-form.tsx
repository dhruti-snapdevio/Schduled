'use client'

import { useState } from 'react'
import { updateBranding } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BrandingFormProps {
  displayName: string
}

export function BrandingForm({ displayName }: BrandingFormProps) {
  const [name, setName]       = useState(displayName)
  const [saving, setSaving]   = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const result = await updateBranding({ displayName: name })
    setSaving(false)
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'ok', text: 'Branding updated.' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display name */}
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            This name appears at the top of your booking page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={64}
              placeholder="Your name"
            />
          </div>

          {message && (
            <p className={message.type === 'ok'
              ? 'text-sm text-primary'
              : 'text-sm text-destructive'}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
