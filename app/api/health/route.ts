import { NextResponse } from "next/server";
import { dbClient } from "@/lib/db";

// Used by Docker Compose / Kubernetes healthchecks. Checks real DB
// connectivity (not just "the process is alive") since a Next.js process
// can be up while unable to reach Postgres.
export async function GET() {
  try {
    await dbClient`select 1`;
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[health] database check failed", error);
    return NextResponse.json({ status: "error" }, { status: 503 });
  }
}
