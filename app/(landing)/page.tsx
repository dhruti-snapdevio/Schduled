import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FaqAccordion } from '@/components/landing/faq-accordion'
import { FeaturesSection } from '@/components/landing/features-section'
import { LandingHeader } from '@/components/landing/landing-header'
import { LandingFooter } from '@/components/landing/landing-footer'
import { Reveal } from '@/components/landing/reveal'
import { TestimonialCarousel } from '@/components/landing/testimonial-carousel'
import { env } from '@/lib/env'

// Illustrative example domain shown in "how it works" copy — derives from
// the real configured deployment so self-hosters see their own domain
// instead of the hosted product's.
const APP_HOST = env.NEXT_PUBLIC_APP_URL.replace(/^https?:\/\//, '')
import {
  ArrowDown,
  ArrowRight,
  Bell,
  CalendarBlank,
  CalendarCheck,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  Code,
  Globe,
  Lightning,
  LinkSimple,
  ShieldCheck,
  Star,
  VideoCamera,
} from '@phosphor-icons/react/dist/ssr'
import { getCurrentSession } from '@/lib/authz'

export const metadata = {
  title: 'Schduled — Smart scheduling for modern teams',
  description: 'Share a link. Let people book time with you automatically. No back-and-forth emails.',
}

// ── Static data ───────────────────────────────────────────────────────────────

/* Real SVG logos for the Trusted By marquee */
const BRAND_LOGOS = [
  {
    id: 'github',
    el: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" height="28" fill="currentColor" aria-hidden>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">GitHub</span>
      </div>
    ),
  },
  {
    id: 'vercel',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" height="26" fill="currentColor" aria-hidden>
          <path d="M24 22.525H0l12-21.05 12 21.05z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">Vercel</span>
      </div>
    ),
  },
  {
    id: 'figma',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 38 57" height="30" fill="currentColor" aria-hidden>
          <path d="M19 28.5A9.5 9.5 0 1 1 28.5 19 9.511 9.511 0 0 1 19 28.5zm-9.5-19A9.5 9.5 0 0 1 19 0h9.5a9.5 9.5 0 0 1 0 19H19A9.5 9.5 0 0 1 9.5 9.5zM0 28.5A9.5 9.5 0 0 1 9.5 19H19v9.5a9.5 9.5 0 1 1-19 0zM9.5 38H19v9.5a9.5 9.5 0 1 1-9.5-9.5zm9.5 0h9.5a9.5 9.5 0 1 1-9.5 9.5z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">Figma</span>
      </div>
    ),
  },
  {
    id: 'linear',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 100 100" height="28" fill="currentColor" aria-hidden>
          <path d="M1.225 61.54 38.46 98.775a50.03 50.03 0 0 1-37.235-37.235zM0 49.74 50.26 100a50.028 50.028 0 0 1-6.944-.664L.664 56.684A50.028 50.028 0 0 1 0 49.74zm2.347-12.6 60.513 60.513a50.275 50.275 0 0 1-8.714 2.057L4.404 58.454a50.275 50.275 0 0 1 2.057-8.714zM8.212 27.008l64.78 64.78a50.118 50.118 0 0 1-6.561 4.286L11.926 33.569a50.118 50.118 0 0 1 4.286-6.561zm12.077-12.02 64.723 64.723C74.38 85.626 59.414 91.4 43.09 91.4c-22.865 0-42.766-12.838-52.981-31.725L4.982 43.09c0-16.324 5.774-31.29 15.307-41.922zM50 0c27.614 0 50 22.386 50 50 0 16.324-5.774 31.29-15.307 41.922L35.386 32.615C37.52 20.527 46.56 11 50 0z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">Linear</span>
      </div>
    ),
  },
  {
    id: 'stripe',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" height="28" fill="currentColor" aria-hidden>
          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">Stripe</span>
      </div>
    ),
  },
  {
    id: 'notion',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" height="28" fill="currentColor" aria-hidden>
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">Notion</span>
      </div>
    ),
  },
  {
    id: 'google',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" height="28" fill="currentColor" aria-hidden>
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">Google</span>
      </div>
    ),
  },
  {
    id: 'hubspot',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" height="28" fill="currentColor" aria-hidden>
          <path d="M22.175 11.073a4.175 4.175 0 0 0-3.357-4.1V4.898a1.51 1.51 0 0 0 .87-1.37V3.51A1.51 1.51 0 0 0 18.18 2h-.016a1.51 1.51 0 0 0-1.508 1.51v.018a1.51 1.51 0 0 0 .87 1.37v2.075a4.176 4.176 0 0 0-1.99.912L8.572 3.24a1.757 1.757 0 1 0-.926 1.594L15.1 8.94a4.175 4.175 0 0 0-.35 1.653 4.175 4.175 0 0 0 2.198 3.683l-1.26 1.749a1.384 1.384 0 1 0 1.175.645l1.36-1.887a4.175 4.175 0 0 0 3.952-3.71zm-4.004 2.37a2.37 2.37 0 1 1 0-4.74 2.37 2.37 0 0 1 0 4.74z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">HubSpot</span>
      </div>
    ),
  },
  {
    id: 'slack',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" height="28" fill="currentColor" aria-hidden>
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">Slack</span>
      </div>
    ),
  },
  {
    id: 'zoom',
    el: (
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" height="28" fill="currentColor" aria-hidden>
          <path d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12zM9.947 8.04c-1.193 0-2.16.968-2.16 2.16v4.517l.004.145a3.84 3.84 0 0 0 3.836 3.695h6.213a2.16 2.16 0 0 0 2.16-2.16v-4.517l-.004-.145a3.84 3.84 0 0 0-3.836-3.695H9.947zm7.97 1.44 1.023 1.023v2.994l-1.022 1.022V9.48z" />
        </svg>
        <span className="text-[19px] font-black tracking-tight">Zoom</span>
      </div>
    ),
  },
]

