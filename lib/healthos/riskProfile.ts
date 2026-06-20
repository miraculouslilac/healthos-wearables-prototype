import type { PersonalBaseline, RiskProfileZone, WearableDay } from '@/lib/types'

const count = (days: WearableDay[], predicate: (day: WearableDay) => boolean) => days.filter(predicate).length
const lower = (value?: number, avg?: number) => value !== undefined && avg !== undefined && value < avg * .94
const higher = (value?: number, avg?: number, threshold = 1.06) => value !== undefined && avg !== undefined && value > avg * threshold
const status = (signals: number, severe = 3): RiskProfileZone['status'] =>
  signals >= severe ? 'attention_zone' : signals >= 1 ? 'moderate_attention' : 'low'

export function buildRiskProfile(days: WearableDay[], baseline: PersonalBaseline): RiskProfileZone[] {
  const week = [...days].sort((a, b) => a.date.localeCompare(b.date)).slice(-7)
  const lowHrv = count(week, d => lower(d.hrvMs, baseline.hrv.average))
  const highRhr = count(week, d => higher(d.restingHeartRate, baseline.restingHeartRate.average))
  const lowRecovery = count(week, d => lower(d.recoveryScore, baseline.recovery.average))
  const shortSleep = count(week, d => lower(d.sleepDurationMinutes, baseline.sleepDuration.average))
  const poorSleep = count(week, d => lower(d.sleepPerformancePercent, baseline.sleepPerformance.average))
  const highStrain = count(week, d => higher(d.strain, baseline.strain.average, 1.12))
  const trainingDays = count(week, d => !!d.hasWorkout)

  return [
    {
      id: 'recovery_stress', title: 'Восстановление и стресс',
      status: status(Math.min(lowHrv, highRhr, lowRecovery)),
      summary: `${lowHrv} из 7 дней HRV был ниже личной нормы, ${highRhr} дней ночной пульс был выше.`,
      signals: [`HRV ниже нормы: ${lowHrv} дней`, `RHR выше нормы: ${highRhr} дней`, `Recovery ниже нормы: ${lowRecovery} дней`],
      futureImpact: 'Если паттерн сохранится, может накапливаться усталость и снижаться переносимость нагрузки.',
      firstLever: 'Вернуть 1–2 спокойных дня и проверить сон, стресс и симптомы.',
    },
    {
      id: 'sleep_circadian', title: 'Сон и циркадный ритм',
      status: status(Math.max(shortSleep, poorSleep), 4),
      summary: `${shortSleep} из 7 ночей сон был короче твоей нормы.`,
      signals: [`Короткий сон: ${shortSleep} ночей`, `Sleep performance ниже нормы: ${poorSleep} ночей`],
      futureImpact: 'Регулярный недосып может влиять на энергию, аппетит, восстановление и тренировочную адаптацию.',
      firstLever: 'Главный рычаг недели — вернуть стабильное время отбоя и личную норму сна.',
    },
    {
      id: 'training_load', title: 'Нагрузка и перетренированность',
      status: status(highStrain + (lowRecovery >= 3 ? 1 : 0) + (trainingDays >= 5 ? 1 : 0), 3),
      summary: `${trainingDays} тренировочных дней за неделю; в ${lowRecovery} дней восстановление было ниже нормы.`,
      signals: [`Высокий strain: ${highStrain} дней`, `Тренировки: ${trainingDays} дней`, `Низкое восстановление: ${lowRecovery} дней`],
      futureImpact: 'Когда нагрузка растёт быстрее восстановления, может повышаться вероятность перегрузки и снижения адаптации.',
      firstLever: 'Снизить интенсивность на 1–2 дня и посмотреть на динамику HRV и сна.',
    },
    {
      id: 'metabolic_health', title: 'Метаболическое здоровье',
      status: shortSleep >= 3 || (highStrain >= 2 && lowRecovery >= 3) ? 'moderate_attention' : 'low',
      summary: 'WHOOP не измеряет метаболические маркеры напрямую, но сон и восстановление дают полезный контекст.',
      signals: [`Короткий сон: ${shortSleep} дней`, `Нестабильное восстановление: ${lowRecovery} дней`],
      futureImpact: 'Сон и восстановление могут влиять на аппетит, энергию и метаболическую устойчивость.',
      firstLever: 'Связать паттерны с глюкозой, инсулином, HbA1c и липидным профилем.',
    },
    {
      id: 'cardio_load', title: 'Сердечно-сосудистая нагрузка',
      status: status(Math.min(highRhr, lowHrv) + (shortSleep >= 3 ? 1 : 0), 4),
      summary: `Ночной пульс был выше обычного ${highRhr} дней одновременно со снижением HRV.`,
      signals: [`RHR выше нормы: ${highRhr} дней`, `HRV ниже нормы: ${lowHrv} дней`],
      futureImpact: 'Такой паттерн может быть связан со стрессом, недосыпом, высокой нагрузкой или началом заболевания.',
      firstLever: 'Снизить нагрузку и при симптомах обсудить наблюдения со специалистом.',
    },
  ]
}
