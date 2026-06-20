import type { WhoopSession } from '@/lib/whoop/session'

const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token'
const API = 'https://api.prod.whoop.com/developer/v2'

type TokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type?: string
}

const credentials = () => {
  const clientId = process.env.WHOOP_CLIENT_ID
  const clientSecret = process.env.WHOOP_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('WHOOP credentials are not configured')
  return { clientId, clientSecret }
}

async function tokenRequest(params: URLSearchParams): Promise<WhoopSession> {
  const { clientId, clientSecret } = credentials()
  params.set('client_id', clientId)
  params.set('client_secret', clientSecret)
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`WHOOP token request failed (${response.status})`)
  const token = await response.json() as TokenResponse
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    tokenType: token.token_type,
  }
}

export const exchangeCode = (code: string) => tokenRequest(new URLSearchParams({
  grant_type: 'authorization_code',
  code,
  redirect_uri: process.env.WHOOP_REDIRECT_URI ?? '',
}))

export async function refreshWhoopSession(session: WhoopSession) {
  if (!session.refreshToken) throw new Error('No refresh token available')
  const refreshed = await tokenRequest(new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: session.refreshToken,
  }))
  return { ...refreshed, refreshToken: refreshed.refreshToken ?? session.refreshToken }
}

export async function fetchCollection(path: string, session: WhoopSession, start?: string) {
  let nextToken: string | undefined
  const records: Array<Record<string, unknown>> = []
  do {
    const url = new URL(`${API}${path}`)
    url.searchParams.set('limit', '25')
    if (start) url.searchParams.set('start', start)
    if (nextToken) url.searchParams.set('nextToken', nextToken)
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`WHOOP API request failed (${response.status})`)
    const page = await response.json() as { records?: Array<Record<string, unknown>>; next_token?: string }
    records.push(...(page.records ?? []))
    nextToken = page.next_token
  } while (nextToken)
  return { records }
}

export async function fetchWhoopData(session: WhoopSession) {
  const start = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
  const [profile, body, cycles, recoveries, sleeps, workouts] = await Promise.all([
    fetch(`${API}/user/profile/basic`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: 'no-store' }).then(r => r.ok ? r.json() : null),
    fetch(`${API}/user/measurement/body`, { headers: { Authorization: `Bearer ${session.accessToken}` }, cache: 'no-store' }).then(r => r.ok ? r.json() : null),
    fetchCollection('/cycle', session, start),
    fetchCollection('/recovery', session, start),
    fetchCollection('/activity/sleep', session, start),
    fetchCollection('/activity/workout', session, start),
  ])
  return { profile, body, cycles, recoveries, sleeps, workouts }
}
