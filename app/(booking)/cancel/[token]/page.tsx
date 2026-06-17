import { eq } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { booking, eventType, user } from "@/db/schema";
import { db } from "@/lib/db";
import { CancelClient } from "./cancel-client";

export default async function CancelPage({
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
      inviteeName: booking.inviteeName,
      inviteeTimezone: booking.inviteeTimezone,
      etName: eventType.name,
      hostName: user.name,
    })
    .from(booking)
    .innerJoin(eventType, eq(eventType.id, booking.eventTypeId))
    .innerJoin(user, eq(user.id, booking.hostUserId))
    .where(eq(booking.cancelToken, token))
    .limit(1);

  if (!b) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            This cancellation link is invalid or has expired.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <CancelClient
      alreadyCancelled={b.status === "cancelled"}
      eventName={b.etName}
      hostName={b.hostName ?? "your host"}
      inviteeName={b.inviteeName}
      inviteeTimezone={b.inviteeTimezone}
      isPast={new Date(b.startTime).getTime() < Date.now()}
      startUtc={b.startTime.toISOString()}
      token={token}
    />
  );
}
