import type { LabMarker, WearableDay } from '@/lib/types'

const date = (offset: number) => {
  const value = new Date()
  value.setDate(value.getDate() - offset)
  return value.toISOString().slice(0, 10)
}

const base = [
  [42, 62, 438, 78, 11.2], [44, 61, 451, 81, 12.8], [43, 62, 444, 79, 10.4],
  [45, 60, 462, 84, 13.1], [41, 63, 426, 75, 9.8], [46, 60, 470, 86, 14.2],
  [44, 61, 455, 82, 11.9],
]

export const demoWearableDays: WearableDay[] = Array.from({ length: 30 }, (_, index) => {
  const values = base[index % base.length]
  return {
    date: date(29 - index),
    hrvMs: values[0] + ((index % 3) - 1),
    restingHeartRate: values[1] + (index % 2),
    sleepDurationMinutes: values[2] + (index % 4) * 3,
    sleepPerformancePercent: values[3] + (index % 3),
    recoveryScore: 64 + (index % 5) * 4,
    strain: values[4],
    workoutCount: index % 3 === 0 ? 1 : 0,
    workoutStrain: index % 3 === 0 ? values[4] : 0,
    hasWorkout: index % 3 === 0,
    calories: 2050 + index * 11,
  }
})

demoWearableDays.splice(-4, 4,
  { date: date(3), hrvMs: 35, restingHeartRate: 67, sleepDurationMinutes: 355, sleepPerformancePercent: 66, recoveryScore: 46, strain: 15.8, workoutCount: 1, workoutStrain: 15.8, hasWorkout: true },
  { date: date(2), hrvMs: 34, restingHeartRate: 68, sleepDurationMinutes: 348, sleepPerformancePercent: 64, recoveryScore: 42, strain: 14.9, workoutCount: 1, workoutStrain: 14.9, hasWorkout: true },
  { date: date(1), hrvMs: 33, restingHeartRate: 69, sleepDurationMinutes: 365, sleepPerformancePercent: 68, recoveryScore: 39, strain: 16.7, workoutCount: 1, workoutStrain: 16.7, hasWorkout: true },
  { date: date(0), hrvMs: 34, restingHeartRate: 69, sleepDurationMinutes: 370, sleepPerformancePercent: 69, recoveryScore: 41, strain: 5.2, workoutCount: 0, workoutStrain: 0, hasWorkout: false },
)

export const demoLabs: LabMarker[] = [
  { id: 'ferritin', name: 'Ферритин', value: 18, unit: 'нг/мл', status: 'low' },
  { id: 'vitamin_d', name: 'Витамин D', value: 22, unit: 'нг/мл', status: 'low' },
  { id: 'glucose', name: 'Глюкоза', value: 5.8, unit: 'ммоль/л', status: 'borderline' },
  { id: 'hba1c', name: 'HbA1c', value: 5.7, unit: '%', status: 'borderline' },
  { id: 'crp', name: 'С-реактивный белок', value: 6.2, unit: 'мг/л', status: 'high' },
  { id: 'tsh', name: 'ТТГ', value: 4.1, unit: 'мЕд/л', status: 'borderline' },
]
