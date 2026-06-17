"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChartBar,
  ClockCounterClockwise,
  Envelope,
  ShieldCheck,
  SignOut,
  Stack,
  Users,
} from "@phosphor-icons/react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/orbit",        label: "Overview", icon: ChartBar,              exact: true },
  { href: "/orbit/users",  label: "Users",    icon: Users,                 exact: false },
  { href: "/orbit/audit",  label: "Audit",    icon: ClockCounterClockwise, exact: false },
  { href: "/orbit/queues", label: "Queues",   icon: Stack,                 exact: false },
  { href: "/orbit/email",  label: "Email",    icon: Envelope,              exact: false },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
        <Logo variant="icon" size="sm" href="/orbit" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-sidebar-foreground leading-none">
            Admin Panel
          </p>
          <p className="mt-1 text-2xs font-medium text-sidebar-foreground/40 uppercase tracking-ui">
            Orbit
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-2 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-sidebar-foreground bg-sidebar-accent text-sidebar-foreground"
                  : "border-transparent text-sidebar-foreground/50 hover:border-sidebar-foreground/20 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon size={16} weight={active ? "fill" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="space-y-2 border-t border-sidebar-border bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 px-1 pb-1">
          <ShieldCheck size={13} className="shrink-0 text-sidebar-foreground/30" />
          <p className="min-w-0 truncate text-2xs font-medium uppercase tracking-ui text-sidebar-foreground/30">
            {email}
          </p>
        </div>

        <Button
          asChild
          variant="secondary"
          size="sm"
          className="w-full justify-start gap-2"
        >
          <Link href="/dashboard">
            <ArrowLeft size={14} />
            Back to Dashboard
          </Link>
        </Button>

        <form action={logoutAction}>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            className="w-full justify-start gap-2"
          >
            <SignOut size={14} />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
