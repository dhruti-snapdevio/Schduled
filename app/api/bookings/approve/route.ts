import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { booking } from "@/db/schema";
import { db } from "@/lib/db";
import { checkRateLimit, jsonError, rateLimitKey } from "@/lib/api/helpers";
import { enqueueJob } from "@/lib/worker/enqueue";
import { JOB_NAMES } from "@/lib/worker/job-types";

interface ApproveBody {
  token: string;
}

export async function POST(request: Request) {
  try {
    if (!checkRateLimit(rateLimitKey("POST:/api/bookings/approve", request), 20, 60_000)) {
      return jsonError("Too many requests. Please wait a moment.", 429);
    }

    const body: ApproveBody = await request.json();
    const { token } = body;

    if (!token) return jsonError("Missing approval token", 400);

    const [b] = await db
      .select({
        id: booking.id,
        status: booking.status,
        startTime: booking.startTime,
      })
      .from(booking)
      .where(eq(booking.approvalToken, token))
      .limit(1);

    if (!b) return jsonError("This approval link is invalid.", 404);

    if (b.status === "confirmed") {
      return NextResponse.json({ ok: true, alreadyApproved: true });
    }

    if (b.status !== "pending") {
      return jsonError("This booking cannot be approved.", 409);
    }

    if (new Date(b.startTime).getTime() < Date.now()) {
      return jsonError("This booking has already taken place.", 409);
    }

    await db
      .update(booking)
      .set({
        status: "confirmed",
        updatedAt: new Date(),
      })
      .where(eq(booking.id, b.id));

    await Promise.allSettled([
      enqueueJob(JOB_NAMES.BOOKING_APPROVED, { bookingId: b.id }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/bookings/approve]", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
