import { redirect } from "next/navigation";

// This route was an early duplicate of /profile/profile and rendered a second
// AppShell inside the layout's shell. Redirect any stale links to the canonical
// profile page instead.
export default function DashboardProfileRedirect() {
  redirect("/profile/profile");
}
