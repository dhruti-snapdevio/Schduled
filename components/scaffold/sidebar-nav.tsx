"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  GearSix,
  Lightning,
  ShieldStar,
  SignOut,
  SquaresFour,
  UserCircle,
} from "@phosphor-icons/react";
import { logoutAction } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}>;

const NAV_LINKS: { href: string; label: string; icon: IconComponent }[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  { href: "/event-types", label: "Event Types", icon: Lightning },
  { href: "/availability", label: "Availability", icon: Clock },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/settings", label: "Settings", icon: GearSix },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: IconComponent;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <Icon size={17} weight={active ? "fill" : "regular"} />
      {label}
    </Link>
  );
}

export function SidebarNav({
  email,
  isAdmin,
}: {
  email: string;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col py-3">
      {/* Main nav links */}
      <nav className="flex-1 space-y-0.5 px-2">
        {NAV_LINKS.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
              (href === "/settings" && pathname.startsWith("/settings"))
            }
          />
        ))}
      </nav>

      {/* Bottom section — light-highlight panel so admin/email/signout are clearly visible */}
      <div className="mt-auto border-t border-sidebar-border bg-white/[0.06] px-2 py-2 space-y-0.5">
        {isAdmin && (
          <NavItem
            href="/orbit"
            label="Admin"
            icon={ShieldStar}
            active={pathname.startsWith("/orbit")}
          />
        )}

        <NavItem
          href="/settings/profile"
          label="Profile"
          icon={UserCircle}
          active={pathname === "/settings/profile"}
        />

        {/* User email row */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
            {email.slice(0, 2).toUpperCase()}
          </span>
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-sidebar-foreground/90 leading-none">
            {email}
          </p>
        </div>

        {/* Sign out */}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <SignOut size={17} />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
