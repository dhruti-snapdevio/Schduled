import { Suspense } from 'react'
import { Users } from '@phosphor-icons/react/dist/ssr'
import { PageHeader } from '@/components/scaffold/page-header'
import { Empty } from '@/components/ui/empty'
import { requireSession } from '@/lib/authz'
import { getContacts } from '@/app/actions/settings'
import { ContactsTable } from './_components/contacts-table'

export const metadata = { title: 'Contacts' }

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; archived?: string; filter?: string }>
}) {
  await requireSession()
  const params = await searchParams

  const page     = Math.max(1, parseInt(params.page ?? '1', 10))
  const search   = params.q ?? ''
  const archived = params.archived === '1'
  const filter   = params.filter === 'new' || params.filter === 'upcoming' ? params.filter : 'all'

  const { contacts, total } = await getContacts({
    page,
    pageSize: 15,
    search,
    archived,
    filter,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scheduling"
        title="Contacts"
        description="People who have booked time with you. Add notes, archive, or remove contacts."
      />

      {total === 0 && !search && !archived && filter === 'all' ? (
        <Empty
          icon={<Users />}
          title="No contacts yet"
          description="Contacts appear here automatically when someone books a meeting with you."
        />
      ) : (
        <Suspense>
          <ContactsTable
            contacts={contacts}
            total={total}
            page={page}
            pageSize={15}
            search={search}
            archived={archived}
            filter={filter}
          />
        </Suspense>
      )}
    </div>
  )
}
