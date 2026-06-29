"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ArrowSquareOut,
  Globe,
  GoogleLogo,
  MapPin,
  PhoneIncoming,
  PhoneOutgoing,
  Screencast,
  VideoCamera,
  Warning,
} from "@phosphor-icons/react";
import Link from "next/link";
import type { UseFormReturn } from "react-hook-form";
import type { MeetingIntegrations } from "@/lib/integrations/status";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Separator } from "@/components/ui/separator";
import { cn, dialCodeFromTz } from "@/lib/utils";
import type { BuilderFormValues } from "./builder";

type LocationType = BuilderFormValues["locationType"];

function detectDialCode(): string {
  try {
    return dialCodeFromTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
  } catch {
    return ''
  }
}

// ── Location options ──────────────────────────────────────────────────────────

interface LocationOption {
  comingSoon?: boolean;
  icon: React.ReactNode;
  label: string;
  requiresPhone?: boolean;
  requiresValue?: boolean;
  sub: string;
  value: LocationType;
  valueLabel?: string;
  valuePlaceholder?: string;
}

const LOCATION_OPTIONS: LocationOption[] = [
  {
    value: "google_meet",
    label: "Google Meet",
    sub: "Auto-generate a Google Meet link for each booking.",
    icon: <GoogleLogo className="text-[#4285F4]" size={22} weight="bold" />,
  },
  {
    value: "zoom",
    label: "Zoom",
    sub: "Auto-generate a Zoom meeting link for each booking.",
    icon: <VideoCamera className="text-[#2D8CFF]" size={22} weight="fill" />,
  },
  {
    value: "phone_host_calls",
    label: "Phone call (you call)",
    sub: "You call the invitee. They provide their number when booking.",
    icon: <PhoneOutgoing className="text-primary" size={22} weight="fill" />,
  },
  {
    value: "phone_invitee_calls",
    label: "Phone call (they call)",
    sub: "The invitee calls you on your phone number.",
    icon: <PhoneIncoming className="text-primary" size={22} weight="fill" />,
    requiresPhone: true,
  },
  {
    value: "in_person",
    label: "In-person",
    sub: "Specify a physical address where you will meet.",
    icon: <MapPin className="text-orange-500" size={22} weight="fill" />,
    requiresValue: true,
    valuePlaceholder: "e.g. 123 Main St, New York, NY",
    valueLabel: "Location address",
  },
  {
    value: "custom",
    label: "Custom",
    sub: "Provide your own meeting link or description.",
    icon: <Globe className="text-muted-foreground" size={22} weight="fill" />,
    requiresValue: true,
    valuePlaceholder: "e.g. https://meet.example.com/my-room",
    valueLabel: "Custom location",
  },
  {
    value: "invitees_choice",
    label: "Invitee's choice",
    sub: "Let the invitee choose their preferred meeting type.",
    icon: (
      <Screencast className="text-muted-foreground" size={22} weight="fill" />
    ),
    comingSoon: true,
  },
];

const LS_KEY = 'schduled:lastPhoneNumber'

// ── Smart phone input ─────────────────────────────────────────────────────────

function PhoneInput({
  value,
  onChange,
  onBlur,
}: {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)

  // Derive dial code directly from the current value — always in sync, no stale state
  const dialCode = useMemo(() => {
    const v = (value ?? '').trim()
    if (!v) return ''
    const m = v.match(/^(\+\d{1,4})/)
    return m ? m[1] : ''
  }, [value])

  // Auto-fill on first mount only (new event or switching to phone type)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    // Priority 1: already has a value (edit mode) — leave it alone
    if (value && value.trim()) return

    // Priority 2: localStorage (last number used)
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved && saved.trim()) {
        onChange(saved.trim())
        return
      }
    } catch { /* ignore */ }

    // Priority 3: detect country code from browser timezone
    const code = detectDialCode()
    if (code) onChange(code + ' ')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value
    // Strip everything except digits, +, space, -, (, ), .
    raw = raw.replace(/[^\d+\s\-().]/g, '')
    // + is only valid at position 0 — remove any + that crept in elsewhere
    if (raw.indexOf('+') > 0) raw = '+' + raw.replace(/\+/g, '')
    onChange(raw)
  }

  function handleBlur() {
    const trimmed = (value ?? '').trim()
    // Persist valid-looking numbers to localStorage
    if (trimmed.length > 5) {
      try { localStorage.setItem(LS_KEY, trimmed) } catch { /* ignore */ }
    }
    onBlur?.()
  }

  return (
    <div className="flex items-stretch border border-input focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
      {/* Dial code badge — derived from value, always reactive */}
      <div className="flex shrink-0 items-center border-r border-input bg-muted px-3 text-sm font-mono font-semibold text-foreground min-w-[52px] justify-center select-none">
        {dialCode || '+'}
      </div>
      <input
        ref={inputRef}
        type="tel"
        value={value ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={dialCode ? `${dialCode} XXXXX XXXXX` : '+91 98765 43210'}
        className="flex-1 bg-background px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 outline-none"
      />
    </div>
  )
}

