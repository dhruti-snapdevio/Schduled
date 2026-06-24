import type { Metadata } from 'next'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { booking } from '@/db/schema'
import { ConfirmationClient } from './_components/confirmation-client'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{
    host?: string
    slug?: string
    event?: string
    start?: string
    end?: string
    tz?: string
    cancel?: string
    reschedule?: string
    loc?: string
    locValue?: string
    pending?: string
  }>
}) {
  const p = await searchParams

  if (!p.start || !p.tz || !p.event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Invalid confirmation link.</p>
      </main>
    )
  }

  // Verify isPending from the DB rather than trusting the URL param
  let isPending = false
  if (p.cancel) {
    const [b] = await db
      .select({ status: booking.status })
      .from(booking)
      .where(eq(booking.cancelToken, p.cancel))
      .limit(1)
    isPending = b?.status === 'pending'
  }

  return (
    <ConfirmationClient
      eventName={p.event}
      hostName={p.host ?? ''}
      hostUsername={p.slug ?? null}
      startUtc={p.start}
      endUtc={p.end ?? null}
      timezone={p.tz}
      locationType={p.loc ?? 'custom'}
      locationValue={p.locValue ?? null}
      cancelToken={p.cancel ?? null}
      rescheduleToken={p.reschedule ?? null}
      isPending={isPending}
    />
  )
}
