'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  CircleNotch,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  XLogo,
  YoutubeLogo,
} from '@phosphor-icons/react'
import { Logo } from '@/components/logo'

const SOCIAL = [
  { icon: XLogo,         href: 'https://twitter.com',   label: 'X' },
  { icon: LinkedinLogo,  href: 'https://linkedin.com',  label: 'LinkedIn' },
  { icon: FacebookLogo,  href: 'https://facebook.com',  label: 'Facebook' },
  { icon: InstagramLogo, href: 'https://instagram.com', label: 'Instagram' },
  { icon: YoutubeLogo,   href: 'https://youtube.com',   label: 'YouTube' },
]

const FOOTER_COLS = [
  {
    title: 'Product',
    links: [
      ['Features',     '/#features'],
      ['How It Works', '/#how-it-works'],
      ['FAQ',          '/#faq'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About',   '/about'],
      ['Contact', '/contact'],
      ['Privacy', '/privacy'],
      ['Terms',   '/terms'],
      ['Cookies', '/cookies'],
    ],
  },
] as const

const BOTTOM_LINKS = [
  ['Privacy', '/privacy'],
  ['Terms',   '/terms'],
  ['Cookies', '/cookies'],
] as const

function NewsletterForm() {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'loading' || status === 'success') return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message ?? 'You\'re subscribed!')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-start gap-2.5 border border-primary/25 bg-primary/5 px-3 py-3">
        <CheckCircle size={16} weight="fill" className="mt-0.5 shrink-0 text-primary" />
        <p className="text-sm text-primary">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value)
          if (status === 'error') setStatus('idle')
        }}
        placeholder="you@company.com"
        required
        disabled={status === 'loading'}
        className="border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
      />
      {status === 'error' && (
        <p className="text-xs text-destructive">{message}</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? (
          <>
            <CircleNotch size={13} className="animate-spin" />
            Subscribing…
          </>
        ) : (
          <>
            Subscribe <ArrowRight size={13} weight="bold" />
          </>
        )}
      </button>
    </form>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <Logo variant="full" size="lg" href="/" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Schduled helps teams schedule meetings, manage availability and automate bookings — completely free, forever.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  <Icon size={18} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-xs font-black uppercase tracking-eyebrow text-foreground">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h4 className="mb-4 text-xs font-black uppercase tracking-eyebrow text-foreground">
              Stay Updated
            </h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Join 5,000+ users. Get tips and updates.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-border pt-8 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Schduled. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {BOTTOM_LINKS.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
