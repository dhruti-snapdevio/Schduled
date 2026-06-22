"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  Clock,
  GearSix,
  Lightning,
  ShieldCheck,
  SignOut,
  SquaresFour,
  UserCircle,
} from "@phosphor-icons/react";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

type IconComponent = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
}>;

const NAV_LINKS: { href: string; label: string; icon: IconComponent }[] = [
  { href: "/dashboard",    label: "Dashboard",   icon: SquaresFour },
  { href: "/event-types",  label: "Meeting Types", icon: Lightning  },
  { href: "/availability", label: "Availability", icon: Clock      },
  { href: "/bookings",     label: "Bookings",    icon: CalendarCheck },
  { href: "/settings",     label: "Settings",    icon: GearSix     },
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
        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors rounded-none border-l-[3px]",
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
    <div className="flex h-full flex-col">

      {/* ── Logo — same height as top bar so it aligns visually ──────── */}
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4 text-white">
        <Logo href="/dashboard" size="md" variant="full" />
      </div>

      {/* ── Main nav ─────────────────────────────────────────────────── */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar px-2 py-3">
        {NAV_LINKS.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href + "/")) ||
              (href === "/settings" &&
                pathname.startsWith("/settings") &&
                !pathname.startsWith("/settings/profile"))
            }
          />
        ))}
      </nav>

      {/* ── Bottom section ───────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-sidebar-border px-2 py-2 space-y-0.5">

        {/* Profile link */}
        <NavItem
          href="/settings/profile"
          label="Profile"
          icon={UserCircle}
          active={pathname === "/settings/profile"}
        />

        {/* Admin panel shortcut */}
        {isAdmin && (
          <NavItem
            href="/orbit"
            label="Admin Panel"
            icon={ShieldCheck}
            active={pathname.startsWith("/orbit")}
          />
        )}

        {/* Sign out */}
        <form action={logoutAction.bind(null, "/login")}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 border-l-[3px] border-l-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/40 hover:text-destructive"
          >
            <SignOut size={17} />
            Sign out
          </button>
        </form>

        {/* User info row */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 mt-1 border-t border-sidebar-border/50"
          title={email}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-primary text-primary-foreground text-xs font-bold">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt="Profile" className="size-full object-cover" />
            ) : (
              (userName ?? email).slice(0, 2).toUpperCase()
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground leading-none">
              {userName ?? email}
            </p>
            <p className="mt-0.5 text-xs text-sidebar-foreground/50 leading-none">
              {isAdmin ? "Admin" : "Member"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
