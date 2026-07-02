'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'

const NAV_LINKS = [
  ['Features',     '/#features'],
  ['How It Works', '/#how-it-works'],
  ['FAQ',          '/#faq'],
  ['About',        '/about'],
  ['Contact',      '/contact'],
] as const

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-[72px] border-b transition-all duration-[250ms] ease-out',
        scrolled
          ? 'border-[#E5E7EB] bg-white/[0.96] backdrop-blur-[20px]'
          : 'border-transparent bg-white/[0.86] backdrop-blur-[14px]'
      )}
    >
      {/* Subtle underline that fades in on scroll — no box-shadow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] transition-opacity duration-[250ms]"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.06) 80%, transparent 100%)',
          opacity: scrolled ? 1 : 0,
        }}
      />

      <div className="mx-auto grid h-full max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center px-5 md:px-12 xl:px-20">

        {/* Left: logo */}
        <Logo variant="full" size="lg" href="/" />

        {/* Center: nav — truly centered via grid */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-foreground/60 transition-colors duration-200 hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right: sign in + CTA */}
        <div className="flex items-center justify-end gap-2">
          <Link
            href="/login"
            className="hidden px-4 py-2 text-sm font-medium text-foreground/55 transition-colors duration-200 hover:text-foreground sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started Free <ArrowRight size={13} weight="bold" />
          </Link>
        </div>

      </div>
    </header>
  )
}
