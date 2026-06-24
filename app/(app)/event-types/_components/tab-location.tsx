"use client";

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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { BuilderFormValues } from "./builder";

type LocationType = BuilderFormValues["locationType"];

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

  // Zoom / Google Meet auto-generate a link only if the host has connected the
  // integration. Warn when the chosen provider isn't connected yet.
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
                // Coming-soon options are not selectable. An existing event
                // that already uses one stays selectable so it can be opened,
                // but it can't be switched *to* one.
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
                    onClick={() => {
                      if (!isDisabled) {
                        field.onChange(opt.value);
                      }
                    }}
                    type="button"
                  >
                    <span className="mt-0.5 shrink-0">{opt.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {opt.label}
                        </span>
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
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-border"
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

      {/* Connect-required warning — provider chosen but not yet connected */}
      {needsConnect && (
        <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <Warning className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" size={18} weight="fill" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Connect {connectProvider} to generate meeting links
            </p>
            <p className="mt-0.5 text-xs text-amber-700/90 dark:text-amber-300/80">
              You haven&apos;t connected {connectProvider} yet, so bookings for this meeting type
              won&apos;t include a {locationType === "zoom" ? "Zoom" : "Google Meet"} link until you do.
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

      {/* Extra fields when value is required */}
      {selected?.requiresValue && (
        <FormField
          control={form.control}
          name="locationValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{selected.valueLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={selected.valuePlaceholder}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {selected?.requiresPhone && (
        <FormField
          control={form.control}
          name="hostPhoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your phone number</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Shown to invitees so they know how to reach you.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
