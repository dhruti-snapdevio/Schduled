import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'full' | 'icon' | 'wordmark'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

function LogoMark({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="3"
        className="fill-background" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="1" width="30" height="8" rx="3" fill="currentColor" />
      <rect x="1" y="5" width="30" height="4" fill="currentColor" />
      <line x1="11" y1="9" x2="11" y2="31" className="stroke-border" strokeWidth="1" />
      <line x1="21" y1="9" x2="21" y2="31" className="stroke-border" strokeWidth="1" />
      <line x1="1"  y1="20" x2="31" y2="20" className="stroke-border" strokeWidth="1" />
      <rect x="13" y="11" width="6" height="7" rx="1" fill="currentColor" />
    </svg>
  )
}

export function Logo({
  variant = 'full',
  size = 'md',
  href = '/',
  className,
}: LogoProps) {
  const sizes = {
    xs: { icon: 13, text: 'text-xs' },
    sm: { icon: 16, text: 'text-sm' },
    md: { icon: 20, text: 'text-base' },
    lg: { icon: 28, text: 'text-xl' },
  }
  const { icon, text } = sizes[size]

  const inner = (
    <span className={cn('flex items-center gap-2 text-primary', className)}>
      {variant !== 'wordmark' && <LogoMark px={icon} />}
      {variant !== 'icon' && (
        <span
          className={cn(text, 'font-semibold tracking-tight text-foreground')}
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <span className="text-primary">S</span>chduled
        </span>
      )}
    </span>
  )

  if (!href) return inner
  return <Link href={href}>{inner}</Link>
}
