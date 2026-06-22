"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  GearSix,
  Lightning,
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
        "flex items-center gap-3 pl-[9px] pr-3 py-2.5 text-sm font-medium transition-colors border-l-[3px]",
        active
          ? "border-l-primary bg-primary text-primary-foreground"
          : "border-l-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <Icon size={17} weight={active ? "fill" : "regular"} />
      {label}
    </Link>
  );
}

export function SidebarNav({
  email,
  userName,
  isAdmin,
  userImage,
}: {
  email: string;
  userName?: string | null;
  isAdmin: boolean;
  userImage?: string | null;
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
              (href === "/settings" && pathname.startsWith("/settings") && !pathname.startsWith("/settings/profile"))
            }
          />
        ))}
      </nav>

      {/* Bottom section — light-highlight panel so admin/email/signout are clearly visible */}
      <div className="mt-auto border-t border-sidebar-border bg-white/[0.06] px-2 py-2 space-y-0.5">

        <NavItem
          href="/settings/profile"
          label="Profile"
          icon={UserCircle}
          active={pathname === "/settings/profile"}
        />

        {/* Profile row */}
        <div className="flex items-center gap-2.5 px-3 py-2" title={email}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold rounded-none">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="Profile" className="size-full object-cover" />
            ) : (
              (userName ?? email).slice(0, 2).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground leading-none">
              {userName ?? email}
            </p>
            <p className="mt-0.5 text-[10px] text-sidebar-foreground/50 leading-none">
              {isAdmin ? 'Admin' : 'Member'}
            </p>
          </div>
        </div>

        {/* Sign out — user dashboard returns to the user login */}
        <form action={logoutAction.bind(null, "/login")}>
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
