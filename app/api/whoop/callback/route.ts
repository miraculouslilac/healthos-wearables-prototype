import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/whoop/client'
import { clearOAuthState, getOAuthState, setSession } from '@/lib/whoop/session'

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const state = request.nextUrl.searchParams.get('state')
  if (!code || !state || state !== getOAuthState(request)) {
    return NextResponse.redirect(new URL('/?error=oauth_state', appUrl()))
  }
  try {
    const session = await exchangeCode(code)
    const response = NextResponse.redirect(new URL('/?connected=1', appUrl()))
    setSession(response, session)
    clearOAuthState(response)
    return response
  } catch {
    return NextResponse.redirect(new URL('/?error=oauth_exchange', appUrl()))
  }
}
