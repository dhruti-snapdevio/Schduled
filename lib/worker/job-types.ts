export const JOB_NAMES = {
  // ── Email ────────────────────────────────────────────────────────────────
  EMAIL_SEND: "email.send",
  EMAIL_OUTBOX_REAP: "email.outbox-reap",
  EMAIL_EVENTS_PRUNE: "email.events-prune",

  // ── Booking lifecycle ────────────────────────────────────────────────────
  VIDEO_LINK_GENERATE: "booking.video-link-generate",
  CALENDAR_WRITE: "booking.calendar-write",
  BOOKING_CONFIRMATION: "booking.confirmation",
  BOOKING_REMINDER_24H: "booking.reminder-24h",
  BOOKING_REMINDER_1H: "booking.reminder-1h",
  BOOKING_CANCEL_REMINDERS: "booking.cancel-reminders",
  BOOKING_CANCELLATION: "booking.cancellation",
  CALENDAR_CANCEL: "booking.calendar-cancel",
  BOOKING_RESCHEDULE_REMINDERS: "booking.reschedule-reminders",
  BOOKING_RESCHEDULE_NOTIFY: "booking.reschedule-notify",
  CALENDAR_UPDATE: "booking.calendar-update",

  // ── Calendar integrations ─────────────────────────────────────────────
  CALENDAR_SYNC: "calendar.sync",
  CALENDAR_TOKEN_REFRESH: "calendar.token-refresh",
  CALENDAR_DISCONNECT_ALERT: "calendar.disconnect-alert",

  // ── Platform ─────────────────────────────────────────────────────────
  SCAFFOLD_HEALTHCHECK: "scaffold.healthcheck",
} as const;

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES];

// ── Payload types ─────────────────────────────────────────────────────────

export interface EmailSendPayload {
  outboxId: string;
}

export interface VideoLinkGeneratePayload {
  bookingId: string;
}


export interface CalendarWritePayload {
  bookingId: string;
}

export interface CalendarCancelPayload {
  bookingId: string;
}

export interface CalendarUpdatePayload {
  bookingId: string;
}

export interface BookingConfirmationPayload {
  bookingId: string;
}

export interface BookingCancellationPayload {
  bookingId: string;
}

export interface BookingRescheduleNotifyPayload {
  bookingId: string;
  previousStartUtc: string; // ISO — the time before reschedule
}

export interface BookingReminderPayload {
  bookingId: string;
  bookingStartUtc: string; // ISO — used to detect reschedule; skip if booking.startTime has changed
}

export interface BookingCancelRemindersPayload {
  bookingId: string;
}

export interface BookingRescheduleRemindersPayload {
  bookingId: string;
  newEndTime: string;
  newStartTime: string;
}

export interface CalendarSyncPayload {
  connectedCalendarId: string;
}

export interface CalendarTokenRefreshPayload {
  connectedCalendarId: string;
}

export interface CalendarDisconnectAlertPayload {
  connectedCalendarId: string;
  userId: string;
}

export type JobPayloads = {
  [JOB_NAMES.EMAIL_SEND]: EmailSendPayload;
  [JOB_NAMES.EMAIL_OUTBOX_REAP]: Record<string, never>;
  [JOB_NAMES.EMAIL_EVENTS_PRUNE]: Record<string, never>;
  [JOB_NAMES.VIDEO_LINK_GENERATE]: VideoLinkGeneratePayload;
  [JOB_NAMES.CALENDAR_WRITE]: CalendarWritePayload;
  [JOB_NAMES.BOOKING_CONFIRMATION]: BookingConfirmationPayload;
  [JOB_NAMES.BOOKING_REMINDER_24H]: BookingReminderPayload;
  [JOB_NAMES.BOOKING_REMINDER_1H]: BookingReminderPayload;
  [JOB_NAMES.BOOKING_CANCEL_REMINDERS]: BookingCancelRemindersPayload;
  [JOB_NAMES.BOOKING_CANCELLATION]: BookingCancellationPayload;
  [JOB_NAMES.CALENDAR_CANCEL]: CalendarCancelPayload;
  [JOB_NAMES.BOOKING_RESCHEDULE_REMINDERS]: BookingRescheduleRemindersPayload;
  [JOB_NAMES.BOOKING_RESCHEDULE_NOTIFY]: BookingRescheduleNotifyPayload;
  [JOB_NAMES.CALENDAR_UPDATE]: CalendarUpdatePayload;
  [JOB_NAMES.CALENDAR_SYNC]: CalendarSyncPayload;
  [JOB_NAMES.CALENDAR_TOKEN_REFRESH]: CalendarTokenRefreshPayload;
  [JOB_NAMES.CALENDAR_DISCONNECT_ALERT]: CalendarDisconnectAlertPayload;
  [JOB_NAMES.SCAFFOLD_HEALTHCHECK]: Record<string, never>;
};
