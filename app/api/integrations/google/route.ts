import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getCurrentSession } from '@/lib/authz'
import { safeReturnTo } from '@/lib/api/helpers'
import { env } from '@/lib/env'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]

export async function GET(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const returnTo = safeReturnTo(req.nextUrl.searchParams.get('returnTo'))

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    const fallback = new URL(returnTo, req.url)
    fallback.searchParams.set('calendar_error', 'not_configured')
    return NextResponse.redirect(fallback)
  }

  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    `${env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`,
  )

  const state = Buffer.from(
    JSON.stringify({ userId: session.user.id, returnTo }),
  ).toString('base64')

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // ensures refresh_token is always returned
    scope: SCOPES,
    state,
  })

  return NextResponse.redirect(authUrl)
}
