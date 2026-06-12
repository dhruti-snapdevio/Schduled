'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle, Copy, ArrowRight } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { completeOnboarding } from '@/app/actions/onboarding'

interface StepShareLinkProps {
  username: string
  appUrl: string
  onComplete: () => void
  onBack: () => void
}

export function StepShareLink({ username, appUrl, onComplete, onBack }: StepShareLinkProps) {
  const bookingUrl = `${appUrl}/${username}`
  const [copied, setCopied] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')
  const qrRef = useRef<HTMLImageElement>(null)

  // Generate QR code client-side
  useEffect(() => {
    if (!username) return
    let cancelled = false

    async function buildQr() {
      try {
        const QRCode = (await import('qrcode')).default
        const dataUrl = await QRCode.toDataURL(bookingUrl, {
          width: 160,
          margin: 1,
          color: { dark: '#0d9488', light: '#ffffff' },
        })
        if (!cancelled && qrRef.current) {
          qrRef.current.src = dataUrl
          qrRef.current.style.display = 'block'
        }
      } catch {
        // QR generation failed — non-fatal
      }
    }

    buildQr()
    return () => { cancelled = true }
  }, [bookingUrl, username])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard not available */
    }
  }

  async function handleFinish() {
    setFinishing(true)
    setError('')
    const result = await completeOnboarding()
    setFinishing(false)
    if ('error' in result) { setError(result.error); return }
    onComplete()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">You&apos;re all set! 🎉</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Share your booking link and people can start scheduling time with you instantly.
        </p>
      </div>

      {/* Booking link display */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Your booking link
        </p>
        <div className="flex items-center gap-2 border border-border bg-muted/40 px-4 py-3">
          <span className="min-w-0 truncate font-mono text-sm text-foreground">
            {bookingUrl}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="ml-auto shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition"
            aria-label="Copy booking link"
          >
            {copied ? (
              <>
                <CheckCircle size={15} weight="fill" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={15} />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Code */}
      {username && (
        <div className="flex flex-col items-center gap-3 border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            QR Code
          </p>
          {/* Hidden until generated */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={qrRef}
            alt="Booking link QR code"
            style={{ display: 'none' }}
            width={160}
            height={160}
            className="border border-border"
          />
          <p className="text-xs text-muted-foreground text-center">
            Let clients scan to book directly from their phone
          </p>
        </div>
      )}

      {/* What's ready */}
      <ul className="space-y-2 text-sm text-muted-foreground">
        {[
          'Your profile is set up',
          'Your first event type is ready',
          'Invitees can start booking right now',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <CheckCircle size={15} weight="fill" className="shrink-0 text-primary" />
            {item}
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-2">
        <Button className="w-full" onClick={handleFinish} disabled={finishing}>
          {finishing ? 'Setting up your dashboard…' : (
            <span className="flex items-center gap-2">
              Go to Dashboard <ArrowRight size={16} />
            </span>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onBack}
        >
          Back
        </Button>
      </div>
    </div>
  )
}
