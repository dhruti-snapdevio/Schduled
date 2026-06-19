import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { and, asc, eq, gte } from 'drizzle-orm'
import { addDays } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { db } from '@/lib/db'
import {
  user,
  userProfile,
  eventType,
  eventTypeQuestion,
  availabilitySchedule,
  availabilityOverride,
} from '@/db/schema'
import { BookingCalendar } from './_components/booking-calendar'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; eventSlug: string }>
}): Promise<Metadata> {
  const { username, eventSlug } = await params
  const [host] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)
  if (!host) return {}
  const et = await db.query.eventType.findFirst({
    where: and(eq(eventType.userId, host.id), eq(eventType.slug, eventSlug), eq(eventType.isActive, true)),
  })
  if (!et) return {}
  return {
    title: `${et.name} with ${host.name}`,
    description: et.description ?? `Book a ${et.name} with ${host.name}.`,
    openGraph: {
      title: `${et.name} with ${host.name}`,
      description: et.description ?? `Book a ${et.name} with ${host.name} on Schduled.`,
    },
  }
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ username: string; eventSlug: string }>
}) {
  const { username, eventSlug } = await params

  const [host] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      username: user.username,
      jobTitle: userProfile.jobTitle,
      company: userProfile.company,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    .where(eq(user.username, username))
    .limit(1)

  if (!host || !host.username) notFound()

  const et = await db.query.eventType.findFirst({
    where: and(
      eq(eventType.userId, host.id),
      eq(eventType.slug, eventSlug),
      eq(eventType.isActive, true),
    ),
    with: {
      durations: true,
      questions: {
        where: eq(eventTypeQuestion.isActive, true),
        orderBy: [asc(eventTypeQuestion.position)],
      },
    },
  })

  if (!et) notFound()

  const schedule = await db.query.availabilitySchedule.findFirst({
    where: et.availabilityScheduleId
      ? and(
          eq(availabilitySchedule.id, et.availabilityScheduleId),
          eq(availabilitySchedule.userId, host.id),
        )
      : and(
          eq(availabilitySchedule.userId, host.id),
          eq(availabilitySchedule.isDefault, true),
        ),
    with: { windows: true },
  })

  const hostTz = schedule?.timezone ?? 'UTC'
  const now = new Date()
  const today = formatInTimeZone(now, hostTz, 'yyyy-MM-dd')
  const maxDate = formatInTimeZone(addDays(now, et.bookingWindow ?? 60), hostTz, 'yyyy-MM-dd')

  const availableDaysOfWeek = new Set(schedule?.windows.map((w) => w.dayOfWeek) ?? [])

  const overrideRows = await db
    .select({ date: availabilityOverride.date, isBlocked: availabilityOverride.isBlocked })
    .from(availabilityOverride)
    .where(and(
      eq(availabilityOverride.userId, host.id),
      gte(availabilityOverride.date, today),
    ))

  const blockedDates = overrideRows.filter((o) => o.isBlocked).map((o) => o.date)
  const specialDates = overrideRows.filter((o) => !o.isBlocked).map((o) => o.date)

  const sortedDurations = [...et.durations].sort((a, b) => a.duration - b.duration)

  return (
    <BookingCalendar
      host={{
        id: host.id,
        name: host.name,
        image: host.image,
        username: host.username,
        jobTitle: host.jobTitle,
        company: host.company,
      }}
      eventType={{
        id: et.id,
        name: et.name,
        slug: et.slug,
        description: et.description,
        color: et.color ?? '#0d9488',
        durations: sortedDurations.map((d) => ({ duration: d.duration, isDefault: d.isDefault })),
        locationType: et.locationType,
        bookingWindow: et.bookingWindow ?? 60,
        questions: et.questions.map((q) => ({
          id: q.id,
          label: q.label,
          type: q.type,
          isRequired: q.isRequired,
          options: q.options,
          placeholder: q.placeholder,
        })),
      }}
      hostTimezone={hostTz}
      today={today}
      maxDate={maxDate}
      availableDaysOfWeek={Array.from(availableDaysOfWeek)}
      blockedDates={blockedDates}
      specialDates={specialDates}
    />
  )
}
