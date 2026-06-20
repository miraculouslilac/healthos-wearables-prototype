import { PlanClient } from '@/components/PlanClient'
import { demoWearableDays } from '@/lib/demo/data'
import { calculatePersonalBaseline } from '@/lib/healthos/personalBaseline'
import { interpretWearables } from '@/lib/healthos/wearablesInterpreter'

export default function PlanPage() {
  const baseline = calculatePersonalBaseline(demoWearableDays)
  const interpretation = interpretWearables(demoWearableDays, baseline)
  return <PlanClient days={demoWearableDays} baseline={baseline} interpretation={interpretation} />
}
