import { Card, CardContent } from '@/components/ui/card'

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Booking page for <strong>@{username}</strong> — coming soon.
        </CardContent>
      </Card>
    </main>
  )
}
