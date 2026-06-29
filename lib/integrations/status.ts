import { and, eq } from 'drizzle-orm'
import { connectedCalendar, videoConnection } from '@/db/schema'
import { db } from '@/lib/db'

export interface MeetingIntegrations {
  googleConnected: boolean
  zoomConnected: boolean
}

/**
 * Whether the host has connected the integrations required to auto-generate
 * meeting links. Google Meet needs a connected Google Calendar; Zoom needs a
 * connected Zoom account. Used to warn in the event-type Location tab.
 */
export async function getMeetingIntegrations(userId: string): Promise<MeetingIntegrations> {
  const [cal, zoom] = await Promise.all([
    db
      .select({ status: connectedCalendar.status })
      .from(connectedCalendar)
      .where(and(eq(connectedCalendar.userId, userId), eq(connectedCalendar.provider, 'google')))
      .limit(1)
      .then((r) => r[0]),
    db
      .select({ id: videoConnection.id })
      .from(videoConnection)
      .where(and(eq(videoConnection.userId, userId), eq(videoConnection.provider, 'zoom')))
      .limit(1)
      .then((r) => r[0]),
  ])

  return {
    googleConnected: cal?.status === 'connected',
    zoomConnected: !!zoom,
  }
}
