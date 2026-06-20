import type { LabMarker, LabWearablesMatch, PersonalBaseline, WearableDay } from '@/lib/types'

export function matchLabsWithWearables(labs: LabMarker[], days: WearableDay[], baseline: PersonalBaseline): LabWearablesMatch {
  const week = [...days].sort((a, b) => a.date.localeCompare(b.date)).slice(-7)
  const affected = (...ids: string[]) => labs.filter(lab => ids.includes(lab.id) && lab.status !== 'optimal')
  const lowHrv = week.filter(day => (day.hrvMs ?? Infinity) < (baseline.hrv.average ?? 0) * .94).length
  const highRhr = week.filter(day => (day.restingHeartRate ?? 0) > (baseline.restingHeartRate.average ?? Infinity) * 1.06).length
  const shortSleep = week.filter(day => (day.sleepDurationMinutes ?? Infinity) < (baseline.sleepDuration.average ?? 0) * .94).length
  const matches: LabWearablesMatch['matches'] = []

  const energy = affected('ferritin', 'vitamin_d', 'b12', 'hemoglobin')
  if (lowHrv >= 3 && energy.length) matches.push({
    area: 'energy', wearableSignal: `HRV ниже личной нормы ${lowHrv} из 7 дней`,
    labSignal: energy.map(l => `${l.name}: ${l.value} ${l.unit}`).join(' · '),
    interpretation: 'Низкое восстановление может быть связано не только с нагрузкой и сном. Анализы показывают факторы, способные усиливать усталость.',
    nextStep: 'Обсудить показатели с врачом и оценить динамику после коррекции.',
  })
  const metabolic = affected('glucose', 'insulin', 'hba1c')
  if (shortSleep >= 3 && metabolic.length) matches.push({
    area: 'metabolic', wearableSignal: `Сон ниже нормы ${shortSleep} ночей за неделю`,
    labSignal: metabolic.map(l => `${l.name}: ${l.value} ${l.unit}`).join(' · '),
    interpretation: 'Паттерн сна и восстановления может быть важным контекстом для метаболического здоровья.',
    nextStep: 'Стабилизировать сон и обсудить повторную оценку маркеров со специалистом.',
  })
  const inflammation = affected('crp')
  if (highRhr >= 2 && lowHrv >= 2 && inflammation.length) matches.push({
    area: 'inflammation', wearableSignal: `RHR выше нормы ${highRhr} дней, HRV снижен ${lowHrv} дней`,
    labSignal: inflammation.map(l => `${l.name}: ${l.value} ${l.unit}`).join(' · '),
    interpretation: 'Данные WHOOP показывают повышенную нагрузку на организм, а лабораторный маркер требует контекстной оценки.',
    nextStep: 'При симптомах снизить активность и обратиться к врачу.',
  })
  const thyroid = affected('tsh')
  if (thyroid.length) matches.push({
    area: 'thyroid', wearableSignal: 'Восстановление нестабильно в течение недели',
    labSignal: thyroid.map(l => `${l.name}: ${l.value} ${l.unit}`).join(' · '),
    interpretation: 'Часть жалоб на энергию может быть связана не только со сном и нагрузкой.',
    nextStep: 'Обсудить показатель щитовидной железы со специалистом.',
  })

  return {
    title: `Я вижу ${matches.length} совпадения`,
    summary: 'Паттерны WHOOP и лабораторные показатели дополняют друг друга и помогают подготовить более точные вопросы врачу.',
    matches,
    disclaimer: 'Сопоставление помогает заметить паттерны, но не является диагнозом и не заменяет медицинскую консультацию.',
  }
}
