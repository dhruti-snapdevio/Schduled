import { and, eq } from "drizzle-orm";
import type { Job } from "pg-boss";
import { booking, eventType, videoConnection } from "@/db/schema";
import { db } from "@/lib/db";
import type { VideoLinkGeneratePayload } from "@/lib/worker/job-types";
import { createZoomMeeting, getValidZoomAccessToken } from "@/lib/zoom/client";

export async function handleVideoLinkGenerate(
  jobs: Job<VideoLinkGeneratePayload>[]
) {
  for (const job of jobs) {
    await processVideoLinkGenerate(job);
  }
}

async function processVideoLinkGenerate(job: Job<VideoLinkGeneratePayload>) {
  const { bookingId } = job.data;

  const [b] = await db
    .select({
      id: booking.id,
      hostUserId: booking.hostUserId,
      inviteeName: booking.inviteeName,
      inviteeTimezone: booking.inviteeTimezone,
      startTime: booking.startTime,
      duration: booking.duration,
      status: booking.status,
      videoLinkHost: booking.videoLinkHost,
      videoLinkInvitee: booking.videoLinkInvitee,
      locationType: eventType.locationType,
      etName: eventType.name,
    })
    .from(booking)
    .innerJoin(eventType, eq(eventType.id, booking.eventTypeId))
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!b) {
    console.warn(`[video-link-generate] booking ${bookingId} not found`);
    return;
  }

  if (b.status === "cancelled") {
    console.log(
      `[video-link-generate] booking ${bookingId} is cancelled — skipping`
    );
    return;
  }

  if (b.locationType === "google_meet") {
    // Google Meet link is created by CALENDAR_WRITE via conferenceData API.
    // If videoLinkHost is already set, nothing more to do.
    if (b.videoLinkHost) {
      console.log(
        `[video-link-generate] booking ${bookingId} already has Meet link — done`
      );
    } else {
      // Calendar write may not have run yet or calendar is not connected.
      console.log(
        `[video-link-generate] booking ${bookingId}: Meet link not yet set (calendar write pending or calendar not connected)`
      );
    }
    return;
  }

  if (b.locationType === "zoom") {
    await generateZoomLink(b);
    return;
  }

  // All other location types (phone, in_person, custom) don't need a video link.
  console.log(
    `[video-link-generate] booking ${bookingId}: locationType=${b.locationType} — no video link needed`
  );
}

async function generateZoomLink(b: {
  id: string;
  hostUserId: string;
  inviteeName: string;
  inviteeTimezone: string;
  startTime: Date;
  duration: number;
  videoLinkInvitee: string | null;
  etName: string;
}) {
  // Already generated (idempotent re-run)
  if (b.videoLinkInvitee) {
    console.log(
      `[video-link-generate] booking ${b.id} already has Zoom link — done`
    );
    return;
  }

  // Find the host's connected Zoom account
  const [conn] = await db
    .select()
    .from(videoConnection)
    .where(
      and(
        eq(videoConnection.userId, b.hostUserId),
        eq(videoConnection.provider, "zoom")
      )
    )
    .limit(1);

  if (!conn) {
    console.log(
      `[video-link-generate] booking ${b.id}: host ${b.hostUserId} has no Zoom connection — skipping`
    );
    return;
  }

  let accessToken: string;
  try {
    accessToken = await getValidZoomAccessToken(conn);
  } catch (err) {
    console.error(
      `[video-link-generate] booking ${b.id}: failed to get Zoom access token:`,
      err
    );
    throw err; // transient (network/refresh) — let pg-boss retry
  }

  try {
    const meeting = await createZoomMeeting(accessToken, {
      topic: `${b.etName} with ${b.inviteeName}`,
      startTimeIso: b.startTime.toISOString(),
      durationMinutes: b.duration,
      timezone: "UTC",
      agenda: `Scheduled via Schduled with ${b.inviteeName}`,
    });

    await db
      .update(booking)
      .set({
        videoLinkHost: meeting.startUrl, // host start link
        videoLinkInvitee: meeting.joinUrl, // invitee join link
        locationValue: meeting.joinUrl,
        updatedAt: new Date(),
      })
      .where(eq(booking.id, b.id));

    console.log(
      `[video-link-generate] booking ${b.id}: created Zoom meeting ${meeting.meetingId}`
    );
  } catch (err) {
    console.error(
      `[video-link-generate] booking ${b.id}: Zoom meeting create failed:`,
      err
    );
    throw err; // let pg-boss retry
  }
}
