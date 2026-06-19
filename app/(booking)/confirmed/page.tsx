import type { Metadata } from 'next'
import { ConfirmationClient } from './_components/confirmation-client'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{
    host?: string
    event?: string
    start?: string
    end?: string
    tz?: string
    cancel?: string
    reschedule?: string
    loc?: string
    locValue?: string
  }>
}) {
  const p = await searchParams

  if (!p.start || !p.tz || !p.event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F7F6] p-4">
        <p className="text-sm text-muted-foreground">Invalid confirmation link.</p>
      </main>
    )
  }

  return (
    <ConfirmationClient
      eventName={p.event}
      hostName={p.host ?? ''}
      startUtc={p.start}
      endUtc={p.end ?? null}
      timezone={p.tz}
      locationType={p.loc ?? 'custom'}
      locationValue={p.locValue ?? null}
      cancelToken={p.cancel ?? null}
      rescheduleToken={p.reschedule ?? null}
    />
  )
}
