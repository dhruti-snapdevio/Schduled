"use client";

import {
  Globe,
  GoogleLogo,
  MapPin,
  Phone,
  Screencast,
  VideoCamera,
} from "@phosphor-icons/react";
import type { UseFormReturn } from "react-hook-form";
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
    sub: "You call the invitee on their provided phone number.",
    icon: <Phone className="text-primary" size={22} weight="fill" />,
    comingSoon: true,
  },
  {
    value: "phone_invitee_calls",
    label: "Phone call (they call)",
    sub: "The invitee calls you.",
    icon: <Phone className="text-primary" size={22} weight="fill" />,
    requiresPhone: true,
    comingSoon: true,
  },
  {
    value: "in_person",
    label: "In-person",
    sub: "Specify a physical address where you will meet.",
    icon: <MapPin className="text-orange-500" size={22} weight="fill" />,
    requiresValue: true,
    valuePlaceholder: "e.g. 123 Main St, New York, NY",
    valueLabel: "Location address",
    comingSoon: true,
  },
  {
    value: "custom",
    label: "Custom",
    sub: "Provide your own meeting link or description.",
    icon: <Globe className="text-muted-foreground" size={22} weight="fill" />,
    requiresValue: true,
    valuePlaceholder: "e.g. https://meet.example.com/my-room",
    valueLabel: "Custom location",
    comingSoon: true,
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
}

export function TabLocation({ form }: TabLocationProps) {
  const locationType = form.watch("locationType");
  const selected = LOCATION_OPTIONS.find((o) => o.value === locationType);

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
                          <span className="inline-flex items-center border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
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
