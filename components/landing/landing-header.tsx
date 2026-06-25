import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { Logo } from '@/components/logo'

const NAV_LINKS = [
  ['Features',     '/#features'],
  ['How It Works', '/#how-it-works'],
  ['FAQ',          '/#faq'],
  ['About',        '/about'],
  ['Contact',      '/contact'],
] as const

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
        <Logo variant="full" size="lg" href="/" />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get Started Free <ArrowRight size={13} weight="bold" />
          </Link>
        </div>
      </div>
    </header>
  )
}
