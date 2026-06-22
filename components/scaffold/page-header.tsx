import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  description?: string
  eyebrow?:     string
  title:        string
  action?:      ReactNode
}) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4 border-b border-border pb-6">
      <div>
        {eyebrow && (
          <p className="mb-1.5 font-bold text-xs text-primary uppercase tracking-eyebrow">
            {eyebrow}
          </p>
        )}
        <h1 className="font-black text-3xl text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-muted-foreground text-base leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  )
}
