import { getAvailabilityData, getMeetingLimits } from "@/app/actions/availability";
import { PageHeader } from "@/components/scaffold/page-header";
import { AvailabilityForm } from "./_components/availability-form";

export const metadata = { title: "Availability" };

export default async function AvailabilityPage() {
  const [{ schedule, overrides, userTimezone }, initialLimits] = await Promise.all([
    getAvailabilityData(),
    getMeetingLimits(),
  ]);

  return (
    <>
      <PageHeader
        description="Set the hours you're available for meetings each week."
        eyebrow="Scheduling"
        title="Availability"
      />
      <AvailabilityForm
        initialOverrides={overrides}
        initialSchedule={schedule}
        initialMeetingLimits={initialLimits}
        userTimezone={userTimezone}
      />
    </>
  );
}
