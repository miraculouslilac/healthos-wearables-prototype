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
      id: 'recovery_stress', title: 'Организм часто не успевает восстановиться',
      status: status(Math.min(lowHrv, highRhr, lowRecovery)),
      summary: `${lowHrv} из 7 дней HRV был ниже личной нормы, ${highRhr} дней ночной пульс был выше.`,
      signals: [`HRV ниже нормы: ${lowHrv} дней`, `RHR выше нормы: ${highRhr} дней`, `Recovery ниже нормы: ${lowRecovery} дней`],
      futureImpact: 'Если так будет повторяться, усталость может накапливаться, а обычные дела — даваться тяжелее.',
      firstLever: 'Сделать 1–2 спокойных дня и проверить сон, стресс и самочувствие.',
    },
    {
      id: 'sleep_circadian', title: 'Сон короче твоей нормы',
      status: status(Math.max(shortSleep, poorSleep), 4),
      summary: `${shortSleep} из 7 ночей сон был короче твоей нормы.`,
      signals: [`Короткий сон: ${shortSleep} ночей`, `Sleep performance ниже нормы: ${poorSleep} ночей`],
      futureImpact: 'Из-за этого восстановление может падать, а усталость и тяга к кофеину — накапливаться.',
      firstLever: 'Попробовать 2–3 вечера лечь на 45 минут раньше и посмотреть, станет ли лучше.',
    },
    {
      id: 'training_load', title: 'Нагрузки больше, чем восстановления',
      status: status(highStrain + (lowRecovery >= 3 ? 1 : 0) + (trainingDays >= 5 ? 1 : 0), 3),
      summary: `${trainingDays} тренировочных дней за неделю; в ${lowRecovery} дней восстановление было ниже нормы.`,
      signals: [`Высокий strain: ${highStrain} дней`, `Тренировки: ${trainingDays} дней`, `Низкое восстановление: ${lowRecovery} дней`],
      futureImpact: 'Если постоянно тренироваться без отдыха, усталость может расти, а результат — становиться хуже.',
      firstLever: 'Снизить интенсивность на 1–2 дня и посмотреть, изменятся ли HRV и сон.',
    },
    {
      id: 'metabolic_health', title: 'Нужно связать с анализами',
      status: shortSleep >= 3 || (highStrain >= 2 && lowRecovery >= 3) ? 'moderate_attention' : 'low',
      summary: 'WHOOP не показывает сахар, инсулин и холестерин напрямую. Он только даёт подсказки по сну, энергии и восстановлению.',
      signals: [`Короткий сон: ${shortSleep} дней`, `Нестабильное восстановление: ${lowRecovery} дней`],
      futureImpact: 'Если сон плохой и энергии мало, анализы помогут проверить, есть ли дополнительные причины.',
      firstLever: 'Связать паттерны с глюкозой, инсулином, HbA1c и липидным профилем.',
    },
    {
      id: 'cardio_load', title: 'Пульс выше обычного ночью',
      status: status(Math.min(highRhr, lowHrv) + (shortSleep >= 3 ? 1 : 0), 4),
      summary: `Ночной пульс был выше обычного ${highRhr} дней одновременно со снижением HRV.`,
      signals: [`RHR выше нормы: ${highRhr} дней`, `HRV ниже нормы: ${lowHrv} дней`],
      futureImpact: 'Так бывает после стресса, недосыпа, алкоголя, поздней еды, тяжёлой тренировки или при простуде.',
      firstLever: 'Снизить нагрузку и при симптомах обсудить наблюдения со специалистом.',
    },
  ]
}
