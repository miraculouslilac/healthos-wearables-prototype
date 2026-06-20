import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'

export type WhoopSession = {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  tokenType?: string
}

const COOKIE = 'healthos_whoop_session'
const STATE_COOKIE = 'healthos_oauth_state'

const key = () => {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 24) throw new Error('SESSION_SECRET must contain at least 24 characters')
  return createHash('sha256').update(secret).digest()
}

export function encryptSession(session: WhoopSession) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}

export function decryptSession(value?: string): WhoopSession | null {
  if (!value) return null
  try {
    const payload = Buffer.from(value, 'base64url')
    const iv = payload.subarray(0, 12)
    const tag = payload.subarray(12, 28)
    const encrypted = payload.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'))
  } catch {
    return null
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export const getSession = (request: NextRequest) => decryptSession(request.cookies.get(COOKIE)?.value)
export const setSession = (response: NextResponse, session: WhoopSession) =>
  response.cookies.set(COOKIE, encryptSession(session), { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 })
export const clearSession = (response: NextResponse) => response.cookies.set(COOKIE, '', { ...cookieOptions, maxAge: 0 })
export const setOAuthState = (response: NextResponse, state: string) =>
  response.cookies.set(STATE_COOKIE, state, { ...cookieOptions, maxAge: 60 * 10 })
export const getOAuthState = (request: NextRequest) => request.cookies.get(STATE_COOKIE)?.value
export const clearOAuthState = (response: NextResponse) => response.cookies.set(STATE_COOKIE, '', { ...cookieOptions, maxAge: 0 })
