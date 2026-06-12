import { PageHeader } from '@/components/scaffold/page-header'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = { title: 'Availability' }

export default function AvailabilityPage() {
  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Availability"
        description="Set the hours you are available for meetings."
      />
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          Availability management coming soon.
        </CardContent>
      </Card>
    </>
  )
}
