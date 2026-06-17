import { PageHeader } from '@/components/scaffold/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Bookings' }

export default function BookingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Bookings"
        description="View and manage all your upcoming and past bookings."
      />
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No bookings yet.
        </CardContent>
      </Card>
    </>
  )
}
