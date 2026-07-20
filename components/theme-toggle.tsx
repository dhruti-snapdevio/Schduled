'use client'

import { Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      aria-label="Toggle theme"
      size="icon"
      variant="ghost"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun size={16} className="block dark:hidden" />
      <Moon size={16} className="hidden dark:block" />
    </Button>
  )
}
