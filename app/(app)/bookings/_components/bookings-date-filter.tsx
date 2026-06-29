'use client'

import { X } from '@phosphor-icons/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'

interface BookingsDateFilterProps {
  tab: string
  dateFrom: string
  dateTo: string
}

export function BookingsDateFilter({ tab, dateFrom, dateTo }: BookingsDateFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Local draft state: typing/picking a date updates this only. We apply the
  // filter (navigate) when the field is committed — on blur or Enter — so a
  // half-typed date never triggers a reload. Stays in sync with the URL props.
  const [from, setFrom] = useState(dateFrom)
  const [to, setTo] = useState(dateTo)
  useEffect(() => { setFrom(dateFrom) }, [dateFrom])
  useEffect(() => { setTo(dateTo) }, [dateTo])

  function push(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('page')
    if (nextFrom) params.set('dateFrom', nextFrom)
    else params.delete('dateFrom')
    if (nextTo) params.set('dateTo', nextTo)
    else params.delete('dateTo')
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  // Apply only when the committed values actually differ from the URL — avoids
  // a redundant navigation when blurring a field that wasn't changed.
  function commit() {
    if (from === dateFrom && to === dateTo) return
    push(from, to)
  }

  function clear() {
    setFrom('')
    setTo('')
    push('', '')
  }

  const hasFilter = from || to

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        title="From date"
        className="h-9 w-[150px] shrink-0 px-2 text-sm"
      />
      <span className="text-xs text-muted-foreground shrink-0">to</span>
      <Input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => setTo(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        title="To date"
        className="h-9 w-[150px] shrink-0 px-2 text-sm"
      />
      {hasFilter && (
        <button
          type="button"
          title="Clear date filter"
          onClick={clear}
          className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
