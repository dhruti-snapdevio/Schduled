import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { newsletterSubscriber } from '@/db/schema'
import { checkRateLimit, rateLimitKey } from '@/lib/api/helpers'

export async function POST(request: Request) {
  if (!(await checkRateLimit(rateLimitKey('POST:/api/newsletter', request), 5, 60_000))) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  let email: string
  try {
    const body = await request.json()
    email = (body.email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const existing = await db
    .select({ id: newsletterSubscriber.id })
    .from(newsletterSubscriber)
    .where(eq(newsletterSubscriber.email, email))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ message: 'You\'re already subscribed!' })
  }

  await db.insert(newsletterSubscriber).values({ email })

  return NextResponse.json({ message: 'You\'re subscribed! Thanks for joining.' })
}
