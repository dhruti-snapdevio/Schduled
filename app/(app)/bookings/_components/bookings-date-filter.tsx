'use client'

import { X } from '@phosphor-icons/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
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

  function push(from: string, to: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    params.delete('page')
    if (from) params.set('dateFrom', from)
    else params.delete('dateFrom')
    if (to) params.set('dateTo', to)
    else params.delete('dateTo')
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const hasFilter = dateFrom || dateTo

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="date"
        value={dateFrom}
        onChange={(e) => push(e.target.value, dateTo)}
        title="From date"
        className="h-9 w-[150px] shrink-0 px-2 text-sm"
      />
      <span className="text-xs text-muted-foreground shrink-0">to</span>
      <Input
        type="date"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(e) => push(dateFrom, e.target.value)}
        title="To date"
        className="h-9 w-[150px] shrink-0 px-2 text-sm"
      />
      {hasFilter && (
        <button
          type="button"
          title="Clear date filter"
          onClick={() => push('', '')}
          className="flex h-9 w-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
