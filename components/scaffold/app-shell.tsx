import type { ReactNode } from "react";
import { Bell, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";

export function AppShell({
  children,
  email,
  isAdmin = false,
}: {
  children: ReactNode;
  email: string;
  isAdmin?: boolean;
}) {
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 border-b border-border bg-background z-40">
        <Logo variant="full" size="md" href="/dashboard" />

        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative hidden sm:block">
            <MagnifyingGlass
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search bookings..."
              className="h-9 w-52 rounded-none border border-border bg-page pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary lg:w-64"
            />
          </div>

          <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell size={18} />
          </Button>
          <ThemeToggle />
          {/* User avatar */}
          <button
            type="button"
            aria-label="Account"
            className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-primary-foreground text-xs font-bold transition-opacity hover:opacity-80"
          >
            {initials}
          </button>
          </div>
        </div>
      </header>

      {/* ── Body: sidebar + content ──────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar — always-dark deep ocean */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border overflow-y-auto">
          <SidebarNav email={email} isAdmin={isAdmin} />
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-page">
          <div className="mx-auto max-w-7xl px-4 md:px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
