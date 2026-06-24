import * as React from 'react'
import { cn } from '@/lib/utils'

function Kbd({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center border border-border bg-muted px-1.5 py-0.5 font-mono text-2xs font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

export { Kbd }
