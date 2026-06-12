import * as React from 'react'
import { cn } from '@/lib/utils'

const sizeClass = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-8 border-[3px]',
} as const

interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof sizeClass
}

function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-current border-t-transparent',
        sizeClass[size],
        className,
      )}
      {...props}
    />
  )
}

export { Spinner }
export type { SpinnerProps }