const STEPS = [
  {
    num: '01',
    icon: Clock,
    title: 'Set your availability',
    description: 'Choose working hours, buffer times, and connect your calendar. Takes 2 minutes total.',
    detail: 'Mon–Fri, 9AM–5PM · Auto-blocked when busy',
  },
  {
    num: '02',
    icon: LinkSimple,
    title: 'Share your booking link',
    description: `You get ${APP_HOST}/yourname. Paste it in your email signature, LinkedIn bio, or anywhere.`,
    detail: `${APP_HOST}/janedoe/30-min`,
  },
  {
    num: '03',
    icon: CalendarBlank,
    title: 'Meetings land in your calendar',
    description: 'Invitees pick a slot, fill in their info, and the event appears in both calendars with a video link.',
    detail: 'Confirmation emails sent instantly',
  },
]

const STATS = [
  { icon: Lightning,   value: '< 2 min', title: 'Setup Time',       sub: 'Get started in seconds. No config, no friction.' },
  { icon: ShieldCheck, value: '0',       title: 'Double Bookings',   sub: 'Calendar sync prevents every double-booking.' },
  { icon: LinkSimple,  value: '1 link',  title: 'Share Everywhere',  sub: 'Book meetings from anywhere you share it.' },
]

const TESTIMONIALS = [
  {
    quote: "I replaced Calendly the same day I found Schduled. Cleaner UI, faster setup, and it's genuinely free — no catch.",
    highlight: "it's genuinely free — no catch",
    name: 'A. C.',
    role: 'Product Lead',
    company: 'SaaS startup',
    initials: 'AC',
    avatarGrad: 'from-teal-500 to-emerald-600',
    chips: ['Google Calendar sync', 'Custom booking page'],
  },
  {
    quote: "My clients book through my Schduled link and it looks more professional than any tool I've used. And I pay nothing.",
    highlight: 'looks more professional than any tool',
    name: 'M. W.',
    role: 'Freelance Designer',
    company: 'Independent',
    initials: 'MW',
    avatarGrad: 'from-violet-500 to-indigo-600',
    chips: ['Custom booking page', 'Buffer times'],
  },
  {
    quote: "The timezone handling alone saves my global team an hour of confusion every single week. Effortless.",
    highlight: 'saves my global team an hour of confusion',
    name: 'E. R.',
    role: 'Operations Lead',
    company: 'Remote-first team',
    initials: 'ER',
    avatarGrad: 'from-orange-500 to-rose-600',
    chips: ['Timezone detection', 'Google Meet'],
  },
  {
    quote: "Switched from Calendly after they capped my plan's meeting types. Schduled gives me unlimited everything for free.",
    highlight: 'unlimited everything for free',
    name: 'D. K.',
    role: 'Sales Manager',
    company: 'B2B software',
    initials: 'DK',
    avatarGrad: 'from-blue-500 to-cyan-600',
    chips: ['Round robin', 'Meeting types'],
  },
  {
    quote: "Set it up during onboarding, forgot about it, and it just quietly runs. Exactly what scheduling software should be.",
    highlight: 'it just quietly runs',
    name: 'S. P.',
    role: 'Engineering Manager',
    company: 'Fintech startup',
    initials: 'SP',
    avatarGrad: 'from-pink-500 to-fuchsia-600',
    chips: ['Availability rules', 'Email reminders'],
  },
  {
    quote: "My coaching clients book themselves in seconds now. No more back-and-forth emails trying to find a slot that works.",
    highlight: 'book themselves in seconds',
    name: 'L. N.',
    role: 'Career Coach',
    company: 'Self-employed',
    initials: 'LN',
    avatarGrad: 'from-amber-500 to-orange-600',
    chips: ['Buffer times', 'Custom booking page'],
  },
]

