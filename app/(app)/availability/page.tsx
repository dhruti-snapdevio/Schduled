import { getAvailabilityData } from '@/app/actions/availability'
import { PageHeader } from '@/components/scaffold/page-header'
import { AvailabilityForm } from './_components/availability-form'

export const metadata = { title: 'Availability' }

export default async function AvailabilityPage() {
  const { schedule, overrides, userTimezone } = await getAvailabilityData()

  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Availability"
        description="Set the hours you're available for meetings each week."
      />
      <AvailabilityForm
        initialSchedule={schedule}
        initialOverrides={overrides}
        userTimezone={userTimezone}
      />
    </>
  )
}
