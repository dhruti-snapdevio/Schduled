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