const FEATURE_GROUPS = [
  {
    label: 'Scheduling',
    icon: CalendarBlank,
    items: ['Meeting Types', 'Availability Rules', 'Booking Limits', 'Buffer Times'],
  },
  {
    label: 'Integrations',
    icon: VideoCamera,
    items: ['Google Meet', 'Zoom', 'Microsoft Teams', 'Google Calendar'],
  },
  {
    label: 'Automation',
    icon: Lightning,
    items: ['Email Reminders', 'Reschedule & Cancel', 'Custom Questions', 'ICS Downloads'],
  },
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

const DARK_BG: React.CSSProperties = {
  background: `
    radial-gradient(circle at top right, rgba(20,184,166,.18) 0%, transparent 55%),
    radial-gradient(circle at bottom left, rgba(13,148,136,.10) 0%, transparent 55%),
    linear-gradient(180deg, #081C1C 0%, #041010 100%)
  `,
}


const PARTICLES = [
  { top: '12%', left: '8%',  size: 3, delay: '0s',   dur: '7s'   },
  { top: '22%', left: '78%', size: 2, delay: '1.2s', dur: '9s'   },
  { top: '58%', left: '12%', size: 4, delay: '2.1s', dur: '6.5s' },
  { top: '72%', left: '68%', size: 2, delay: '0.6s', dur: '8s'   },
  { top: '38%', left: '48%', size: 3, delay: '3.3s', dur: '7.5s' },
  { top: '82%', left: '38%', size: 2, delay: '1.8s', dur: '9.5s' },
  { top: '8%',  left: '52%', size: 2, delay: '4.1s', dur: '8s'   },
  { top: '48%', left: '92%', size: 3, delay: '2.7s', dur: '6s'   },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const session = await getCurrentSession()
  if (session) redirect('/dashboard')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const today = now.getDate()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const selectedDay = Math.min(today + 3, daysInMonth)
  const selectedDate = new Date(year, month, selectedDay)
  const selectedDayName = DAY_SHORT[selectedDate.getDay()]
  const selectedMonthShort = MONTH_SHORT[month]

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
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

  const featStart   = today
  const featBusyDay = today + 3
  const featAvailDay = today + 7
  const todayDayName = DAY_SHORT[now.getDay()]

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground antialiased">

      {/* ─── NAVBAR ──────────────────────────────────────────────────────────── */}
      <LandingHeader />

      <main>

        {/* ─── HERO ────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-0 pt-20 sm:pt-28" style={DARK_BG}>

          {/* Animated gradient orbs */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-[700px] w-[700px] animate-schduled-glow-pulse"
            style={{ background: 'radial-gradient(circle at top right, rgba(20,184,166,.22) 0%, transparent 60%)', filter: 'blur(40px)', opacity: 0.9 }}
          />
          <div
            className="pointer-events-none absolute -left-20 bottom-0 h-[500px] w-[500px]"
            style={{ background: 'radial-gradient(circle at bottom left, rgba(13,148,136,.14) 0%, transparent 65%)', filter: 'blur(60px)' }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[600px]"
            style={{ background: 'radial-gradient(ellipse, rgba(20,184,166,.06) 0%, transparent 70%)', filter: 'blur(30px)' }}
          />

          {/* Grid overlay — 10% opacity */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.10]"
            style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)', backgroundSize: '52px 52px' }} />

          {/* Floating particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {PARTICLES.map((p, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-teal-400 animate-schduled-particle"
                style={{
                  top: p.top, left: p.left,
                  width: p.size, height: p.size,
                  animationDelay: p.delay,
                  animationDuration: p.dur,
                }}
              />
            ))}
          </div>

          <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 xl:px-20">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

              {/* ── LEFT: copy ── */}
              <div className="animate-schduled-reveal">

                {/* 3 premium micro-badges */}
                <div className="mb-8 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 border border-teal-600/30 bg-teal-950/70 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-sm">
                    <Lightning size={10} weight="fill" /> No credit card required
                  </span>
                  <span className="inline-flex items-center gap-1.5 border border-teal-600/30 bg-teal-950/70 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-sm">
                    <Code size={10} weight="bold" /> Open Source
                  </span>
                  <span className="inline-flex items-center gap-1.5 border border-teal-600/30 bg-teal-950/70 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-sm">
                    <Globe size={10} weight="duotone" /> Timezone Smart
                  </span>
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

                <p className="mt-5 flex items-center gap-2 text-xs text-white/30">
                  <CheckCircle size={11} weight="fill" className="text-teal-400/60 shrink-0" /> No credit card
                  <span className="opacity-40">·</span>
                  <CheckCircle size={11} weight="fill" className="text-teal-400/60 shrink-0" /> Free forever
                  <span className="opacity-40">·</span>
                  <CheckCircle size={11} weight="fill" className="text-teal-400/60 shrink-0" /> 2-minute setup
                </p>
              </div>

              {/* ── RIGHT: booking widget ── */}
              <div className="relative flex items-start justify-center gap-4 animate-schduled-reveal" style={{ animationDelay: '200ms' }}>

                {/* Calendar picker */}
                <div
                  className="hidden w-[240px] shrink-0 border border-white/12 lg:block"
                  style={{
                    background: 'linear-gradient(145deg,#0d201a,#091512)',
                    animation: 'schduled-float 5s ease-in-out infinite',
                    animationDelay: '0.8s',
                    marginTop: '48px',
                  }}
                >
                  <div className="border-b border-white/8 px-4 py-3.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{MONTH_NAMES[month]} {year}</span>
                    <div className="flex gap-1">
                      <CaretLeft size={14} className="text-white/30" />
                      <CaretRight size={14} className="text-white/30" />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="mb-2 grid grid-cols-7 text-center">
                      {['M','T','W','T','F','S','S'].map((d, i) => (
                        <span key={i} className="text-2xs font-bold text-white/25">{d}</span>
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

                {/* Main booking card — 4s float */}
                <div className="relative w-full max-w-[370px] shrink-0">
                  <div
                    className="border border-white/12"
                    style={{
                      background: 'linear-gradient(145deg,#0f2118,#091512)',
                      animation: 'schduled-float 4s ease-in-out infinite',
                      animationDelay: '0s',
                    }}
                  >
                    <div className="border-b border-white/8 px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/20 text-xs font-black text-teal-300">JS</div>
                        <div>
                          <p className="font-semibold text-white">Jane Smith</p>
                          <p className="text-xs text-white/40">Discovery Call · 30 min</p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-2xs text-teal-400/60">
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

                    <div className="px-6 py-5">
                      <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-white/25">Select a time</p>
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
                                : `border border-white/8 text-white/55 ${fade ? 'opacity-40' : ''}`
                            }`}
                            style={{ animationDelay: `${400 + i * 70}ms` }}
                          >
                            {t}
                            {sel && <span className="flex items-center gap-1 text-xs font-medium opacity-80"><CheckCircle size={12} weight="fill" />Selected</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/8 px-6 py-5">
                      <div className="relative overflow-hidden bg-primary py-3.5 text-center text-sm font-semibold text-primary-foreground">
                        <span className="animate-schduled-sheen pointer-events-none absolute inset-0"
                          style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,.18) 50%,transparent 60%)', backgroundSize: '200% auto' }} />
                        Confirm booking
                      </div>
                    </div>
                  </div>

                  {/* Toast */}
                  <div
                    className="mt-3 border border-teal-700/35 bg-teal-950/80 px-4 py-3 backdrop-blur-sm animate-schduled-reveal"
                    style={{ animationDelay: '900ms' }}
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

                {/* Reminder badge */}
                <div
                  className="hidden lg:block absolute -top-4 -right-4 border border-white/8 bg-white/5 px-4 py-3 backdrop-blur-sm animate-schduled-reveal"
                  style={{ animationDelay: '1050ms' }}
                >
                  <div className="flex items-center gap-2 text-xs text-white/50">
                    <Bell size={12} className="text-primary/80 shrink-0" />
                    Reminder sent 1h before
                  </div>
                </div>
              </div>
            </div>

            <div className="relative mt-16 h-16"
              style={{ background: 'linear-gradient(to bottom, transparent, #041010)' }} />
          </div>
        </section>

        {/* ─── TRUSTED BY ──────────────────────────────────────────────────────── */}
        <section className="border-y border-border bg-background py-7">
          <Reveal className="mb-6 text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-foreground/50">
              Trusted by teams at
            </p>
          </Reveal>
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />
            <div className="flex animate-schduled-ticker items-center whitespace-nowrap">
              {[...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, i) => (
                <div
                  key={i}
                  className="mx-12 inline-flex shrink-0 items-center text-foreground/55 grayscale transition-all duration-300 hover:text-foreground hover:grayscale-0"
                >
                  {brand.el}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── STATS ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-y border-border bg-muted/20">
          {/* Soft centered glow */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[760px] -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(ellipse, rgba(20,184,166,0.09) 0%, transparent 65%)', filter: 'blur(28px)' }}
          />
          {/* Faint dot grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(20,184,166,0.25) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />

          <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 xl:px-20">

            {/* Heading block */}
            <Reveal className="pt-14 pb-10 text-center">
              <p className="mb-4 text-xs font-black uppercase tracking-eyebrow text-primary">
                Why people choose Schduled
              </p>
              <h2 className="mb-4 text-3xl font-black text-foreground sm:text-4xl">
                Scheduling that{' '}
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
              </h2>
              <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
                Everything you need to create booking pages, eliminate double bookings,
                and share your availability in minutes.
              </p>
            </Reveal>

            {/* Stats row */}
            <Reveal delay={80}>
              <div className="flex flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
                {STATS.map((s) => {
                  const Icon = s.icon
                  return (
                    <div
                      key={s.value}
                      className="group flex flex-1 flex-col items-center px-10 py-10 text-center transition-all duration-300 hover:-translate-y-1 sm:py-14"
                    >
                      {/* Small icon badge */}
                      <div className="mb-4 flex h-8 w-8 items-center justify-center bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/18">
                        <Icon size={15} weight="duotone" />
                      </div>

                      {/* Large metric number */}
                      <div
                        className="mb-2 font-black leading-none tracking-tight animate-schduled-text-gradient"
                        style={{
                          fontSize: 'clamp(2.8rem, 4.2vw, 4.5rem)',
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

                      {/* Uppercase label */}
                      <p className="mb-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-foreground/60">
                        {s.title}
                      </p>

                      {/* Supporting sentence */}
                      <p className="max-w-[200px] text-sm leading-relaxed text-muted-foreground">
                        {s.sub}
                      </p>
                    </div>
                  )
                })}
              </div>
            </Reveal>

          </div>
        </section>

        {/* ─── FEATURES ────────────────────────────────────────────────────── */}
        <FeaturesSection />

        {/* ─── PRODUCT PREVIEW ─────────────────────────────────────────────────── */}
        <section className="relative overflow-clip py-32" style={DARK_BG}>
          {/* Animated radial glow behind dashboard */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] animate-schduled-glow-pulse"
            style={{ background: 'radial-gradient(ellipse,rgba(20,184,166,.40) 0%,transparent 65%)', filter: 'blur(20px)', opacity: 0.7 }}
          />
          <div className="pointer-events-none absolute inset-0 opacity-[0.032]"
            style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

          <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 xl:px-20">
            <Reveal className="mb-14 text-center">
              <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-teal-400/60">The product</p>
              <h2 className="font-black text-3xl text-white sm:text-4xl lg:text-5xl">
                Clean. Fast.<br className="hidden sm:block" /> Everything at a glance.
              </h2>
              <p className="mt-4 text-white/45">Your command center for every booking, every meeting, every invitee.</p>
            </Reveal>

            {/* Dashboard frame with floating labels */}
            <Reveal delay={150} className="relative">

              {/* Floating label — Upcoming */}
              <div
                className="absolute -left-4 top-20 z-10 hidden border border-teal-600/35 bg-teal-950/90 px-3 py-2 backdrop-blur-sm animate-schduled-reveal xl:block"
                style={{ animationDelay: '300ms', animation: 'schduled-float 5s ease-in-out 0.5s infinite' }}
              >
                <p className="text-2xs font-black uppercase tracking-wider text-teal-400/60">Upcoming</p>
                <p className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>10</p>
                <p className="text-2xs text-white/40">meetings this week</p>
              </div>

              {/* Floating label — Team */}
              <div
                className="absolute -right-4 top-32 z-10 hidden border border-teal-600/35 bg-teal-950/90 px-3 py-2 backdrop-blur-sm xl:block"
                style={{ animation: 'schduled-float 6s ease-in-out 1.2s infinite' }}
              >
                <p className="text-2xs font-black uppercase tracking-wider text-teal-400/60">Team</p>
                <p className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>4</p>
                <p className="text-2xs text-white/40">active members</p>
              </div>

              {/* Floating label — Analytics */}
              <div
                className="absolute -right-4 bottom-32 z-10 hidden border border-teal-600/35 bg-teal-950/90 px-3 py-2 backdrop-blur-sm xl:block"
                style={{ animation: 'schduled-float 7s ease-in-out 2s infinite' }}
              >
                <p className="text-2xs font-black uppercase tracking-wider text-teal-400/60">Analytics</p>
                <p className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>+28%</p>
                <p className="text-2xs text-white/40">bookings this month</p>
              </div>

              {/* Browser frame */}
              <div
                className="overflow-hidden border border-white/12"
                style={{}}
              >
                <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.04] px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500/45" />
                    <div className="h-2 w-2 rounded-full bg-amber-500/45" />
                    <div className="h-2 w-2 rounded-full bg-green-500/45" />
                  </div>
                  <div className="flex flex-1 max-w-xs items-center gap-2 border border-white/8 bg-black/25 px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400/55" />
                    <span className="font-mono text-xs text-white/30">{APP_HOST}/dashboard</span>
                  </div>
                </div>

                <div className="flex h-[520px] sm:h-[620px]" style={{ background: '#0f1f1a' }}>
                  <div className="hidden w-44 shrink-0 flex-col border-r border-white/8 sm:flex" style={{ background: 'oklch(0.108 0.032 215)' }}>
                    <div className="flex-1 space-y-0.5 px-2 pt-4">
                      {[['Dashboard',true],['Meeting Types',false],['Availability',false],['Bookings',false],['Settings',false]].map(([label, active]) => (
                        <div key={label as string} className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium ${active ? 'bg-white/10 text-white' : 'text-white/38'}`}>
                          <div className={`h-1 w-1 rounded-full ${active ? 'bg-primary' : 'bg-transparent'}`} />
                          {label}
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/8 bg-white/[0.05] px-2 py-3 space-y-1">
                      <div className="px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-white/25">Admin</div>
                      <div className="flex items-center gap-2 px-3 py-1.5">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center bg-primary/30 text-[9px] font-black text-white">DH</div>
                        <div className="h-2 w-14 bg-white/15" />
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden p-5 space-y-4" style={{ background: 'oklch(0.96 0.006 85)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Bell size={13} weight="fill" className="text-primary/60" />
                          <div className="h-4 w-44 bg-foreground/12" />
                        </div>
                        <div className="mt-1.5 h-2.5 w-60 bg-foreground/6" />
                      </div>
                      <div className="h-8 w-24 border border-border bg-primary/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {[['TOTAL','24',false],['UPCOMING','10',true],['COMPLETED','19',false],['CANCELLED','2',false]].map(([label, val, accent]) => (
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
                            <span className="text-2xs font-black uppercase tracking-wider">{card.title}</span>
                            <span className="text-2xs font-semibold text-primary">View all</span>
                          </div>
                          {card.rows.map((r) => (
                            <div key={r} className="border-b border-border/40 px-3 py-2 text-2xs text-muted-foreground last:border-0">{r}</div>
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
            </Reveal>
          </div>
        </section>

        {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-32 lg:py-44">

          {/* Floating gradient blobs */}
          <div
            className="pointer-events-none absolute left-[4%] top-[8%] h-[560px] w-[560px]"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.07) 0%, transparent 65%)', filter: 'blur(52px)' }}
          />
          <div
            className="pointer-events-none absolute right-[4%] bottom-[8%] h-[440px] w-[440px]"
            style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.06) 0%, transparent 65%)', filter: 'blur(52px)' }}
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.04) 0%, transparent 65%)', filter: 'blur(40px)' }}
          />

          {/* Subtle dot grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.28]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(20,184,166,0.22) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 xl:px-20">
            <Reveal className="mb-24 text-center">
              <p className="mb-4 text-xs font-black uppercase tracking-eyebrow text-primary">How It Works</p>
              <h2 className="font-black text-3xl sm:text-4xl lg:text-5xl">
                From sign-up to booked
                <br className="hidden sm:block" />
                in under 5 minutes.
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground">
                Three steps is all it takes — no configuration nightmares, no IT tickets, no training required.
              </p>
            </Reveal>

            {/* ── Desktop: 3 cards side-by-side with arrow connectors ── */}
            <div className="hidden md:grid md:grid-cols-[1fr_52px_1fr_52px_1fr] items-stretch">
              {STEPS.flatMap((step, i) => {
                const Icon = step.icon
                const card = (
                  <Reveal
                    key={step.num}
                    delay={i * 160}
                    className="group relative flex flex-col border border-border bg-card px-8 py-10 transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:bg-primary/[0.025]"
                  >
                    {/* Top accent bar */}
                    <div className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary to-teal-400 transition-transform duration-300 group-hover:scale-x-100" />

                    {/* Step badge */}
                    <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center bg-primary text-[10px] font-black text-primary-foreground">
                      {step.num}
                    </span>

                    {/* Icon container */}
                    <div className="mb-8 flex h-[72px] w-[72px] items-center justify-center border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-all duration-300 group-hover:border-primary/35 group-hover:from-primary/20 group-hover:to-primary/10">
                      <Icon size={32} weight="duotone" />
                    </div>

                    <h3 className="mb-3 font-bold text-xl">{step.title}</h3>
                    <p className="mb-auto text-sm leading-relaxed text-muted-foreground">{step.description}</p>

                    {/* Live example badge */}
                    <div className="mt-8 inline-flex items-center gap-1.5 border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                      <CheckCircle size={11} weight="fill" />
                      {step.detail}
                    </div>
                  </Reveal>
                )

                if (i === STEPS.length - 1) return [card]

                const connector = (
                  <div key={`connector-${i}`} className="flex flex-col items-center justify-center gap-1.5">
                    <div className="h-px w-5 bg-border" />
                    <ArrowRight size={14} weight="bold" className="text-primary/50" />
                  </div>
                )

                return [card, connector]
              })}
            </div>

            {/* ── Mobile: stacked with vertical arrows ── */}
            <div className="flex flex-col md:hidden">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={step.num}>
                    <Reveal
                      delay={i * 150}
                      className="group relative flex flex-col border border-border bg-card px-7 py-9 transition-all duration-300"
                    >
                      {/* Top accent bar */}
                      <div className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-primary to-teal-400 transition-transform duration-300 group-hover:scale-x-100" />

                      {/* Step badge */}
                      <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center bg-primary text-[10px] font-black text-primary-foreground">
                        {step.num}
                      </span>

                      {/* Icon */}
                      <div className="mb-5 flex h-14 w-14 items-center justify-center border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
                        <Icon size={26} weight="duotone" />
                      </div>

                      <h3 className="mb-2 font-bold text-lg">{step.title}</h3>
                      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>

                      <div className="inline-flex items-center gap-1.5 border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                        <CheckCircle size={11} weight="fill" />
                        {step.detail}
                      </div>
                    </Reveal>

                    {i < STEPS.length - 1 && (
                      <div className="flex h-12 items-center justify-center">
                        <ArrowDown size={18} className="text-primary/40" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── FULL FEATURE LIST ────────────────────────────────────────────────── */}
        <section className="border-t border-border bg-muted/20 py-24">
          <div className="mx-auto max-w-[1400px] px-5 md:px-12 xl:px-20">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

              {/* Left: title + CTA */}
              <Reveal>
                <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-primary">Everything included</p>
                <h2 className="mb-4 font-black text-3xl sm:text-4xl">
                  Every feature.<br />Zero paywalls.
                </h2>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  We don&apos;t have a paid plan. There&apos;s nothing to unlock.
                  Everything listed here is yours from the moment you sign up.
                </p>
                <Link href="/login" className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  Start free today <ArrowRight size={14} weight="bold" />
                </Link>
              </Reveal>

              {/* Right: grouped feature columns */}
              <div className="grid gap-6 sm:grid-cols-3">
                {FEATURE_GROUPS.map((group, i) => {
                  const Icon = group.icon
                  return (
                    <Reveal key={group.label} delay={150 + i * 120}>
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary/10 text-primary">
                          <Icon size={14} weight="duotone" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-eyebrow text-foreground">{group.label}</span>
                      </div>
                      <ul className="space-y-2">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <CheckCircle size={13} weight="fill" className="shrink-0 text-primary" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Reveal>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ────────────────────────────────────────────────────── */}
        <section className="relative overflow-clip bg-gradient-to-b from-background to-muted/40 py-28">
          {/* Soft teal glows + faint grid — echoes the Hero/Product Preview treatment, toned for a light section */}
          <div
            className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px]"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,.14) 0%, transparent 70%)', filter: 'blur(20px)' }}
          />
          <div
            className="pointer-events-none absolute -right-32 bottom-0 h-[420px] w-[420px]"
            style={{ background: 'radial-gradient(circle, rgba(13,148,136,.12) 0%, transparent 70%)', filter: 'blur(20px)' }}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)',
              backgroundSize: '52px 52px',
            }}
          />

          {/* Subtle floating decorations */}
          <CalendarCheck size={28} weight="duotone" className="pointer-events-none absolute left-[8%] top-[18%] hidden text-primary/10 sm:block" />
          <Bell size={24} weight="duotone" className="pointer-events-none absolute right-[10%] top-[28%] hidden text-primary/10 lg:block" />
          <CheckCircle size={26} weight="duotone" className="pointer-events-none absolute bottom-[14%] left-[12%] hidden text-primary/10 lg:block" />

          <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 xl:px-20">
            <Reveal className="mb-14 text-center">
              <p className="mb-3 text-xs font-black uppercase tracking-eyebrow text-primary">Testimonials</p>
              <h2 className="font-black text-3xl sm:text-4xl lg:text-5xl">
                Trusted by teams that<br className="hidden sm:block" /> schedule smarter.
              </h2>

              {/* Rating bar */}
              <div className="mt-6 inline-flex items-center gap-4 border border-border bg-background px-6 py-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} weight="fill" className="text-primary" />
                  ))}
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm font-bold text-foreground">4.9 / 5</span>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm text-muted-foreground">Based on 10,000+ bookings</span>
              </div>
            </Reveal>

            <Reveal delay={150}>
              <TestimonialCarousel items={TESTIMONIALS} />
            </Reveal>
          </div>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
        <section id="faq" className="relative overflow-hidden border-t border-border bg-background py-24 lg:py-32">
          <div className="relative mx-auto max-w-[1400px] px-5 md:px-12 xl:px-20">
            <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-2 lg:gap-20">

              {/* ── Left: product UI preview — dark card on white bg ── */}
              <Reveal className="lg:sticky lg:top-28">
                <div className="relative">
                  {/* Soft teal glow — reduced opacity for light background */}
                  <div className="pointer-events-none absolute -inset-6 bg-primary/[0.06] blur-3xl" />
                  {/* Explicit dark bg so it reads as real product UI */}
                  <div
                    className="relative border p-6"
                    style={{ background: 'linear-gradient(145deg, #0d2018, #091512)', borderColor: 'rgba(255,255,255,0.09)' }}
                  >

                    {/* Host row */}
                    <div className="mb-5 flex items-center gap-3 border-b border-white/[0.08] pb-5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary text-sm font-bold text-white">
                        D
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Dhruti Hirapara</p>
                        <p className="text-xs text-white/40">30-Minute Meeting</p>
                      </div>
                    </div>

                    {/* Mini calendar */}
                    <div className="mb-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">July 2026</p>
                        <div className="flex gap-1">
                          <div className="h-5 w-5 border border-white/10 bg-white/5" />
                          <div className="h-5 w-5 border border-white/10 bg-white/5" />
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['M','T','W','T','F','S','S'].map((d, i) => (
                          <span key={i} className="py-1 text-[10px] font-semibold text-white/25">{d}</span>
                        ))}
                        {[null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map((d, i) => (
                          <div
                            key={i}
                            className={[
                              'flex h-7 w-full items-center justify-center text-[11px] font-medium transition-colors',
                              d === null ? '' :
                              d === 10 ? 'bg-primary text-white font-bold' :
                              [7,8,14,15,21,22,28,29].includes(d as number) ? 'text-white/20' :
                              d && d < 7 ? 'text-white/20' :
                              'cursor-pointer text-white/70 hover:bg-white/10',
                            ].join(' ')}
                          >
                            {d ?? ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div>
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/35">Available Times</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { t: '9:00 AM',  active: false },
                          { t: '10:30 AM', active: true  },
                          { t: '1:00 PM',  active: false },
                          { t: '3:30 PM',  active: false },
                        ].map(({ t, active }) => (
                          <div
                            key={t}
                            className={[
                              'py-2.5 text-center text-xs font-semibold border transition-colors',
                              active
                                ? 'border-primary bg-primary text-white'
                                : 'border-white/[0.12] bg-white/[0.05] text-white/60',
                            ].join(' ')}
                          >
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Powered by badge */}
                    <div className="mt-5 border-t border-white/[0.06] pt-4 text-center">
                      <span className="text-[10px] text-white/25">Scheduling powered by <span className="text-primary/60 font-semibold">Schduled</span></span>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* ── Right: FAQ accordion on white background ── */}
              <Reveal delay={100}>
                <p className="mb-3 text-[11px] font-black uppercase tracking-eyebrow text-primary">FAQ</p>
                <h2 className="mb-8 font-black text-3xl leading-tight text-foreground sm:text-4xl">
                  Frequently Asked<br className="hidden sm:block" /> Questions
                </h2>
                <FaqAccordion items={FAQ_ITEMS} variant="light" />
                <p className="mt-6 text-sm text-muted-foreground">
                  Still have questions?{' '}
                  <a href={`mailto:${env.NEXT_PUBLIC_CONTACT_EMAIL}`} className="text-primary transition-colors hover:underline">
                    Contact us
                  </a>
                </p>
              </Reveal>

            </div>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-clip py-36" style={DARK_BG}>
          <div className="pointer-events-none absolute inset-0 opacity-[0.038]"
            style={{ backgroundImage: 'linear-gradient(rgba(20,184,166,1) 1px,transparent 1px),linear-gradient(90deg,rgba(20,184,166,1) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
          {/* Large glow behind title */}
          <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[700px] animate-schduled-glow-pulse"
            style={{ background: 'radial-gradient(ellipse,rgba(20,184,166,.30) 0%,transparent 65%)', filter: 'blur(16px)', opacity: 0.9 }} />

          <div className="relative mx-auto max-w-[1400px] px-5 text-center md:px-12 xl:px-20">
            <div className="mx-auto max-w-2xl">
            <Reveal>
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
            </Reveal>
            <Reveal delay={150} className="mt-10 flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/login" className="relative inline-flex items-center gap-2 overflow-hidden bg-primary px-9 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  <span className="animate-schduled-sheen pointer-events-none absolute inset-0"
                    style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,.22) 50%,transparent 60%)', backgroundSize: '200% auto' }} />
                  Start Free
                  <ArrowRight size={16} weight="bold" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 border border-white/20 px-9 py-4 text-base font-semibold text-white/75 transition-all hover:border-white/40 hover:text-white">
                  View Demo
                </a>
              </div>

              {/* Checkmarks */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                {['Free forever', 'No credit card', 'Setup in 30 seconds'].map((item) => (
                  <span key={item} className="flex items-center gap-1.5 text-sm text-white/35">
                    <CheckCircle size={13} weight="fill" className="text-teal-400/60 shrink-0" />
                    {item}
                  </span>
                ))}
              </div>

              {/* Animated down arrow */}
              <div className="mt-4 animate-bounce text-white/20">
                <ArrowDown size={22} />
              </div>
            </Reveal>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <LandingFooter />
    </div>
  )
}
