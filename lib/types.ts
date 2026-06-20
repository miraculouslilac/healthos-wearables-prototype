export type WearableDay = {
  date: string
  recoveryScore?: number
  hrvMs?: number
  restingHeartRate?: number
  sleepDurationMinutes?: number
  sleepPerformancePercent?: number
  strain?: number
  averageHeartRate?: number
  workoutCount?: number
  workoutStrain?: number
  calories?: number
  hasWorkout?: boolean
}

export type BaselineMetric = {
  average?: number
  today?: number
  delta?: number
  deltaPercent?: number
}

export type PersonalBaseline = {
  hrv: BaselineMetric
  restingHeartRate: BaselineMetric
  sleepDuration: BaselineMetric
  recovery: BaselineMetric
  strain: BaselineMetric
  sleepPerformance: BaselineMetric
}

export type DailyHealthInterpretation = {
  status: 'recovery_mode' | 'ready_for_load' | 'sleep_debt' | 'overload' | 'stress_signal' | 'stable_day'
  title: string
  summary: string
  keyFactors: Array<{
    label: string
    value: string
    explanation: string
    direction: 'good' | 'neutral' | 'warning'
  }>
  todayPlan: Array<{
    area: 'activity' | 'nutrition' | 'hydration' | 'sleep' | 'stress' | 'check_in'
    title: string
    action: string
  }>
  healthosConnections: Array<{
    module: 'Среда' | 'Анализы' | 'Врач' | 'Health Memory'
    title: string
    description: string
  }>
  disclaimer: string
}

export type RiskProfileZone = {
  id: 'recovery_stress' | 'sleep_circadian' | 'training_load' | 'metabolic_health' | 'cardio_load'
  title: string
  status: 'low' | 'moderate_attention' | 'attention_zone'
  summary: string
  signals: string[]
  futureImpact: string
  firstLever: string
}

export type LabMarker = {
  id: string
  name: string
  value: number
  unit: string
  status: 'low' | 'optimal' | 'borderline' | 'high'
}

export type LabWearablesMatch = {
  title: string
  summary: string
  matches: Array<{
    area: 'energy' | 'recovery' | 'metabolic' | 'inflammation' | 'thyroid' | 'cardio'
    wearableSignal: string
    labSignal: string
    interpretation: string
    nextStep: string
  }>
  disclaimer: string
}
