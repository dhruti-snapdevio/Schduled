import type { Metadata } from "next";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { and, eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { availabilitySchedule, booking, cancellationPolicy, eventType, user } from "@/db/schema";
import { db } from "@/lib/db";
import { RescheduleClient } from "./reschedule-client";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [b] = await db
    .select({
      id: booking.id,
      status: booking.status,
      startTime: booking.startTime,
      duration: booking.duration,
      eventTypeId: booking.eventTypeId,
      inviteeTimezone: booking.inviteeTimezone,
      etName: eventType.name,
      etSlug: eventType.slug,
      etUserId: eventType.userId,
      bookingWindow: eventType.bookingWindow,
      availabilityScheduleId: eventType.availabilityScheduleId,
      hostName: user.name,
      hostUsername: user.username,
    })
    .from(booking)
    .innerJoin(eventType, eq(eventType.id, booking.eventTypeId))
    .innerJoin(user, eq(user.id, booking.hostUserId))
    .where(eq(booking.rescheduleToken, token))
    .limit(1);

  if (!b?.hostUsername) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            This reschedule link is invalid or has expired.
          </CardContent>
        </Card>
      </main>
    );
  }

  if (b.status === "cancelled") {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            This booking has been cancelled and can no longer be rescheduled.
          </CardContent>
        </Card>
      </main>
    );
  }

  if (b.startTime < new Date()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            This meeting has already passed and can no longer be rescheduled.
          </CardContent>
        </Card>
      </main>
    );
  }

  // Enforce reschedule policy before showing the UI — no late 403 surprises
  const [reschedulePolicy] = await db
    .select({
      allowRescheduling:     cancellationPolicy.allowRescheduling,
      rescheduleCutoffHours: cancellationPolicy.rescheduleCutoffHours,
    })
    .from(cancellationPolicy)
    .where(eq(cancellationPolicy.eventTypeId, b.eventTypeId))
    .limit(1);

  if (reschedulePolicy && !reschedulePolicy.allowRescheduling) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Rescheduling is not allowed for this event type. Please contact the host directly.
          </CardContent>
        </Card>
      </main>
    );
  }

  const cutoff = reschedulePolicy?.rescheduleCutoffHours ?? 0;
  if (cutoff > 0) {
    const hoursUntil = (b.startTime.getTime() - Date.now()) / 3_600_000;
    if (hoursUntil < cutoff) {
      return (
        <main className="mx-auto max-w-lg px-4 py-16">
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Rescheduling must be done at least{" "}
              <strong>{cutoff} hour{cutoff === 1 ? "" : "s"}</strong> before the meeting.
              Please contact the host directly.
            </CardContent>
          </Card>
        </main>
      );
    }
  }

  const schedule = await db.query.availabilitySchedule.findFirst({
    where: b.availabilityScheduleId
      ? and(
          eq(availabilitySchedule.id, b.availabilityScheduleId),
          eq(availabilitySchedule.userId, b.etUserId)
        )
      : and(
          eq(availabilitySchedule.userId, b.etUserId),
          eq(availabilitySchedule.isDefault, true)
        ),
    with: { windows: true },
  });

  const hostTz = schedule?.timezone ?? "UTC";
  const now = new Date();
  const today = formatInTimeZone(now, hostTz, "yyyy-MM-dd");
  const maxDate = formatInTimeZone(
    addDays(now, b.bookingWindow ?? 60),
    hostTz,
    "yyyy-MM-dd"
  );
  const availableDaysOfWeek = Array.from(
    new Set(schedule?.windows.map((w) => w.dayOfWeek) ?? [])
  );

  return (
    <RescheduleClient
      availableDaysOfWeek={availableDaysOfWeek}
      currentStartUtc={b.startTime.toISOString()}
      duration={b.duration ?? 30}
      eventName={b.etName}
      hostName={b.hostName ?? "your host"}
      inviteeTimezone={b.inviteeTimezone}
      maxDate={maxDate}
      slug={b.etSlug}
      today={today}
      token={token}
      username={b.hostUsername!}
    />
  );
}
