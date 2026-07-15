"use client";

import * as React from "react";
import { Desktop, type Icon, Moon, PaintBrush, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OPTIONS: { value: "light" | "dark" | "system"; label: string; icon: Icon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Desktop },
];

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  // next-themes can't know the stored theme until it mounts client-side — gate
  // the selected-option highlight on mount so it never flashes the wrong one.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <Card className="h-full">
      <CardHeader className="gap-2.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
            <PaintBrush size={15} weight="bold" />
          </span>
          <CardTitle className="text-base font-semibold">Appearance</CardTitle>
        </div>
        <CardDescription>
          Choose how the Orbit admin panel looks on this device.
        </CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-3 p-6">
        {OPTIONS.map(({ value, label, icon: OptionIcon }) => {
          const selected = mounted && (theme ?? "system") === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={cn(
                "flex items-center gap-4 border p-3 text-left transition-colors hover:bg-muted/50",
                selected ? "border-primary ring-2 ring-primary/20" : "border-border"
              )}
            >
              <div className="min-w-0 flex-1">
                <ThemePreview value={value} />
              </div>
              <div className="flex w-28 shrink-0 items-center gap-1.5">
                <OptionIcon size={15} className={selected ? "text-primary" : "text-muted-foreground"} />
                <span className="text-sm font-medium">{label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function ThemePreview({ value }: { value: "light" | "dark" | "system" }) {
  const Pane = ({ dark }: { dark: boolean }) => (
    <div className={cn("flex h-full flex-1 flex-col gap-1 p-1.5", dark ? "bg-neutral-900" : "bg-neutral-100")}>
      <div className={cn("h-1.5 w-1/2", dark ? "bg-neutral-700" : "bg-neutral-300")} />
      <div className={cn("h-1.5 w-3/4", dark ? "bg-neutral-700" : "bg-neutral-300")} />
      <div className="mt-auto h-1.5 w-1/3 bg-primary" />
    </div>
  );

  return (
    <div className="flex h-12 w-full overflow-hidden border border-border">
      {value === "light" && <Pane dark={false} />}
      {value === "dark" && <Pane dark />}
      {value === "system" && (
        <>
          <Pane dark={false} />
          <Pane dark />
        </>
      )}
    </div>
  );
}
