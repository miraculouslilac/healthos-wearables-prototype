import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { refreshWhoopSession } from '@/lib/whoop/client'
import { getSession, setSession } from '@/lib/whoop/session'

export async function POST(request: NextRequest) {
  const session = getSession(request)
  if (!session) return NextResponse.json({ error: 'not_connected' }, { status: 401 })
  try {
    const refreshed = await refreshWhoopSession(session)
    const response = NextResponse.json({ ok: true })
    setSession(response, refreshed)
    return response
  } catch {
    return NextResponse.json({ error: 'refresh_failed' }, { status: 401 })
  }
}
