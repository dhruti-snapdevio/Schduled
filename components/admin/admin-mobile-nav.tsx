"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/orbit",               label: "Overview",    exact: true },
  { href: "/orbit/users",         label: "Members",     exact: false },
  { href: "/orbit/subscribers",   label: "Subscribers", exact: false },
  { href: "/orbit/audit",         label: "Audit",       exact: false },
  { href: "/orbit/queues",        label: "Queues",       exact: false },
  { href: "/orbit/email",         label: "Email",        exact: false },
  { href: "/orbit/settings",      label: "Settings",     exact: false },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto border-b border-border bg-background px-4 py-1 gap-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV_ITEMS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 px-3 py-1.5 text-xs font-medium border whitespace-nowrap transition-colors",
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
