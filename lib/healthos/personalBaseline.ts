import type { PersonalBaseline, WearableDay } from '@/lib/types'

const average = (values: Array<number | undefined>) => {
  const valid = values.filter((value): value is number => typeof value === 'number')
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : undefined
}

const metric = (values: Array<number | undefined>, today?: number) => {
  const historical = values.slice(0, -1)
  const avg = average(historical.length ? historical : values)
  const delta = avg !== undefined && today !== undefined ? today - avg : undefined
  return {
    average: avg,
    today,
    delta,
    deltaPercent: delta !== undefined && avg ? (delta / avg) * 100 : undefined,
  }
}

export function calculatePersonalBaseline(days: WearableDay[]): PersonalBaseline {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date)).slice(-30)
  const today = sorted.at(-1)
  return {
    hrv: metric(sorted.map(day => day.hrvMs), today?.hrvMs),
    restingHeartRate: metric(sorted.map(day => day.restingHeartRate), today?.restingHeartRate),
    sleepDuration: metric(sorted.map(day => day.sleepDurationMinutes), today?.sleepDurationMinutes),
    recovery: metric(sorted.map(day => day.recoveryScore), today?.recoveryScore),
    strain: metric(sorted.map(day => day.strain), today?.strain),
    sleepPerformance: metric(sorted.map(day => day.sleepPerformancePercent), today?.sleepPerformancePercent),
  }
}
