'use client'

import { useRef, useState } from 'react'
import { UserCircle } from '@phosphor-icons/react'
import { updateBranding } from '@/app/actions/settings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BrandingFormProps {
  displayName: string
  avatarUrl: string | null
  initials: string
}

export function BrandingForm({ displayName, avatarUrl, initials }: BrandingFormProps) {
  const [name, setName]         = useState(displayName)
  const [preview, setPreview]   = useState<string | null>(avatarUrl)
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState<{ type: 'ok' | 'error'; text: string } | null>(null)
  const fileRef                 = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

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
      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Shown on your public booking page and in email invites.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          {/* Avatar preview */}
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden bg-primary/10 text-primary">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Avatar" className="size-full object-cover" />
            ) : (
              <span className="text-xl font-bold">{initials}</span>
            )}
          </div>

          <div className="space-y-2">
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <UserCircle size={16} />
              Change photo
            </Button>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WebP · max 2 MB
            </p>
          </div>
        </CardContent>
      </Card>

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
              ? 'text-sm text-[var(--success-foreground)]'
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
