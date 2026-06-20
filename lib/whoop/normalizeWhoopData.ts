import type { WearableDay } from '@/lib/types'

type WhoopCollection = { records?: Array<Record<string, unknown>> }
type RawWhoopData = {
  cycles?: WhoopCollection
  recoveries?: WhoopCollection
  sleeps?: WhoopCollection
  workouts?: WhoopCollection
}

const numberAt = (record: Record<string, unknown>, path: string): number | undefined => {
  let value: unknown = record
  for (const key of path.split('.')) {
    if (!value || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[key]
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

const stringAt = (record: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string') return value
  }
}

const dayKey = (record: Record<string, unknown>) => {
  const date = stringAt(record, 'start', 'created_at', 'updated_at')
  return date?.slice(0, 10)
}

export function normalizeWhoopData(raw: RawWhoopData): WearableDay[] {
  const days = new Map<string, WearableDay>()
  const get = (key: string) => {
    if (!days.has(key)) days.set(key, { date: key, workoutCount: 0, workoutStrain: 0, hasWorkout: false })
    return days.get(key)!
  }

  for (const cycle of raw.cycles?.records ?? []) {
    const key = dayKey(cycle)
    if (!key) continue
    const day = get(key)
    day.strain = numberAt(cycle, 'score.strain')
    day.averageHeartRate = numberAt(cycle, 'score.average_heart_rate')
    day.calories = numberAt(cycle, 'score.kilojoule') !== undefined
      ? Math.round(numberAt(cycle, 'score.kilojoule')! / 4.184)
      : undefined
  }

  for (const recovery of raw.recoveries?.records ?? []) {
    const key = dayKey(recovery)
    if (!key) continue
    const day = get(key)
    day.recoveryScore = numberAt(recovery, 'score.recovery_score')
    day.hrvMs = numberAt(recovery, 'score.hrv_rmssd_milli')
    day.restingHeartRate = numberAt(recovery, 'score.resting_heart_rate')
  }

  for (const sleep of raw.sleeps?.records ?? []) {
    const key = dayKey(sleep)
    if (!key || sleep.nap === true) continue
    const day = get(key)
    const millis = numberAt(sleep, 'score.stage_summary.total_in_bed_time_milli')
    day.sleepDurationMinutes = millis !== undefined ? Math.round(millis / 60000) : undefined
    day.sleepPerformancePercent = numberAt(sleep, 'score.sleep_performance_percentage')
  }

  for (const workout of raw.workouts?.records ?? []) {
    const key = dayKey(workout)
    if (!key) continue
    const day = get(key)
    day.workoutCount = (day.workoutCount ?? 0) + 1
    day.workoutStrain = Math.max(day.workoutStrain ?? 0, numberAt(workout, 'score.strain') ?? 0)
    day.hasWorkout = true
  }

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}
