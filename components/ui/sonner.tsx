"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, SpinnerIcon } from "@phosphor-icons/react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      className="toaster group"
      icons={{
        success: (
          <CheckCircleIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <WarningIcon className="size-4" />
        ),
        error: (
          <XCircleIcon className="size-4" />
        ),
        loading: (
          <SpinnerIcon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        // sonner's own stylesheet sets background/border/color/radius via
        // `[data-sonner-toast][data-styled=true]`, which outranks a plain
        // Tailwind utility class — `!` (important) is required to win here.
        classNames: {
          toast: "!rounded-none",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground rounded-none",
          cancelButton: "bg-muted text-muted-foreground rounded-none",
          default: "!border-border !bg-popover !text-popover-foreground",
          loading: "!border-border !bg-popover !text-popover-foreground",
          success: "!border-success/40 !bg-success-subtle !text-success-foreground",
          error: "!border-destructive/40 !bg-destructive/10 !text-destructive",
          warning: "!border-warning/40 !bg-warning/15 !text-foreground",
          info: "!border-primary/40 !bg-primary/10 !text-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
