"use client";

import {
  Check,
  CheckCircle,
  Spinner,
  Warning,
  X,
} from "@phosphor-icons/react";
import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useRef, useState } from "react";

interface Props {
  approvalToken: string;
  bookingStatus: string;
  eventName: string;
  hostName: string;
  hostTimezone: string;
  inviteeEmail: string;
  inviteeName: string;
  isPast: boolean;
  isAlreadyActioned: boolean;
  initialAction?: "approve" | null;
  startUtc: string;
  locationLabel: string;
}

const DATE_FMT = "EEEE, MMMM d, yyyy 'at' h:mm a";

export function ReviewClient(props: Props) {
  const autoApproving = !props.isAlreadyActioned && props.initialAction === "approve";

  function initialView(): "main" | "reject" | "approved" | "rejected" {
    if (!props.isAlreadyActioned) return "main";
    if (props.bookingStatus === "cancelled") return "rejected";
    return "approved";
  }

  const [view, setView] = useState<"main" | "reject" | "approved" | "rejected">(initialView);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(autoApproving);
  const [error, setError] = useState<string | null>(null);
  const didAutoApprove = useRef(false);

  // Auto-approve when host clicks the "Approve" link directly from email
  useEffect(() => {
    if (autoApproving && !didAutoApprove.current) {
      didAutoApprove.current = true;
      handleApprove();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const when = formatInTimeZone(new Date(props.startUtc), props.hostTimezone, DATE_FMT);

  async function handleApprove() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: props.approvalToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not approve this booking.");
        return;
      }
      setView("approved");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: props.approvalToken,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not decline this booking.");
        return;
      }
      setView("rejected");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Booking card shared across views
  const BookingCard = () => (
    <div className="mb-5 border border-gray-200 bg-[#F8FCFB] p-4">
      <p className="text-sm font-semibold text-gray-900">{props.eventName}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        with {props.inviteeName} ({props.inviteeEmail})
      </p>
      <p className="mt-2 text-xs text-gray-600">{when}</p>
      <p className="text-[11px] text-muted-foreground">{props.hostTimezone}</p>
      <p className="mt-1 text-xs text-gray-600">{props.locationLabel}</p>
    </div>
  );

  // Show spinner while auto-approving from email link (prevents flash of main view)
  if (autoApproving && view === "main") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F7F6] p-4">
        <div className="w-full max-w-md overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.09)] ring-1 ring-black/[0.05]">
          <div className="flex flex-col items-center gap-4 px-5 sm:px-8 py-14 text-center">
            <Spinner className="animate-spin text-primary" size={40} />
            <p className="text-sm font-medium text-gray-700">Approving booking…</p>
          </div>
        </div>
      </main>
    );
  }

  if (props.isPast) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F7F6] p-4">
        <div className="w-full max-w-md overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.09)] ring-1 ring-black/[0.05]">
          <div className="flex flex-col items-center gap-4 px-5 sm:px-8 py-12 text-center">
            <Warning className="text-amber-500" size={48} weight="fill" />
            <h1 className="text-lg font-bold text-gray-900">This booking has passed</h1>
            <p className="text-sm text-muted-foreground">
              It&apos;s no longer possible to approve or decline a past booking.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (view === "approved") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F7F6] p-4">
        <div className="w-full max-w-md overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.09)] ring-1 ring-black/[0.05]">
          <div className="flex flex-col items-center gap-4 px-5 sm:px-8 py-12 text-center">
            <CheckCircle className="text-primary" size={48} weight="fill" />
            <h1 className="text-lg font-bold text-gray-900">Booking approved</h1>
            <p className="text-sm text-muted-foreground">
              {props.inviteeName} will receive a confirmation email with the
              booking details.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (view === "rejected") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F7F6] p-4">
        <div className="w-full max-w-md overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.09)] ring-1 ring-black/[0.05]">
          <div className="flex flex-col items-center gap-4 px-5 sm:px-8 py-12 text-center">
            <CheckCircle className="text-gray-400" size={48} weight="fill" />
            <h1 className="text-lg font-bold text-gray-900">Booking declined</h1>
            <p className="text-sm text-muted-foreground">
              {props.inviteeName} will be notified that their booking request was
              declined.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (view === "reject") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F7F6] p-4">
        <div className="w-full max-w-md overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.09)] ring-1 ring-black/[0.05]">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-[#F8FCFB] px-5 sm:px-8 py-6">
            <X className="text-red-500" size={24} weight="bold" />
            <h1 className="text-base font-bold text-gray-900">Decline this booking?</h1>
          </div>
          <div className="px-5 sm:px-8 py-6">
            <BookingCard />

            <label
              className="mb-1.5 block text-[11px] font-semibold text-gray-600"
              htmlFor="reject-reason"
            >
              Reason for declining (optional)
            </label>
            <textarea
              className="w-full resize-none border border-input bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15"
              id="reject-reason"
              onChange={(e) => setReason(e.target.value)}
              placeholder="Let the invitee know why you're declining…"
              rows={3}
              value={reason}
            />

            {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                className="flex h-11 flex-1 items-center justify-center border border-gray-200 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-60"
                disabled={submitting}
                onClick={() => setView("main")}
                type="button"
              >
                Back
              </button>
              <button
                className="flex h-11 flex-1 items-center justify-center gap-2 bg-red-500 text-sm font-bold text-white transition-all hover:bg-red-600 disabled:opacity-60"
                disabled={submitting}
                onClick={handleReject}
                type="button"
              >
                {submitting ? (
                  <>
                    <Spinner className="animate-spin" size={15} />
                    Declining…
                  </>
                ) : (
                  "Confirm decline"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3F7F6] p-4">
      <div className="w-full max-w-md overflow-hidden bg-white shadow-[0_4px_40px_rgba(0,0,0,0.09)] ring-1 ring-black/[0.05]">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-[#F8FCFB] px-5 sm:px-8 py-6">
          <span className="flex size-7 items-center justify-center bg-amber-100 text-amber-600">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4.5zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
            </svg>
          </span>
          <h1 className="text-base font-bold text-gray-900">Review booking request</h1>
        </div>

        <div className="px-5 sm:px-8 py-6">
          <p className="mb-5 text-sm text-gray-600">
            <strong>{props.inviteeName}</strong> has requested to book time with you.
            Review the details below and approve or decline.
          </p>

          <BookingCard />

          {error && <p className="mb-4 text-[12px] text-destructive">{error}</p>}

          <div className="flex gap-3">
            <button
              className="flex h-11 flex-1 items-center justify-center gap-2 bg-red-50 border border-red-200 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 disabled:opacity-60"
              disabled={submitting}
              onClick={() => setView("reject")}
              type="button"
            >
              <X size={16} weight="bold" />
              Decline
            </button>
            <button
              className="flex h-11 flex-1 items-center justify-center gap-2 bg-primary text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
              disabled={submitting}
              onClick={handleApprove}
              type="button"
            >
              {submitting ? (
                <>
                  <Spinner className="animate-spin" size={15} />
                  Approving…
                </>
              ) : (
                <>
                  <Check size={16} weight="bold" />
                  Approve
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
