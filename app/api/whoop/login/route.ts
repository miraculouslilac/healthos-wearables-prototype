import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { setOAuthState } from '@/lib/whoop/session'

export function GET() {
  const clientId = process.env.WHOOP_CLIENT_ID
  const redirectUri = process.env.WHOOP_REDIRECT_URI
  if (!clientId || !redirectUri || !process.env.SESSION_SECRET) {
    return NextResponse.redirect(new URL('/?demo=1&reason=whoop_not_configured', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'))
  }
  const state = randomBytes(24).toString('base64url')
  const url = new URL('https://api.prod.whoop.com/oauth/oauth2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', process.env.WHOOP_SCOPES ?? 'read:profile read:body_measurement read:cycles read:recovery read:sleep read:workout offline')
  url.searchParams.set('state', state)
  const response = NextResponse.redirect(url)
  setOAuthState(response, state)
  return response
}
