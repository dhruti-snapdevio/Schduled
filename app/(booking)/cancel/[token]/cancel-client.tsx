"use client";

import {
  CalendarX,
  CheckCircle,
  Spinner,
  Warning,
} from "@phosphor-icons/react";
import { formatInTimeZone } from "date-fns-tz";
import { useState } from "react";

interface Props {
  alreadyCancelled: boolean;
  eventName: string;
  hostName: string;
  inviteeName: string;
  inviteeTimezone: string;
  isPast: boolean;
  startUtc: string;
  token: string;
}

const DATE_FMT = "EEEE, MMMM d, yyyy 'at' h:mm a";

export function CancelClient(props: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(props.alreadyCancelled);
  const [error, setError] = useState<string | null>(null);

  const when = formatInTimeZone(
    new Date(props.startUtc),
    props.inviteeTimezone,
    DATE_FMT
  );

  async function handleCancel() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: props.token,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Could not cancel this booking.");
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F7F6] p-4">
      <div className="w-full max-w-md overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.09)] ring-1 ring-black/[0.05]">
        {done ? (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <CheckCircle className="text-primary" size={48} weight="fill" />
            <h1 className="text-lg font-bold text-gray-900">
              Booking cancelled
            </h1>
            <p className="text-sm text-muted-foreground">
              Your {props.eventName} with {props.hostName} has been cancelled. A
              confirmation email is on its way.
            </p>
          </div>
        ) : props.isPast ? (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <Warning className="text-amber-500" size={48} weight="fill" />
            <h1 className="text-lg font-bold text-gray-900">
              This booking has passed
            </h1>
            <p className="text-sm text-muted-foreground">
              It&apos;s no longer possible to cancel a meeting that has already
              taken place.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-gray-100 bg-[#F8FCFB] px-8 py-6">
              <CalendarX className="text-red-500" size={24} />
              <h1 className="text-base font-bold text-gray-900">
                Cancel this booking?
              </h1>
            </div>
            <div className="px-8 py-6">
              <div className="mb-5 border border-gray-200 bg-[#F8FCFB] p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {props.eventName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  with {props.hostName}
                </p>
                <p className="mt-2 text-xs text-gray-600">{when}</p>
                <p className="text-[11px] text-muted-foreground">
                  {props.inviteeTimezone}
                </p>
              </div>

              <label
                className="mb-1.5 block text-[11px] font-semibold text-gray-600"
                htmlFor="cancel-reason"
              >
                Reason (optional)
              </label>
              <textarea
                className="w-full resize-none border border-input bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
                id="cancel-reason"
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let the host know why you're cancelling…"
                rows={3}
                value={reason}
              />

              {error && (
                <p className="mt-3 text-[12px] text-destructive">{error}</p>
              )}

              <button
                className="mt-5 flex h-11 w-full items-center justify-center gap-2 bg-red-500 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-60"
                disabled={submitting}
                onClick={handleCancel}
                type="button"
              >
                {submitting ? (
                  <>
                    <Spinner className="animate-spin" size={15} />
                    Cancelling…
                  </>
                ) : (
                  "Cancel booking"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
