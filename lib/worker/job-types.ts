export const JOB_NAMES = {
  // ── Email ────────────────────────────────────────────────────────────────
  EMAIL_SEND:         "email.send",
  EMAIL_OUTBOX_REAP:  "email.outbox-reap",
  EMAIL_EVENTS_PRUNE: "email.events-prune",

  // ── Booking lifecycle ────────────────────────────────────────────────────
  VIDEO_LINK_GENERATE:         "booking.video-link-generate",
  VIDEO_LINK_RETRY:            "booking.video-link-retry",
  CALENDAR_WRITE:              "booking.calendar-write",
  BOOKING_REMINDER_24H:        "booking.reminder-24h",
  BOOKING_REMINDER_1H:         "booking.reminder-1h",
  BOOKING_CANCEL_REMINDERS:    "booking.cancel-reminders",
  CALENDAR_CANCEL:             "booking.calendar-cancel",
  BOOKING_RESCHEDULE_REMINDERS: "booking.reschedule-reminders",
  CALENDAR_UPDATE:             "booking.calendar-update",

  // ── Calendar integrations ─────────────────────────────────────────────
  CALENDAR_SYNC:              "calendar.sync",
  CALENDAR_TOKEN_REFRESH:     "calendar.token-refresh",
  CALENDAR_DISCONNECT_ALERT:  "calendar.disconnect-alert",

  // ── Platform ─────────────────────────────────────────────────────────
  SCAFFOLD_HEALTHCHECK: "scaffold.healthcheck",
} as const

export type JobName = (typeof JOB_NAMES)[keyof typeof JOB_NAMES]

// ── Payload types ─────────────────────────────────────────────────────────

export interface EmailSendPayload {
  outboxId: string
}

export interface VideoLinkGeneratePayload {
  bookingId: string
}

export interface VideoLinkRetryPayload {
  bookingId: string
  attempt:   number
}

export interface CalendarWritePayload {
  bookingId: string
}

export interface CalendarCancelPayload {
  bookingId: string
}

export interface CalendarUpdatePayload {
  bookingId: string
}

export interface BookingReminderPayload {
  bookingId: string
}

export interface BookingCancelRemindersPayload {
  bookingId: string
}

export interface BookingRescheduleRemindersPayload {
  bookingId:    string
  newStartTime: string
  newEndTime:   string
}

export interface CalendarSyncPayload {
  connectedCalendarId: string
}

export interface CalendarTokenRefreshPayload {
  connectedCalendarId: string
}

export interface CalendarDisconnectAlertPayload {
  connectedCalendarId: string
  userId:              string
}

export type JobPayloads = {
  [JOB_NAMES.EMAIL_SEND]:                  EmailSendPayload
  [JOB_NAMES.EMAIL_OUTBOX_REAP]:           Record<string, never>
  [JOB_NAMES.EMAIL_EVENTS_PRUNE]:          Record<string, never>
  [JOB_NAMES.VIDEO_LINK_GENERATE]:         VideoLinkGeneratePayload
  [JOB_NAMES.VIDEO_LINK_RETRY]:            VideoLinkRetryPayload
  [JOB_NAMES.CALENDAR_WRITE]:              CalendarWritePayload
  [JOB_NAMES.BOOKING_REMINDER_24H]:        BookingReminderPayload
  [JOB_NAMES.BOOKING_REMINDER_1H]:         BookingReminderPayload
  [JOB_NAMES.BOOKING_CANCEL_REMINDERS]:    BookingCancelRemindersPayload
  [JOB_NAMES.CALENDAR_CANCEL]:             CalendarCancelPayload
  [JOB_NAMES.BOOKING_RESCHEDULE_REMINDERS]: BookingRescheduleRemindersPayload
  [JOB_NAMES.CALENDAR_UPDATE]:             CalendarUpdatePayload
  [JOB_NAMES.CALENDAR_SYNC]:              CalendarSyncPayload
  [JOB_NAMES.CALENDAR_TOKEN_REFRESH]:     CalendarTokenRefreshPayload
  [JOB_NAMES.CALENDAR_DISCONNECT_ALERT]:  CalendarDisconnectAlertPayload
  [JOB_NAMES.SCAFFOLD_HEALTHCHECK]:       Record<string, never>
}
