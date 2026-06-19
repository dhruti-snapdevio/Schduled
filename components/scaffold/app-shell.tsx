import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ImpersonationBanner } from "./impersonation-banner";
import { MobileNav } from "./mobile-nav";
import { NotificationBell } from "./notification-bell";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({
  children,
  email,
  userName,
  isAdmin = false,
  userImage,
  isImpersonating = false,
  impersonatedUserName,
}: {
  children: ReactNode;
  email: string;
  userName?: string | null;
  isAdmin?: boolean;
  userImage?: string | null;
  isImpersonating?: boolean;
  impersonatedUserName?: string | null;
}) {
  const initials = (userName ?? email).slice(0, 2).toUpperCase();

  return (
    /* h-dvh = dynamic viewport height — accounts for mobile browser chrome (address bar, bottom bar) */
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-3 px-4 md:px-6 border-b border-border bg-background z-40">
        <Logo href="/dashboard" size="md" variant="full" />

        <div className="flex items-center gap-2 min-w-0">
          {/* Search — navigates to /bookings?q= on submit */}
          <form action="/bookings" method="GET" className="relative hidden sm:block">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={15}
            />
            <input
              name="q"
              className="h-9 w-48 md:w-72 lg:w-[340px] rounded-none border border-border bg-page pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              placeholder="Search bookings, meetings..."
              type="search"
            />
          </form>

          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <NotificationBell />
            {/* Avatar — links to profile settings */}
            <Link
              href="/settings/profile"
              aria-label="Profile settings"
              className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-primary text-primary-foreground text-xs font-bold transition-opacity hover:opacity-80"
            >
              {userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Profile"
                  className="size-full object-cover"
                  src={userImage}
                />
              ) : (
                initials
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Impersonation banner ─────────────────────────────────────── */}
      {isImpersonating && (
        <ImpersonationBanner userName={impersonatedUserName ?? email} />
      )}

      {/* ── Body: sidebar + content ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar — desktop only */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border overflow-y-auto no-scrollbar">
          <SidebarNav email={email} userName={userName} isAdmin={isAdmin} userImage={userImage} />
        </aside>

        {/* Page content — overflow-x-hidden stops horizontal scrollbar from builder tab bar's negative margins */}
        {/* pb-16 on mobile gives room for the fixed bottom nav */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-page pb-16 md:pb-0">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">{children}</div>
        </main>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────────────── */}
      <MobileNav />
    </div>
  );
}
