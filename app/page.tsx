import { TodayClient } from '@/components/TodayClient'
import { demoWearableDays } from '@/lib/demo/data'
import { calculatePersonalBaseline } from '@/lib/healthos/personalBaseline'
import { buildRiskProfile } from '@/lib/healthos/riskProfile'
import { interpretWearables } from '@/lib/healthos/wearablesInterpreter'

export default function Home() {
  const baseline = calculatePersonalBaseline(demoWearableDays)
  return <TodayClient initialData={{
    mode: 'demo',
    days: demoWearableDays,
    baseline,
    interpretation: interpretWearables(demoWearableDays, baseline),
    risks: buildRiskProfile(demoWearableDays, baseline),
  }} />
}
