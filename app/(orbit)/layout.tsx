import type { ReactNode } from "react";
import Link from "next/link";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { PRODUCT_NAME } from "@/config/platform";
import { requireAdmin } from "@/lib/authz";
import { getWorkspaceBranding } from "@/lib/settings/workspace";
import { logoutAction } from "@/app/actions/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();
  const branding = await getWorkspaceBranding();
  // getWorkspaceBranding() falls back to PRODUCT_NAME when nothing's been
  // set — only show it as the heading once an owner/manager has actually
  // customized it, so an untouched instance still reads "Admin Panel".
  const workspaceLabel = branding.name === PRODUCT_NAME ? "Admin Panel" : branding.name;

  return (
    <div className="flex h-dvh overflow-hidden bg-page">
      <AdminSidebar email={session.user.email} workspaceName={workspaceLabel} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar — shows on small screens where sidebar is hidden */}
        <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
          <span className="text-sm font-bold text-foreground">{workspaceLabel}</span>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs font-medium text-primary hover:underline">
              Dashboard
            </Link>
            <form action={logoutAction.bind(null, "/orbit/login")}>
              <button type="submit" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <AdminMobileNav />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
