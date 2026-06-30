import { PageHeader } from '@/components/scaffold/page-header'
import { requireSession } from '@/lib/authz'
import { getContactSettings } from '@/app/actions/settings'
import { ContactSettingsForm } from './_components/contact-settings-form'

export const metadata = { title: 'Contacts settings' }

export default async function ContactsSettingsPage() {
  await requireSession()
  const settings = await getContactSettings()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Contacts"
        description="Control how contacts are created automatically from your bookings."
      />
      <ContactSettingsForm initial={settings} />
    </div>
  )
}
