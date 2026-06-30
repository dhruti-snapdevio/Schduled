'use client'

import { useEffect, useState } from 'react'
import {
  ArrowSquareOut,
  CalendarPlus,
  Check,
  Copy,
  DownloadSimple,
  GoogleLogo,
  Timer,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

// ── Live "meeting starts in" countdown ────────────────────────────────────────
export function Countdown({ startUtc }: { startUtc: string }) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    const target = new Date(startUtc).getTime()
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setLabel(null)
        return
      }
      const totalMin = Math.floor(diff / 60_000)
      const days = Math.floor(totalMin / 1440)
      const hours = Math.floor((totalMin % 1440) / 60)
      const mins = totalMin % 60
      setLabel(
        days > 0
          ? `${days}d ${hours}h ${mins}m`
          : `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`
      )
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [startUtc])

  if (!label) return null

  return (
    <div className="flex items-center gap-3 border border-primary/30 bg-primary/[0.06] px-5 py-4">
      <span className="flex size-9 shrink-0 items-center justify-center bg-primary text-primary-foreground">
        <Timer size={18} weight="fill" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-ui text-primary">Meeting starts in</p>
        <p className="font-black text-xl tabular-nums text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

// ── Meeting link with copy + open ─────────────────────────────────────────────
export function MeetingLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('Meeting link copied')
      setTimeout(() => setCopied(false), 1800)
    })
  }

  return (
    <div className="flex items-stretch border border-border">
      <span className="flex min-w-0 flex-1 items-center truncate px-3 py-2.5 font-mono text-xs text-muted-foreground">
        {url}
      </span>
      <button
        type="button"
        onClick={copy}
        title="Copy link"
        aria-label="Copy meeting link"
        className="flex w-10 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        {copied ? <Check size={15} weight="bold" className="text-emerald-600" /> : <Copy size={15} />}
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Open link"
        aria-label="Open meeting link"
        className="flex w-10 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <ArrowSquareOut size={15} />
      </a>
    </div>
  )
}

// ── Add to calendar (Google + .ics download) ──────────────────────────────────
export function AddToCalendar({
  googleUrl,
  icsHref,
  filename,
}: {
  googleUrl: string
  icsHref: string
  filename: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-9 items-center justify-center gap-2 border border-border text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
      >
        <GoogleLogo size={15} weight="bold" /> Google Calendar
      </a>
      <a
        href={icsHref}
        download={filename}
        className="flex h-9 items-center justify-center gap-2 border border-border text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary"
      >
        <DownloadSimple size={15} /> Apple / Outlook (.ics)
      </a>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarPlus size={13} /> Save this meeting to your calendar
      </p>
    </div>
  )
}
