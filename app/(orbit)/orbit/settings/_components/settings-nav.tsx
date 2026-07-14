'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'health',       label: 'Platform Health' },
  { id: 'sign-in',      label: 'Sign-in Methods' },
  { id: 'general',      label: 'General' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'security',     label: 'Security' },
  { id: 'account',      label: 'Account' },
  { id: 'appearance',   label: 'Appearance' },
]

export function SettingsNav() {
  const [active, setActive] = useState('health')

  useEffect(() => {
    const scrollable = document.querySelector('main')
    if (!scrollable) return

    function onScroll() {
      const containerTop = scrollable!.getBoundingClientRect().top
      let current = SECTIONS[0].id
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id)
        if (!el) continue
        // section top relative to visible container top — activate when within top 40% of viewport
        const relTop = el.getBoundingClientRect().top - containerTop
        if (relTop <= scrollable!.clientHeight * 0.4) {
          current = id
        }
      }
      setActive(current)
    }

    scrollable.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => scrollable.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="flex items-center gap-1 border-b border-border [&::-webkit-scrollbar]:hidden overflow-x-auto pb-2">
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={cn(
            'whitespace-nowrap px-3.5 py-1.5 text-sm font-semibold transition-colors',
            active === id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}
