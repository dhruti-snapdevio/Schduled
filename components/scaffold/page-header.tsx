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
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 font-bold text-xs text-primary uppercase tracking-eyebrow">
            {eyebrow}
          </p>
        )}
        <h1 className="font-black text-3xl text-foreground tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
