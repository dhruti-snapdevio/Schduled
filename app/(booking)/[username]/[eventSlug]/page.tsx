import { Card, CardContent } from '@/components/ui/card'

export default async function BookingPage({
  params,
}: {
  params: Promise<{ username: string; eventSlug: string }>
}) {
  const { username, eventSlug } = await params

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Book <strong>{eventSlug}</strong> with <strong>@{username}</strong> — coming soon.
        </CardContent>
      </Card>
    </main>
  )
}
