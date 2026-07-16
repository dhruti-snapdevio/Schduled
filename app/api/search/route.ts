import { and, eq, ilike, or } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { booking, contact, eventType } from "@/db/schema";
import { auth } from "@/lib/auth";
import { checkRateLimit, rateLimitKey } from "@/lib/api/helpers";
import { db } from "@/lib/db";

const RESULT_LIMIT = 5;

export async function GET(request: Request) {
  const requestHeaders = await headers();
  const current = await auth.api.getSession({ headers: requestHeaders });
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await checkRateLimit(rateLimitKey("GET:/api/search", request), 30, 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ bookings: [], contacts: [], eventTypes: [] });
  }

  const hostUserId = current.user.id;
  const like = `%${q}%`;

  const [bookingRows, contactRows, eventTypeRows] = await Promise.all([
    db
      .select({
        id: booking.id,
        inviteeName: booking.inviteeName,
        inviteeEmail: booking.inviteeEmail,
        startTime: booking.startTime,
      })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, hostUserId),
          or(ilike(booking.inviteeName, like), ilike(booking.inviteeEmail, like)),
        ),
      )
      .limit(RESULT_LIMIT),
    db
      .select({ id: contact.id, name: contact.name, email: contact.email })
      .from(contact)
      .where(
        and(
          eq(contact.hostUserId, hostUserId),
          eq(contact.isArchived, false),
          or(ilike(contact.name, like), ilike(contact.email, like)),
        ),
      )
      .limit(RESULT_LIMIT),
    db
      .select({ id: eventType.id, name: eventType.name, slug: eventType.slug })
      .from(eventType)
      .where(
        and(
          eq(eventType.userId, hostUserId),
          or(ilike(eventType.name, like), ilike(eventType.slug, like)),
        ),
      )
      .limit(RESULT_LIMIT),
  ]);

  return NextResponse.json({
    bookings: bookingRows.map((b) => ({ ...b, startTime: b.startTime.toISOString() })),
    contacts: contactRows,
    eventTypes: eventTypeRows,
  });
}
