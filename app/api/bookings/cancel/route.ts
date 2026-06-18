import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { booking } from "@/db/schema";
import { db } from "@/lib/db";
import { enqueueJob } from "@/lib/worker/enqueue";
import { JOB_NAMES } from "@/lib/worker/job-types";

interface CancelBody {
  reason?: string;
  token: string;
}

export async function POST(request: Request) {
  try {
    const body: CancelBody = await request.json();
    const { token, reason } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Missing cancellation token" },
        { status: 400 }
      );
    }

    const [b] = await db
      .select({
        id: booking.id,
        status: booking.status,
        startTime: booking.startTime,
      })
      .from(booking)
      .where(eq(booking.cancelToken, token))
      .limit(1);

    if (!b) {
      return NextResponse.json(
        { error: "This cancellation link is invalid." },
        { status: 404 }
      );
    }

    if (b.status === "cancelled") {
      return NextResponse.json({ ok: true, alreadyCancelled: true });
    }

    if (new Date(b.startTime).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This booking has already taken place." },
        { status: 409 }
      );
    }

    await db
      .update(booking)
      .set({
        status: "cancelled",
        cancellationReason: reason?.trim() || null,
        cancelledBy: "invitee",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(booking.id, b.id));

    // Fire async side-effects: emails + in-app notification, calendar delete,
    // reminder cancellation. Enqueue failures must not fail the cancellation.
    await Promise.allSettled([
      enqueueJob(JOB_NAMES.BOOKING_CANCELLATION, { bookingId: b.id }),
      enqueueJob(JOB_NAMES.CALENDAR_CANCEL, { bookingId: b.id }),
      enqueueJob(JOB_NAMES.BOOKING_CANCEL_REMINDERS, { bookingId: b.id }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/bookings/cancel]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
