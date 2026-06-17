'use client'

import { useEffect, useRef, useState } from 'react'
import { UserCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveProfileStep } from '@/app/actions/onboarding'

// Avatar upload uses STORAGE_DRIVER from .env:
//   local (default) → saved to public/uploads/avatars/{userId}.webp, served at /uploads/...
//   s3              → uploaded to Cloudflare R2 / AWS S3 (activate in lib/storage/index.ts)

interface StepProfileProps {
  defaultName: string
  defaultUsername: string
  defaultImage?: string | null
  onNext: (username: string) => void
}

type UsernameState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function StepProfile({ defaultName, defaultUsername, defaultImage, onNext }: StepProfileProps) {
  const [name, setName] = useState(defaultName)
  const [username, setUsername] = useState(defaultUsername)
  const [usernameState, setUsernameState] = useState<UsernameState>('idle')
  const [usernameMsg, setUsernameMsg] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(defaultImage ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Live username check with 400 ms debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const u = username.trim().toLowerCase()
    if (!u || u.length < 3) {
      setUsernameState('idle')
      setUsernameMsg('')
      return
    }

    setUsernameState('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/username-check?username=${encodeURIComponent(u)}`)
        const data: { available: boolean; reason?: string } = await res.json()
        if (data.available) {
          setUsernameState('available')
          setUsernameMsg('')
        } else {
          setUsernameState('taken')
          setUsernameMsg(data.reason ?? 'Not available')
        }
      } catch {
        setUsernameState('idle')
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [username])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, or WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB')
      return
    }
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Please enter your name'); return }
    if (usernameState === 'taken' || usernameState === 'invalid') { setError(usernameMsg); return }
    if (usernameState === 'checking') { setError('Wait for username check to finish'); return }

    setSaving(true)

    // Upload avatar if a file was selected (works with any STORAGE_DRIVER)
    if (avatarFile) {
      const form = new FormData()
      form.append('file', avatarFile)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: form })
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}))
        setSaving(false)
        setError(data.error ?? 'Avatar upload failed. Please try again.')
        return
      }
    }

    const result = await saveProfileStep({
      name: name.trim(),
      username: username.trim().toLowerCase(),
    })

    setSaving(false)

    if ('error' in result) {
      setError(result.error)
      return
    }

    onNext(result.username)
  }

  // Initials avatar (shown when no photo uploaded)
  const initials = name
    .trim()
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const borderColor =
    usernameState === 'available'
      ? 'border-green-500 focus-visible:ring-green-500'
      : usernameState === 'taken' || usernameState === 'invalid'
        ? 'border-destructive focus-visible:ring-destructive'
        : ''

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative size-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Upload profile photo"
        >
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Avatar preview" className="size-full object-cover" />
          ) : initials ? (
            <span className="flex size-full items-center justify-center text-2xl font-semibold text-primary">
              {initials}
            </span>
          ) : (
            <UserCircle size={40} className="m-auto text-muted-foreground" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <span className="text-xs font-medium text-white">Change</span>
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        <p className="text-xs text-muted-foreground">JPG, PNG or WebP · max 5 MB</p>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="ob-name">Full name</Label>
        <Input
          id="ob-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          autoComplete="name"
          required
          maxLength={64}
        />
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="ob-username">Username</Label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground select-none">
            schduled.com/
          </span>
          <Input
            id="ob-username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="jane-smith"
            className={`pl-[7.5rem] ${borderColor}`}
            autoComplete="off"
            spellCheck={false}
            maxLength={30}
            required
          />
          {/* Status indicator */}
          {usernameState === 'checking' && (
            <span className="absolute inset-y-0 right-3 flex items-center">
              <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </span>
          )}
          {usernameState === 'available' && (
            <span className="absolute inset-y-0 right-3 flex items-center text-xs font-medium text-green-600">
              ✓ Available
            </span>
          )}
        </div>
        {(usernameState === 'taken' || usernameState === 'invalid') && (
          <p className="text-xs text-destructive">{usernameMsg}</p>
        )}
        <p className="text-xs text-muted-foreground">
          3–30 characters · letters, numbers, and hyphens only
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={saving || usernameState === 'checking' || usernameState === 'taken'}
      >
        {saving ? 'Saving…' : 'Continue'}
      </Button>
    </form>
  )
}
