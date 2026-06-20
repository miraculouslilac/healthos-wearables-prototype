import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { demoWearableDays } from '@/lib/demo/data'
import { calculatePersonalBaseline } from '@/lib/healthos/personalBaseline'
import { buildRiskProfile } from '@/lib/healthos/riskProfile'
import { interpretWearables } from '@/lib/healthos/wearablesInterpreter'
import { fetchWhoopData, refreshWhoopSession } from '@/lib/whoop/client'
import { normalizeWhoopData } from '@/lib/whoop/normalizeWhoopData'
import { getSession, setSession } from '@/lib/whoop/session'

const payload = (days = demoWearableDays, mode: 'live' | 'demo' = 'demo') => {
  const baseline = calculatePersonalBaseline(days)
  return { mode, days, baseline, interpretation: interpretWearables(days, baseline), risks: buildRiskProfile(days, baseline) }
}

export async function GET(request: NextRequest) {
  let session = getSession(request)
  if (!session) return NextResponse.json(payload())
  try {
    if (session.expiresAt < Date.now() + 60_000) session = await refreshWhoopSession(session)
    const raw = await fetchWhoopData(session)
    const days = normalizeWhoopData(raw)
    if (!days.length) return NextResponse.json(payload())
    const response = NextResponse.json({ ...payload(days, 'live'), profile: raw.profile, body: raw.body })
    setSession(response, session)
    return response
  } catch {
    return NextResponse.json({ ...payload(), fallbackReason: 'whoop_unavailable' })
  }
}