// ── Tab component ─────────────────────────────────────────────────────────────

interface TabLocationProps {
  form: UseFormReturn<BuilderFormValues>;
  integrations?: MeetingIntegrations;
}

export function TabLocation({
  form,
  integrations = { googleConnected: false, zoomConnected: false },
}: TabLocationProps) {
  const locationType = form.watch("locationType");
  const selected = LOCATION_OPTIONS.find((o) => o.value === locationType);

  const needsConnect =
    (locationType === "google_meet" && !integrations.googleConnected) ||
    (locationType === "zoom" && !integrations.zoomConnected);
  const connectProvider = locationType === "zoom" ? "Zoom" : "Google Calendar";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Location</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Where will this meeting take place?
        </p>
      </div>

      <Separator />

      <FormField
        control={form.control}
        name="locationType"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">Location type</FormLabel>
            <div className="grid grid-cols-1 gap-2">
              {LOCATION_OPTIONS.map((opt) => {
                const isSelected = field.value === opt.value;
                const isDisabled = opt.comingSoon && !isSelected;
                return (
                  <button
                    className={cn(
                      "flex items-start gap-4 border p-4 text-left transition",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : isDisabled
                          ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                          : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
                    )}
                    disabled={isDisabled}
                    key={opt.value}
                    onClick={() => { if (!isDisabled) field.onChange(opt.value) }}
                    type="button"
                  >
                    <span className="mt-0.5 shrink-0">{opt.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{opt.label}</span>
                        {opt.comingSoon && (
                          <span className="inline-flex items-center bg-teal-600 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-white">
                            Coming soon
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {opt.sub}
                      </span>
                    </span>
                    {!isDisabled && (
                      <span
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition",
                          isSelected ? "border-primary bg-primary" : "border-border"
                        )}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Integration warning */}
      {needsConnect && (
        <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <Warning className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={18} weight="fill" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Connect {connectProvider} to generate meeting links
            </p>
            <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-300/80">
              You haven&apos;t connected {connectProvider} yet, so bookings won&apos;t include a{" "}
              {locationType === "zoom" ? "Zoom" : "Google Meet"} link until you do.
            </p>
            <Link
              href="/settings/integrations"
              target="_blank"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 underline-offset-2 hover:underline dark:text-amber-200"
            >
              Connect {connectProvider}
              <ArrowSquareOut size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* Custom location / in-person address */}
      {selected?.requiresValue && (
        <FormField
          control={form.control}
          name="locationValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{selected.valueLabel}</FormLabel>
              <FormControl>
                {locationType === "in_person" ? (
                  <AddressAutocomplete
                    placeholder={selected.valuePlaceholder}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                ) : (
                  <Input
                    placeholder={selected.valuePlaceholder}
                    {...field}
                    value={field.value ?? ""}
                  />
                )}
              </FormControl>
              {locationType === "in_person" && (
                <FormDescription>
                  Start typing to search for an address, or enter it manually.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Phone number — with dial code prefix and validation */}
      {selected?.requiresPhone && (
        <FormField
          control={form.control}
          name="hostPhoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your phone number</FormLabel>
              <FormControl>
                <PhoneInput
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormDescription>
                Shown to invitees so they know how to reach you. Include your country code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
