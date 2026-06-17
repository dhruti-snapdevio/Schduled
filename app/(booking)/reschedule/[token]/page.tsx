import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { and, eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { availabilitySchedule, booking, eventType, user } from "@/db/schema";
import { db } from "@/lib/db";
import { RescheduleClient } from "./reschedule-client";

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

  const invalid = !b?.hostUsername;
  if (invalid) {
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
