"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/settings/profile",       label: "Profile" },
  { href: "/settings/branding",      label: "Branding" },
  { href: "/settings/my-link",       label: "My Link" },
  { href: "/settings/calendars",     label: "Calendars" },
  { href: "/settings/integrations",  label: "Integrations" },
  { href: "/settings/communication", label: "Communication" },
  { href: "/settings/contacts",      label: "Contacts" },
  { href: "/settings/security",      label: "Security" },
  { href: "/settings/login",         label: "Login" },
  { href: "/settings/cookies",       label: "Cookies" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "border-l-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SettingsMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border pb-1">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-medium whitespace-nowrap border transition-colors",
              active
                ? "border-primary bg-primary/[0.08] text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
