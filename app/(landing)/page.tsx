import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ArrowRight,
  Bell,
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  Clock,
  Globe,
  Lightning,
  LinkSimple,
  ShieldCheck,
  Star,
  VideoCamera,
} from '@phosphor-icons/react/dist/ssr'
import { Logo } from '@/components/logo'
import { getCurrentSession } from '@/lib/authz'

export const metadata = {
  title: 'Schduled — Smart scheduling for modern teams',
  description: 'Share a link. Let people book time with you automatically. No back-and-forth emails.',
}

// ── Static data ───────────────────────────────────────────────────────────────

const LOGOS = ['Google', 'Notion', 'Stripe', 'Figma', 'Vercel', 'Slack', 'Linear', 'Loom', 'HubSpot', 'Zoom']

const STEPS = [
  {
    num: '01',
    emoji: '⚙️',
    icon: Clock,
    title: 'Set your availability',
    description: 'Choose working hours, buffer times, and connect your calendar. Takes 2 minutes total.',
    detail: 'Mon–Fri, 9AM–5PM → Auto-blocked when busy',
  },
  {
    num: '02',
    emoji: '🔗',
    icon: LinkSimple,
    title: 'Share your booking link',
    description: 'You get schduled.com/yourname. Paste it in your email signature, LinkedIn bio, or anywhere.',
    detail: 'schduled.com/janedoe/30-min',
  },
  {
    num: '03',
    emoji: '📅',
    icon: CalendarBlank,
    title: 'Meetings land in your calendar',
    description: 'Invitees pick a slot, fill in their info, and the event appears in both calendars with a video link.',
    detail: 'Confirmation emails sent instantly',
  },
]

const STATS = [
  { icon: Lightning,   value: '< 2 min', title: 'Fast Setup',          sub: 'Get started in seconds. No config, no friction.' },
  { icon: ShieldCheck, value: '0',       title: 'Zero Conflicts',       sub: 'Calendar sync prevents every double-booking.' },
  { icon: LinkSimple,  value: '1 link',  title: 'One Shareable Link',   sub: 'Book meetings from anywhere you share it.' },
]

const TESTIMONIALS = [
  {
    quote: "I replaced Calendly the same day I found Schduled. Cleaner UI, faster setup, and it's genuinely free — no catch.",
    name: 'Sarah Chen',
    role: 'Product Lead',
    company: 'Figma',
    initials: 'SC',
    color: 'from-teal-500 to-emerald-600',
  },
  {
    quote: "My clients book through my Schduled link and it looks more professional than any tool I've used. And I pay nothing.",
    name: 'Marcus Williams',
    role: 'Freelance Designer',
    company: 'Self-employed',
    initials: 'MW',
    color: 'from-violet-500 to-indigo-600',
  },
  {
    quote: "The timezone handling alone saves my global team an hour of confusion every single week. Effortless.",
    name: 'Emma Rodriguez',
    role: 'Operations Lead',
    company: 'Notion',
    initials: 'ER',
    color: 'from-orange-500 to-rose-600',
  },
]

const ALL_FEATURES = [
  'Event Types',        'Google Calendar Sync',
  'Availability Rules', 'Google Meet Auto-link',
  'Zoom Integration',   'Timezone Auto-detect',
  'Custom Questions',   'Reschedule & Cancel',
  'Email Reminders',    'Booking Buffers',
  'Daily Limits',       'Open Source',
]

