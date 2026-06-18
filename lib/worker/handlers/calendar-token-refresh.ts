import { eq } from 'drizzle-orm'
import type { Job } from 'pg-boss'
import { google } from 'googleapis'
import { db } from '@/lib/db'
import { connectedCalendar } from '@/db/schema'
import { decrypt, encrypt } from '@/lib/encrypt'
import { env } from '@/lib/env'
import { enqueueJob } from '@/lib/worker/enqueue'
import { type CalendarTokenRefreshPayload, JOB_NAMES } from '@/lib/worker/job-types'

export async function handleCalendarTokenRefresh(
  jobs: Job<CalendarTokenRefreshPayload>[],
) {
  for (const job of jobs) {
    await processCalendarTokenRefresh(job)
  }
}

async function processCalendarTokenRefresh(job: Job<CalendarTokenRefreshPayload>) {
  const { connectedCalendarId } = job.data

  const [cal] = await db
    .select()
    .from(connectedCalendar)
    .where(eq(connectedCalendar.id, connectedCalendarId))
    .limit(1)

  if (!cal || cal.provider !== 'google' || !cal.refreshToken) {
    console.warn(`[calendar-token-refresh] skipping ${connectedCalendarId}: not found or no refresh token`)
    return
  }

  const oauth2 = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
  )

  const refreshToken = await decrypt(cal.refreshToken)

  try {
    oauth2.setCredentials({ refresh_token: refreshToken })
    const { credentials } = await oauth2.refreshAccessToken()

    const newAccess  = credentials.access_token!
    const newExpiry  = credentials.expiry_date ? new Date(credentials.expiry_date) : null
    const newRefresh = credentials.refresh_token ?? null

    const encryptedAccess  = await encrypt(newAccess)
    const encryptedRefresh = newRefresh ? await encrypt(newRefresh) : cal.refreshToken

    await db
      .update(connectedCalendar)
      .set({
        accessToken:    encryptedAccess,
        refreshToken:   encryptedRefresh,
        tokenExpiresAt: newExpiry,
        status:         'connected',
      })
      .where(eq(connectedCalendar.id, connectedCalendarId))

    console.log(`[calendar-token-refresh] refreshed token for ${connectedCalendarId}`)
  } catch (err) {
    console.error(`[calendar-token-refresh] refresh failed for ${connectedCalendarId}:`, err)

    await db
      .update(connectedCalendar)
      .set({
        status:         'disconnected',
        disconnectedAt: new Date(),
      })
      .where(eq(connectedCalendar.id, connectedCalendarId))

    await enqueueJob(JOB_NAMES.CALENDAR_DISCONNECT_ALERT, {
      connectedCalendarId,
      userId: cal.userId,
    })
  }
}
