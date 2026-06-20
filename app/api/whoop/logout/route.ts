import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/whoop/session'

export async function POST() {
  const response = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'), 303)
  clearSession(response)
  return response
}