const FAQ_ITEMS = [
  { q: 'Is Schduled really free?', a: 'Yes — completely free. No paid plans, no credit card required, no feature limits. Every capability is available from day one, forever.', defaultOpen: true },
  { q: 'Do my invitees need to sign up?', a: 'No. Invitees open your link, pick a time, and fill in their name and email. No account, no app download, no friction at all.' },
  { q: 'How does calendar sync work?', a: 'Connect your Google Calendar once during setup. Schduled reads your existing events in real time and hides busy slots from your booking page automatically.' },
  { q: 'What happens the moment someone books?', a: 'Both you and the invitee receive a confirmation email with all details, a video link (if configured), and an .ics calendar file. Reminders fire 24 hours and 1 hour before the meeting.' },
  { q: 'How is Schduled different from Calendly?', a: "Schduled is 100% free with no plan limits, a sharper UI, and it's open source. Everything Calendly charges for on paid plans — Schduled ships free." },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Shared dark-section background ───────────────────────────────────────────
const DARK_BG: React.CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(20,184,166,.18) 0%, transparent 55%),
    radial-gradient(circle at bottom left, rgba(13,148,136,.10) 0%, transparent 55%),
    linear-gradient(180deg, #081C1C 0%, #041010 100%)
  `,
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await getCurrentSession()
  if (session) redirect('/dashboard')

  // Dynamic dates — computed fresh on every request
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Booking demo: 3 days from today, capped within the month
  const selectedDay = Math.min(today + 3, daysInMonth)
  const selectedDate = new Date(year, month, selectedDay)
  const selectedDayName = DAY_SHORT[selectedDate.getDay()]
  const selectedMonthShort = MONTH_SHORT[month]

  // Build Mon–Sun calendar grid for current month
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0, Sun=6
  const calGrid: (number | null)[][] = []
  let week: (number | null)[] = Array(firstWeekday).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { calGrid.push(week); week = [] }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    calGrid.push(week)
  }

  // Features section mini-calendar: show today through today+10
  const featStart = today
  const featBusyDay = today + 3   // same as selected (to tell the story: "this slot is taken → other days available")
  const featAvailDay = today + 7
  const todayDayName = DAY_SHORT[now.getDay()]

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">

      {/* ─── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <Logo variant="full" size="lg" href="/" />
          <nav className="hidden items-center gap-8 md:flex">
            {[['Features', '#features'], ['How It Works', '#how-it-works'], ['FAQ', '#faq']].map(([l, h]) => (
              <a key={l} href={h} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block">
              Sign In
            </Link>
            <Link href="/login" className="inline-flex items-center gap-1.5 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              Get Started Free <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      </header>

      <main>

        {/* ─── HERO ────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-0 pt-20 sm:pt-28" style={DARK_BG}>

          {/* Premium floating orbs */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-[700px] w-[700px] animate-schduled-glow-pulse"
            style={{ background: 'radial-gradient(circle at top right, rgba(20,184,166,.18) 0%, transparent 60%)', filter: 'blur(40px)', opacity: 0.9 }}
          />
          <div
            className="pointer-events-none absolute -left-20 bottom-0 h-[500px] w-[500px]"
            style={{ background: 'radial-gradient(circle at bottom left, rgba(13,148,136,.12) 0%, transparent 65%)', filter: 'blur(60px)', opacity: 1 }}
          />

          {/* Grid overlay */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.032]"
            style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">

            {/* ── 2-column split ── */}
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

              {/* ── LEFT: copy ── */}
              <div className="animate-schduled-reveal">
                <div className="mb-7 inline-flex items-center gap-2.5 border border-teal-600/30 bg-teal-950/60 px-3.5 py-1.5 text-xs font-semibold text-teal-300">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-schduled-ping bg-teal-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 bg-teal-400" />
                  </span>
                  Free forever · Open source · No credit card
                </div>

                <h1 className="font-black text-[2.6rem] leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Scheduling that
                  <br />
                  <span
                    className="animate-schduled-text-gradient"
                    style={{
                      background: 'linear-gradient(90deg,#2dd4bf 0%,#14b8a6 28%,#5eead4 55%,#0f9688 80%,#2dd4bf 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      backgroundSize: '200% auto',
                      display: 'inline-block',
                    }}
                  >
                    just works.
                  </span>
                </h1>

                <p className="mt-6 max-w-md text-lg leading-relaxed text-white/55">
                  Share one link. Let people book time with you automatically.
                  No email threads. No calendar ping-pong. Meetings just appear.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link
                    href="/login"
                    className="relative inline-flex items-center gap-2 overflow-hidden bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                  >
                    <span className="animate-schduled-sheen pointer-events-none absolute inset-0"
                      style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,.22) 50%,transparent 60%)', backgroundSize: '200% auto' }} />
                    Start for free
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                  <a href="#how-it-works"
                    className="inline-flex items-center gap-1.5 border border-white/12 px-7 py-3.5 text-sm font-medium text-white/65 transition-all hover:border-white/25 hover:text-white">
                    See how it works
                  </a>
                </div>

                <p className="mt-5 text-xs text-white/30">
                  ✓ No credit card &nbsp;·&nbsp; ✓ Free forever &nbsp;·&nbsp; ✓ 2-minute setup
                </p>
              </div>

              {/* ── RIGHT: visual ── */}
              <div className="relative flex items-start justify-center gap-4 animate-schduled-reveal" style={{ animationDelay: '200ms' }}>

                {/* Calendar picker widget */}
                <div
                  className="animate-schduled-float hidden w-[240px] shrink-0 border border-white/12 lg:block"
                  style={{
                    background: 'linear-gradient(145deg,#0d201a,#091512)',
                    boxShadow: '0 0 60px rgba(20,184,166,.18), 0 24px 48px rgba(0,0,0,.65)',
                    animationDelay: '0.8s',
                    marginTop: '48px',
                  }}
                >
                  <div className="border-b border-white/8 px-4 py-3.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{MONTH_NAMES[month]} {year}</span>
                    <div className="flex gap-1">
                      <span className="text-white/30 text-sm">‹</span>
                      <span className="text-white/30 text-sm">›</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 grid grid-cols-7 text-center">
                      {['M','T','W','T','F','S','S'].map((d, i) => (
                        <span key={i} className="text-[10px] font-bold text-white/25">{d}</span>
                      ))}
                    </div>
                    {calGrid.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 text-center">
                        {week.map((day, di) => (
                          <span
                            key={di}
                            className={`my-0.5 inline-flex h-7 w-7 items-center justify-center text-xs font-medium transition-colors ${
                              day === null
                                ? ''
                                : day === selectedDay
                                ? 'bg-primary text-primary-foreground font-bold'
                                : day < today
                                ? 'text-white/20'
                                : 'cursor-default text-white/55 hover:bg-white/8'
                            }`}
                          >
                            {day ?? ''}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/8 px-4 py-3">
                    <p className="text-xs text-white/35">{selectedDayName} {selectedMonthShort} {selectedDay} · 3 slots available</p>
                  </div>
                </div>

                {/* Booking card — main visual */}
                <div className="relative w-full max-w-[370px] shrink-0">
                  <div
                    className="animate-schduled-float border border-white/12"
                    style={{
                      background: 'linear-gradient(145deg,#0f2118,#091512)',
                      boxShadow: '0 0 80px rgba(20,184,166,.25), 0 40px 80px rgba(0,0,0,.7)',
                      animationDelay: '0s',
                    }}
                  >
                    {/* Card header */}
                    <div className="border-b border-white/8 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/20 text-xs font-black text-teal-300">JS</div>
                        <div>
                          <p className="font-semibold text-white">Jane Smith</p>
                          <p className="text-xs text-white/40">Discovery Call · 30 min</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-[10px] text-teal-400/60">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-schduled-ping bg-teal-400 opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 bg-teal-400" />
                          </span>
                          Live
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-white/35">
                        <VideoCamera size={11} />
                        Google Meet · {selectedDayName}, {selectedMonthShort} {selectedDay}
                      </div>
                    </div>

                    {/* Slots */}
                    <div className="px-6 py-5">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-white/25">Select a time</p>
                      <div className="space-y-2">
                        {[
                          { t: '09:00 AM', sel: false, fade: false },
                          { t: '09:30 AM', sel: true,  fade: false },
                          { t: '10:00 AM', sel: false, fade: false },
                          { t: '10:30 AM', sel: false, fade: false },
                          { t: '11:00 AM', sel: false, fade: true  },
                        ].map(({ t, sel, fade }, i) => (
                          <div
                            key={t}
                            className={`flex cursor-default items-center justify-between px-4 py-2.5 text-sm animate-schduled-reveal ${
                              sel
                                ? 'bg-primary text-primary-foreground'
                                : `border border-white/8 ${fade ? 'opacity-40' : 'text-white/55'}`
                            }`}
                            style={{ animationDelay: `${400 + i * 70}ms` }}
                          >
                            {t}
                            {sel && <span className="flex items-center gap-1 text-xs font-medium opacity-80"><CheckCircle size={12} weight="fill" />Selected</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confirm button */}
                    <div className="border-t border-white/8 px-6 py-5">
                      <div className="relative overflow-hidden bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground">
                        <span className="animate-schduled-sheen pointer-events-none absolute inset-0"
                          style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,.18) 50%,transparent 60%)', backgroundSize: '200% auto' }} />
                        Confirm booking →
                      </div>
                    </div>
                  </div>

                  {/* Confirmation toast */}
                  <div
                    className="mt-3 border border-teal-700/35 bg-teal-950/80 px-4 py-3 backdrop-blur-sm animate-schduled-reveal"
                    style={{ animationDelay: '900ms', boxShadow: '0 8px 32px rgba(0,0,0,.55)' }}
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <CheckCircle size={15} weight="fill" className="text-teal-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-white">Booking confirmed!</p>
                        <p className="text-white/45">Invite sent · Google Meet link included</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reminder badge — top right */}
                <div
                  className="hidden lg:block absolute -top-4 -right-4 border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm animate-schduled-reveal"
                  style={{ animationDelay: '1050ms', boxShadow: '0 8px 28px rgba(0,0,0,.4)' }}
                >
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Bell size={12} className="text-primary/80 shrink-0" />
                    Reminder sent 1h before
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="relative mt-16 h-16"
              style={{ background: 'linear-gradient(to bottom, transparent, #041010)' }} />
          </div>
        </section>

        {/* ─── LOGO TICKER ─────────────────────────────────────────────────────── */}
        <section className="border-y border-border bg-muted/25 py-10">
          <p className="mb-7 text-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            Trusted by teams at
          </p>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-28 bg-gradient-to-r from-muted/25 to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-28 bg-gradient-to-l from-muted/25 to-transparent" />
            <div className="flex animate-schduled-ticker whitespace-nowrap">
              {[...LOGOS, ...LOGOS].map((brand, i) => (
                <span
                  key={i}
                  className="mx-12 inline-block shrink-0 text-base font-black tracking-tight text-muted-foreground/60 transition-colors duration-200 hover:text-muted-foreground"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── WHY SCHDULED ────────────────────────────────────────────────────── */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">

            {/* Section label */}
            <p className="scroll-reveal mb-10 text-center text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/50">
              Why people choose Schduled
            </p>

            {/* Cards — separate boxes, no shared border */}
            <div className="grid gap-5 sm:grid-cols-3">
              {STATS.map((s, i) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.value}
                    className={`scroll-reveal ${i === 1 ? 'sr-d1' : i === 2 ? 'sr-d2' : ''} group relative overflow-hidden border border-border bg-card px-8 py-10 text-center transition-all duration-300 hover:-translate-y-[5px] hover:border-primary/50 hover:shadow-xl`}
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}
                  >
                    {/* Hover glow overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {/* Top accent line */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary to-teal-400 scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />

                    <div className="relative">
                      {/* Icon */}
                      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                        <Icon size={24} weight="duotone" />
                      </div>

                      {/* Value — gradient text */}
                      <div
                        className="mb-1 font-black text-3xl sm:text-4xl animate-schduled-text-gradient"
                        style={{
                          background: 'linear-gradient(90deg,#0d9488 0%,#14b8a6 45%,#2dd4bf 75%,#0d9488 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          backgroundSize: '200% auto',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {s.value}
                      </div>

                      {/* Title */}
                      <p className="mt-2 text-sm font-bold text-foreground">{s.title}</p>

                      {/* Sub */}
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── FEATURES BENTO ──────────────────────────────────────────────────── */}
        <section id="features" className="border-t border-border bg-muted/20 py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mb-16 text-center scroll-reveal">
              <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-primary">Features</p>
              <h2 className="font-black text-3xl leading-tight sm:text-4xl lg:text-5xl">
                Everything you need.
                <br className="hidden sm:block" />
                <span className="text-muted-foreground">Nothing you don't.</span>
              </h2>
              <p className="mt-4 text-muted-foreground">No feature gates. No limits. One price: free.</p>
            </div>

            {/* Bento — row 1: three equal narrow, row 2: two half-wide */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">

              {/* Narrow — Video */}
              <div className="scroll-reveal group relative overflow-hidden border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-2xl lg:col-span-2"
                style={{ ['--tw-shadow' as string]: '0 20px 60px rgba(20,184,166,.08), 0 8px 24px rgba(0,0,0,.12)' }}>
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary to-teal-400 scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <span className="mb-2 inline-block text-[10px] font-black uppercase tracking-eyebrow text-primary/60">Video</span>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center bg-primary/10 text-primary">
                    <VideoCamera size={22} weight="duotone" />
                  </div>
                  <h3 className="mb-2 font-bold text-base">Auto-generated video links</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">Google Meet and Zoom links generated instantly on every confirmed booking. Both parties get the link by email.</p>
                </div>
              </div>

              {/* Narrow — Forms */}
              <div className="scroll-reveal sr-d1 group relative overflow-hidden border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-2xl lg:col-span-2">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary to-teal-400 scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <span className="mb-2 inline-block text-[10px] font-black uppercase tracking-eyebrow text-primary/60">Forms</span>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center bg-primary/10 text-primary">
                    <Lightning size={22} weight="duotone" />
                  </div>
                  <h3 className="mb-2 font-bold text-base">Custom booking questions</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">Ask invitees exactly what you need before the call. Every answer appears in the booking detail.</p>
                </div>
              </div>

              {/* Narrow — Reminders */}
              <div className="scroll-reveal sr-d2 group relative overflow-hidden border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-2xl lg:col-span-2">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary to-teal-400 scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <span className="mb-2 inline-block text-[10px] font-black uppercase tracking-eyebrow text-primary/60">Reminders</span>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center bg-primary/10 text-primary">
                    <Bell size={22} weight="duotone" />
                  </div>
                  <h3 className="mb-2 font-bold text-base">Smart email reminders</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">24-hour and 1-hour reminders sent automatically to both host and invitee. Reschedule links always included.</p>
                </div>
              </div>

              {/* Wide — Calendar sync */}
              <div className="scroll-reveal sr-left group relative overflow-hidden border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-2xl lg:col-span-3">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary to-teal-400 scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative grid gap-6 sm:grid-cols-2 sm:items-center">
                  <div>
                    <span className="mb-2 inline-block text-[10px] font-black uppercase tracking-eyebrow text-primary/60">Calendar</span>
                    <h3 className="mb-3 text-xl font-bold leading-tight">Calendar sync that actually works</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Connect Google Calendar. Your busy blocks are read in real time and hidden instantly from your booking page. Zero double-bookings, ever.
                    </p>
                  </div>
                  <div className="hidden overflow-hidden border border-border bg-muted/40 sm:block">
                    <div className="border-b border-border bg-primary/5 px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-semibold">{MONTH_NAMES[month]} {year}</span>
                      <CalendarCheck size={14} className="text-primary" weight="duotone" />
                    </div>
                    <div className="grid grid-cols-7 gap-px p-3 text-center">
                      {['M','T','W','T','F','S','S'].map((d, i) => (
                        <span key={i} className="text-[9px] font-bold text-muted-foreground/50">{d}</span>
                      ))}
                      {[...Array(6)].map((_, i) => {
                        const d = Math.min(featStart + i, daysInMonth)
                        const isBusy = d === featBusyDay
                        return (
                          <span key={i} className={`mt-1 inline-flex h-6 w-6 items-center justify-center text-[10px] ${isBusy ? 'bg-muted text-muted-foreground/40 line-through' : 'text-foreground/60'}`}>
                            {d}
                          </span>
                        )
                      })}
                      {[...Array(5)].map((_, i) => {
                        const d = Math.min(featStart + 6 + i, daysInMonth)
                        const isAvail = d === featAvailDay
                        return (
                          <span key={i} className={`mt-1 inline-flex h-6 w-6 items-center justify-center text-[10px] font-bold ${isAvail ? 'bg-primary text-primary-foreground' : 'text-foreground/60'}`}>
                            {d}
                          </span>
                        )
                      })}
                    </div>
                    <div className="border-t border-border px-4 py-2">
                      <p className="text-[10px] text-muted-foreground">{todayDayName} {MONTH_SHORT[month]} {today} · Busy (blocked)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wide — Timezone */}
              <div className="scroll-reveal sr-right group relative overflow-hidden border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/60 hover:shadow-2xl lg:col-span-3">
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary to-teal-400 scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative grid gap-6 sm:grid-cols-2 sm:items-center">
                  <div>
                    <span className="mb-2 inline-block text-[10px] font-black uppercase tracking-eyebrow text-primary/60">Timezone</span>
                    <h3 className="mb-3 text-xl font-bold leading-tight">Timezone-aware for everyone</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Invitees see slots in their own timezone automatically. You see them in yours. No "what time is that for me?" emails ever again.
                    </p>
                  </div>
                  <div className="hidden space-y-2 sm:block">
                    {[
                      { tz: 'Your time (EST)', t: '10:30 AM', active: true },
                      { tz: 'Invitee (IST)',   t: '9:00 PM',  active: false },
                      { tz: 'Invitee (PST)',   t: '7:30 AM',  active: false },
                    ].map((row) => (
                      <div key={row.tz} className={`flex items-center justify-between border px-4 py-2.5 text-xs ${row.active ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/30'}`}>
                        <div className="flex items-center gap-2">
                          <Globe size={12} className={row.active ? 'text-primary' : 'text-muted-foreground'} />
                          <span className={row.active ? 'font-medium' : 'text-muted-foreground'}>{row.tz}</span>
                        </div>
                        <span className={`font-mono font-bold text-xs ${row.active ? 'text-primary' : 'text-muted-foreground'}`}>{row.t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRODUCT PREVIEW ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-32" style={DARK_BG}>
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-96 w-[700px] opacity-30"
            style={{ background: 'radial-gradient(ellipse,rgba(20,184,166,.35) 0%,transparent 65%)', filter: 'blur(20px)' }} />

          <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mb-12 text-center">
              <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-teal-400/60">The product</p>
              <h2 className="font-black text-3xl text-white sm:text-4xl lg:text-5xl">
                Clean. Fast.<br className="hidden sm:block" /> Everything at a glance.
              </h2>
              <p className="mt-4 text-white/45">Your command center for every booking, every meeting, every invitee.</p>
            </div>

            {/* Browser frame — taller + stronger shadow */}
            <div
              className="overflow-hidden border border-white/12"
              style={{ boxShadow: '0 60px 120px rgba(0,0,0,.75), 0 0 0 1px rgba(20,184,166,.12), 0 0 80px rgba(20,184,166,.06)' }}
            >
              <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.04] px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/45" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/45" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/45" />
                </div>
                <div className="flex flex-1 max-w-xs items-center gap-2 border border-white/8 bg-black/25 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-400/55" />
                  <span className="font-mono text-[11px] text-white/30">app.schduled.com/dashboard</span>
                </div>
              </div>

              <div className="flex h-[520px] sm:h-[620px]" style={{ background: '#0f1f1a' }}>
                <div className="hidden w-44 shrink-0 flex-col border-r border-white/8 sm:flex" style={{ background: 'oklch(0.108 0.032 215)' }}>
                  <div className="flex-1 space-y-0.5 px-2 pt-4">
                    {[['Dashboard',true],['Event Types',false],['Availability',false],['Bookings',false],['Settings',false]].map(([label, active]) => (
                      <div key={label as string} className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium ${active ? 'bg-white/10 text-white' : 'text-white/38'}`}>
                        <div className={`h-1 w-1 rounded-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/8 bg-white/[0.05] px-2 py-3 space-y-1">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">Admin</div>
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-primary/30 text-[9px] font-black text-white">DH</div>
                      <div className="h-2 w-14 rounded-sm bg-white/15" />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden p-5 space-y-4" style={{ background: 'oklch(0.96 0.006 85)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">👋</span>
                        <div className="h-4 w-44 bg-foreground/12" />
                      </div>
                      <div className="mt-1.5 h-2.5 w-60 bg-foreground/6" />
                    </div>
                    <div className="h-8 w-24 border border-border bg-primary/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {[['TOTAL','24',false],['UPCOMING','3',true],['COMPLETED','19',false],['CANCELLED','2',false]].map(([label, val, accent]) => (
                      <div key={label as string} className={`border p-3 ${accent ? 'border-primary/40 bg-primary/[0.07]' : 'border-border bg-card'}`}>
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
                        <p className="mt-1 text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{val}</p>
                        <p className="text-[9px] text-muted-foreground/60">this month</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      { title: 'Upcoming Meetings', rows: ['Alex Johnson — Mon 9:30 AM', 'Maria Garcia — Tue 2:00 PM', 'Tom Lee — Wed 11:00 AM'] },
                      { title: 'Recent Bookings',   rows: ['Sarah Chen — confirmed', 'James Park — confirmed', 'Nina Patel — cancelled'] },
                    ].map((card) => (
                      <div key={card.title} className="border border-border bg-card">
                        <div className="flex items-center justify-between border-b border-border px-3 py-2">
                          <span className="text-[10px] font-black uppercase tracking-wider">{card.title}</span>
                          <span className="text-[10px] font-semibold text-primary">View all</span>
                        </div>
                        {card.rows.map((r) => (
                          <div key={r} className="border-b border-border/40 px-3 py-2 text-[10px] text-muted-foreground last:border-0">{r}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {[['Mon','4'],['Tue','7'],['Wed','2']].map(([day, count]) => (
                      <div key={day} className="border border-border bg-card p-3 text-center">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{day}</p>
                        <p className="mt-1 text-xl font-black" style={{ fontFamily: 'var(--font-heading)' }}>{count}</p>
                        <p className="text-[9px] text-muted-foreground/60">bookings</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mb-16 text-center scroll-reveal">
              <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-primary">How It Works</p>
              <h2 className="font-black text-3xl sm:text-4xl lg:text-5xl">
                From sign-up to booked
                <br className="hidden sm:block" />
                in under 5 minutes.
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.num} className={`scroll-reveal ${i === 1 ? 'sr-d1' : i === 2 ? 'sr-d2' : ''} group relative`}>

                    {/* Badge + connector line */}
                    <div className="relative mb-6">
                      {/* The badge box */}
                      <div className="relative inline-flex h-14 w-14 items-center justify-center border-2 border-border bg-background transition-all duration-300 group-hover:border-primary group-hover:bg-primary/5">
                        <span className="text-xl leading-none">{step.emoji}</span>
                        {/* Step number chip */}
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-primary text-[9px] font-black text-primary-foreground">
                          {step.num}
                        </span>
                      </div>

                      {/* Connector line: right edge of badge → left edge of next badge
                          left-14  = 56px (w-14) = right edge of badge
                          right: -2rem = -(gap-8) = extends through the gap exactly */}
                      {i < 2 && (
                        <div
                          className="pointer-events-none absolute top-7 hidden md:block"
                          style={{
                            left: '3.5rem',      /* 56px = right edge of w-14 badge */
                            right: '-2rem',      /* -32px = through gap-8 to left of next column */
                            height: '1px',
                            background: 'linear-gradient(to right, var(--color-border), var(--color-border) 60%, transparent)',
                            backgroundImage: `repeating-linear-gradient(to right, oklch(0.922 0.005 260) 0, oklch(0.922 0.005 260) 6px, transparent 6px, transparent 12px)`,
                          }}
                        />
                      )}
                    </div>

                    <div className="mb-2 text-primary">
                      <Icon size={20} weight="duotone" />
                    </div>
                    <h3 className="mb-2 font-bold text-lg">{step.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{step.description}</p>

                    <div className="inline-flex items-center gap-1.5 border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                      <CheckCircle size={11} weight="fill" />
                      {step.detail}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── FULL FEATURE LIST ────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-muted/20 py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div className="scroll-reveal sr-left">
                <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-primary">Everything included</p>
                <h2 className="mb-4 font-black text-3xl sm:text-4xl">
                  Every feature.<br />Zero paywalls.
                </h2>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  We don't have a paid plan. There's nothing to unlock.
                  Everything listed here is yours from the moment you sign up.
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  Start free today <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
              <div className="scroll-reveal sr-right grid grid-cols-2 gap-3">
                {ALL_FEATURES.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle size={15} weight="fill" className="shrink-0 text-primary" />
                    <span className="text-sm font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ────────────────────────────────────────────────────── */}
        <section className="py-28">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mb-14 text-center scroll-reveal">
              <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-primary">Testimonials</p>
              <h2 className="font-black text-3xl sm:text-4xl lg:text-5xl">
                Loved by people who<br className="hidden sm:block" /> schedule a lot.
              </h2>

              {/* Rating bar */}
              <div className="mt-6 inline-flex items-center gap-4 border border-border bg-muted/30 px-6 py-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} weight="fill" className="text-primary" />
                  ))}
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm font-bold text-foreground">4.9 / 5</span>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm text-muted-foreground">based on 500+ bookings</span>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.name}
                  className={`scroll-reveal ${i === 1 ? 'sr-d1' : i === 2 ? 'sr-d2' : ''} group relative overflow-hidden border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-2xl`}
                >
                  <div className="absolute right-0 top-0 h-12 w-12 bg-gradient-to-bl from-primary/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={12} weight="fill" className="text-primary" />
                    ))}
                  </div>
                  <p className="mb-6 text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center bg-gradient-to-br ${t.color} text-xs font-black text-white`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
        <section id="faq" className="border-t border-border bg-muted/20 py-28">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <div className="mb-14 text-center scroll-reveal">
              <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-primary">FAQ</p>
              <h2 className="font-black text-3xl sm:text-4xl">Common questions.</h2>
            </div>

            <div className="divide-y divide-border border-t border-border">
              {FAQ_ITEMS.map(({ q, a, defaultOpen }, i) => (
                <details key={q} open={defaultOpen} className={`scroll-reveal ${i > 0 ? `sr-d${Math.min(i, 3) as 1|2|3}` : ''} group py-5`}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <span className="font-semibold text-foreground">{q}</span>
                    <span className="mt-0.5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-45">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="square" />
                      </svg>
                    </span>
                  </summary>
                  <div className="faq-body overflow-hidden">
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-36" style={DARK_BG}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.038]"
            style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[600px] animate-schduled-glow-pulse"
            style={{ background: 'radial-gradient(ellipse,rgba(20,184,166,.25) 0%,transparent 65%)', filter: 'blur(20px)', opacity: 0.9 }} />

          <div className="relative mx-auto max-w-2xl px-5 text-center sm:px-8">
            <p className="mb-5 text-xs font-black uppercase tracking-eyebrow text-teal-400/55">Get started today</p>
            <h2 className="font-black text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Your booking link
              <br />
              <span style={{
                background: 'linear-gradient(90deg,#2dd4bf 0%,#14b8a6 35%,#5eead4 70%,#14b8a6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                is one click away.
              </span>
            </h2>
            <p className="mt-6 text-lg text-white/50">
              Sign up in 30 seconds. Connect your calendar.
              Share your link. The rest is automatic.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4">
              <Link href="/login" className="relative inline-flex items-center gap-2 overflow-hidden bg-primary px-9 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                <span className="animate-schduled-sheen pointer-events-none absolute inset-0"
                  style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,.22) 50%,transparent 60%)', backgroundSize: '200% auto' }} />
                Start scheduling for free
                <ArrowRight size={16} weight="bold" />
              </Link>
              <p className="text-sm text-white/30">No credit card · No paid plans · Free forever</p>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-page">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Logo variant="full" size="lg" href="/" />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Smart scheduling for modern professionals. Free forever, open source.</p>
            </div>
            {[
              { title: 'Product', links: [['Features', '#features'], ['How It Works', '#how-it-works'], ['FAQ', '#faq'], ['Changelog', '/changelog']] },
              { title: 'Company', links: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy'], ['Terms', '/terms']] },
              { title: 'Social',  links: [['GitHub', 'https://github.com'], ['Twitter / X', 'https://twitter.com'], ['LinkedIn', 'https://linkedin.com']] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-xs font-black uppercase tracking-eyebrow text-foreground">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">{label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Schduled. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
