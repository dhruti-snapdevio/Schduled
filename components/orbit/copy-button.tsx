'use client'

import { Check, Copy } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {})
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-xs"
      aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      title={copied ? 'Copied!' : 'Copy'}
      onClick={copy}
      className={cn(
        'text-muted-foreground hover:border-primary/40 hover:text-primary',
        copied && 'border-success/40 text-success hover:border-success/40 hover:text-success',
        className
      )}
    >
      {copied ? <Check weight="bold" /> : <Copy />}
    </Button>
  )
}
