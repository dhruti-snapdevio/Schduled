import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { asc, and, eq } from 'drizzle-orm'
import { Clock } from '@phosphor-icons/react/dist/ssr'
import { db } from '@/lib/db'
import { user, eventType } from '@/db/schema'

export default async function HostProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const [host] = await db
    .select({ id: user.id, name: user.name, image: user.image })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)

  if (!host) notFound()

  const eventTypes = await db.query.eventType.findMany({
    where: and(
      eq(eventType.userId, host.id),
      eq(eventType.isActive, true),
      eq(eventType.isHidden, false),
    ),
    with: { durations: true },
    orderBy: [asc(eventType.position)],
  })

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <header className="mb-10 flex flex-col items-center gap-3 text-center">
        {host.image ? (
          <Image
            src={host.image}
            alt={host.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
            {host.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold">{host.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">@{username}</p>
        </div>
      </header>

      {eventTypes.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No event types available.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {eventTypes.map((et) => {
            const duration =
              et.durations.find((d) => d.isDefault)?.duration ??
              et.durations[0]?.duration ??
              30
            return (
              <Link
                key={et.id}
                href={`/${username}/${et.slug}`}
                className="group flex items-center gap-4 border border-border bg-background p-5 transition-colors hover:border-primary hover:bg-primary/5"
              >
                <div
                  className="h-12 w-1 shrink-0"
                  style={{ backgroundColor: et.color ?? '#0d9488' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{et.name}</p>
                  {et.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {et.description}
                    </p>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={13} />
                  {duration} min
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
