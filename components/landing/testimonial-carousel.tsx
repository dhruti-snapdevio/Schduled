'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CaretLeft, CaretRight, CheckCircle, Quotes, Star } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface Testimonial {
  quote: string
  highlight: string
  name: string
  role: string
  company: string
  initials: string
  avatarGrad: string
  chips: string[]
}

const AUTOPLAY_MS = 6000

export function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)

  function go(delta: number) {
    setDirection(delta)
    setIndex((i) => (i + delta + items.length) % items.length)
  }

  function goTo(i: number) {
    setDirection(i > index ? 1 : -1)
    setIndex(i)
  }

  // Auto-advance, paused on hover/focus — restarts its timer on every index change
  // so the progress dots below stay in sync with the actual time remaining.
  // biome-ignore lint/correctness/useExhaustiveDependencies: go() only uses the functional setState form, safe to omit
  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => go(1), AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [index, paused])

  // Left/right arrow key navigation, ignored while typing in a form field.
  // biome-ignore lint/correctness/useExhaustiveDependencies: go() only uses the functional setState form, safe to omit
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1)
    touchStartX.current = null
  }

  const prevIdx = (index - 1 + items.length) % items.length
  const nextIdx = (index + 1) % items.length

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: hover/touch here are progressive-enhancement only (pause + swipe) — every action is already reachable via the real <button> controls and window-level arrow keys below
    <section
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
      className="mx-auto max-w-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative h-[340px] sm:h-[300px]">
        <TestimonialCard
          t={items[prevIdx]}
          className="z-0 hidden -translate-x-1/2 -rotate-3 scale-[0.92] opacity-35 blur-[1px] sm:block"
        />
        <TestimonialCard
          t={items[nextIdx]}
          className="z-0 hidden translate-x-1/2 rotate-3 scale-[0.92] opacity-35 blur-[1px] sm:block"
        />

        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: -direction * 40, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-10"
          >
            <TestimonialCard t={items[index]} active />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <CaretLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          {items.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={cn(
                'relative h-1.5 w-6 overflow-hidden bg-muted-foreground/20 transition-colors',
                i !== index && 'hover:bg-muted-foreground/40',
              )}
            >
              {i === index && (
                <motion.div
                  key={paused ? 'paused' : index}
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: paused ? '0%' : '100%' }}
                  transition={{ duration: paused ? 0 : AUTOPLAY_MS / 1000, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <CaretRight size={18} />
        </button>
      </div>
    </section>
  )
}

function HighlightedQuote({ quote, highlight }: { quote: string; highlight: string }) {
  const idx = quote.indexOf(highlight)
  if (idx === -1) return <>&ldquo;{quote}&rdquo;</>
  return (
    <>
      &ldquo;{quote.slice(0, idx)}
      <span className="font-semibold text-primary">{highlight}</span>
      {quote.slice(idx + highlight.length)}&rdquo;
    </>
  )
}

function TestimonialCard({
  t,
  active = false,
  className,
}: {
  t: Testimonial
  active?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex transform-gpu flex-col justify-between overflow-hidden border p-8 transition-[transform,border-color] duration-300',
        active ? 'border-primary/30 bg-card hover:-translate-y-1 hover:border-primary/50' : 'pointer-events-none border-border/70 bg-muted/70',
        className,
      )}
    >
      <Quotes size={64} weight="fill" className="pointer-events-none absolute -left-2 -top-2 text-primary/[0.07]" />

      <div className="relative">
        <div className="mb-3 flex gap-1">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star key={s} size={16} weight="fill" className="text-primary" />
          ))}
        </div>
        <p className="line-clamp-4 text-base leading-relaxed text-foreground">
          <HighlightedQuote quote={t.quote} highlight={t.highlight} />
        </p>

        {active && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {t.chips.map((chip) => (
              <span key={chip} className="border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary">
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center bg-gradient-to-br text-sm font-black text-white', t.avatarGrad)}>
            {t.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{t.name}</p>
            <p className="truncate text-xs text-muted-foreground">{t.role} · {t.company}</p>
          </div>
        </div>
        {active && (
          <div className="flex shrink-0 items-center gap-1 border border-primary/20 bg-primary/5 px-2 py-0.5">
            <CheckCircle size={10} weight="fill" className="text-primary" />
            <span className="text-xs font-bold text-primary">Verified Review</span>
          </div>
        )}
      </div>
    </div>
  )
}
