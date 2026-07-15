'use client'

import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'health',       label: 'Platform Health', keywords: 'status uptime services' },
  { id: 'workspace',    label: 'Workspace',       keywords: 'name logo branding' },
  { id: 'sign-in',      label: 'Sign-in Methods', keywords: 'login magic link google password' },
  { id: 'general',      label: 'General',         keywords: 'app url environment signup' },
  { id: 'integrations', label: 'Integrations',    keywords: 'smtp email google zoom queue pg-boss' },
  { id: 'security',     label: 'Security',        keywords: 'app secret encryption key' },
  { id: 'data-deletion', label: 'Data Deletion',  keywords: 'gdpr privacy invitee redact' },
  { id: 'account',      label: 'Account',         keywords: 'password change' },
  { id: 'appearance',   label: 'Appearance',      keywords: 'theme light dark system' },
]

export function SettingsNav() {
  const [active, setActive] = useState('health')
  const [query, setQuery] = useState('')

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SECTIONS
    return SECTIONS.filter(
      s => s.label.toLowerCase().includes(q) || s.keywords.includes(q)
    )
  }, [query])

  return (
    <div className="sticky top-0 z-20 -mx-4 bg-page px-4 pt-2 md:-mx-8 md:px-8">
      <div className="relative mb-2 max-w-xs">
        <MagnifyingGlass
          size={15}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search settings…"
          className="h-8 pl-8 text-sm"
        />
      </div>
      <nav className="flex items-center gap-1 border-b border-border [&::-webkit-scrollbar]:hidden overflow-x-auto pb-2">
        {filtered.length === 0 ? (
          <span className="py-1.5 text-sm text-muted-foreground">No matching settings.</span>
        ) : (
          filtered.map(({ id, label }) => (
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
          ))
        )}
      </nav>
    </div>
  )
}
