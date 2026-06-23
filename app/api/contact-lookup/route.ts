import { NextResponse } from 'next/server'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user, booking, contact } from '@/db/schema'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const email    = searchParams.get('email')

  if (!username || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ found: false })
  }

  // Resolve host userId from username
  const [host] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)

  if (!host) return NextResponse.json({ found: false })

  // Check contact record for name
  const [contactRow] = await db
    .select({ name: contact.name })
    .from(contact)
    .where(and(eq(contact.hostUserId, host.id), eq(contact.email, email)))
    .limit(1)

  // Check most recent booking for phone
  const [lastBooking] = await db
    .select({ phone: booking.inviteePhone, name: booking.inviteeName })
    .from(booking)
    .where(and(eq(booking.hostUserId, host.id), eq(booking.inviteeEmail, email)))
    .orderBy(desc(booking.createdAt))
    .limit(1)

  const name  = contactRow?.name || lastBooking?.name || null
  const phone = lastBooking?.phone || null

  if (!name && !phone) return NextResponse.json({ found: false })

  return NextResponse.json({ found: true, name, phone })
}
