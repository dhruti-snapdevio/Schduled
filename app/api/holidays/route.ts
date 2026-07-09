import { NextResponse } from "next/server";
import { requireSession } from "@/lib/authz";
import { countryHolidays } from "@/lib/holidays";

// Public holidays for a country — computed server-side (date-holidays is large,
// so it never ships to the client). The availability page fetches this when the
// user changes the holiday country.
export async function GET(request: Request) {
  await requireSession();
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get("country") ?? "US").toUpperCase();
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;
  return NextResponse.json({ holidays: countryHolidays(country, year) });
}
