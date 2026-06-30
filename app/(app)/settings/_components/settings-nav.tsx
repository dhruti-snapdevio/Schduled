"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PROFILE_LINKS = [
  { href: "/profile/profile",  label: "Profile" },
  { href: "/profile/security", label: "Security" },
  { href: "/profile/login",    label: "Connected Accounts" },
];

const SETTINGS_LINKS = [
  { href: "/settings/my-link",       label: "Booking Link" },
  { href: "/settings/calendars",     label: "Calendar Sync" },
  { href: "/settings/integrations",  label: "Integrations" },
  { href: "/settings/communication", label: "Notifications" },
  { href: "/settings/contacts",      label: "Contact settings" },
  { href: "/settings/cookies",       label: "Cookies" },
];

const PROFILE_PATHS = ["/profile/profile", "/profile/security", "/profile/login"];

function isProfileSection(pathname: string) {
  return PROFILE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {links.map(({ href, label }) => {
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

export function SettingsNav() {
  const pathname = usePathname();
  const links = isProfileSection(pathname) ? PROFILE_LINKS : SETTINGS_LINKS;
  return <NavLinks links={links} />;
}

export function SettingsMobileNav() {
  const pathname = usePathname();
  const links = isProfileSection(pathname) ? PROFILE_LINKS : SETTINGS_LINKS;

  return (
    <nav className="flex overflow-x-auto gap-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border pb-1">
      {links.map(({ href, label }) => {
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
