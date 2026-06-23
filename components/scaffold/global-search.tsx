'use client'

import { MagnifyingGlass, Spinner } from '@phosphor-icons/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

export function GlobalSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Seed from the URL once on mount; afterwards the input is purely local so
  // navigation re-renders never reset the value (which would select the text).
  const [value, setValue] = useState(() =>
    pathname === '/bookings' ? (searchParams.get('q') ?? '') : ''
  )
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function navigate(next: string) {
    const params = new URLSearchParams()
    params.set('tab', 'upcoming')
    const trimmed = next.trim()
    if (trimmed) params.set('q', trimmed)
    const url = `/bookings?${params.toString()}`
    startTransition(() => {
      // Already on bookings → replace (no history spam); otherwise push.
      if (pathname === '/bookings') router.replace(url, { scroll: false })
      else router.push(url)
    })
  }

  function onChange(next: string) {
    setValue(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => navigate(next), 350)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (timer.current) clearTimeout(timer.current)
    navigate(value)
  }

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  return (
    <form onSubmit={onSubmit} className="relative hidden sm:block">
      {isPending ? (
        <Spinner
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-primary"
        />
      ) : (
        <MagnifyingGlass
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      )}
      <input
        name="q"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-48 md:w-72 lg:w-[340px] rounded-none border border-border bg-page pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        placeholder="Search bookings, meetings..."
        type="search"
      />
    </form>
  )
}
