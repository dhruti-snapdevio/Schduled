import { Card, CardContent } from '@/components/ui/card'

export default async function ReschedulePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Reschedule page for token <code className="font-mono text-xs">{token}</code> — coming soon.
        </CardContent>
      </Card>
    </main>
  )
}
