import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ADMIN_ROLE } from "@/config/platform";
import { user } from "@/db/schema";
import { getCurrentSession } from "@/lib/authz";
import { db } from "@/lib/db";

export default async function PostAuthPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  const [freshUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  redirect(freshUser?.role === ADMIN_ROLE ? "/orbit" : "/dashboard");
}
