import type { DailyHealthInterpretation, PersonalBaseline, WearableDay } from '@/lib/types'

const below = (today?: number, average?: number, threshold = 0.94) =>
  today !== undefined && average !== undefined && today < average * threshold
const above = (today?: number, average?: number, threshold = 1.06) =>
  today !== undefined && average !== undefined && today > average * threshold
const signed = (value?: number) => value === undefined ? '—' : `${Math.abs(Math.round(value))}%`
const minutes = (value?: number) => value === undefined ? '—' : `${Math.floor(value / 60)} ч ${Math.round(value % 60)} мин`

export function interpretWearables(days: WearableDay[], baseline: PersonalBaseline): DailyHealthInterpretation {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const today: WearableDay = sorted.at(-1) ?? { date: new Date().toISOString().slice(0, 10) }
  const yesterday = sorted.at(-2)
  const lowSleep = below(today.sleepDurationMinutes, baseline.sleepDuration.average)
  const lowHrv = below(today.hrvMs, baseline.hrv.average)
  const highRhr = above(today.restingHeartRate, baseline.restingHeartRate.average)
  const sleepDebt = sorted.slice(-3).filter(day => below(day.sleepDurationMinutes, baseline.sleepDuration.average)).length >= 2
  const overload = !!yesterday && above(yesterday.strain, baseline.strain.average, 1.15) && (today.recoveryScore ?? 100) < 50 && lowHrv
  const ready = (today.recoveryScore ?? 0) >= 67 && !lowSleep && !lowHrv && !highRhr
  const stress = !today.hasWorkout && (today.strain ?? 0) <= (baseline.strain.average ?? 12) && lowHrv && highRhr

  let status: DailyHealthInterpretation['status'] = 'stable_day'
  let title = 'Сегодня стабильный день'
  let summary = 'Показатели близки к твоей личной норме. Можно сохранить привычный ритм и наблюдать за самочувствием.'
  if (overload) {
    status = 'overload'; title = 'Нагрузка выше готовности'
    summary = 'Похоже, вчерашняя нагрузка была выше текущей готовности организма. Сегодня лучше сделать акцент на восстановлении.'
  } else if (sleepDebt) {
    status = 'sleep_debt'; title = 'Накопился недосып'
    summary = 'Сон ниже твоей нормы уже несколько дней. Это может снижать восстановление, устойчивость к стрессу и контроль аппетита.'
  } else if (lowSleep && lowHrv && highRhr) {
    status = 'recovery_mode'; title = 'Сегодня режим восстановления'
    summary = 'Организм восстановился хуже обычного: сон короче нормы, HRV ниже среднего, а ночной пульс выше.'
  } else if (stress) {
    status = 'stress_signal'; title = 'Есть стресс-сигнал'
    summary = 'Нагрузка могла быть не физической, а стрессовой. Низкий HRV и повышенный ночной пульс стоит сопоставить с самочувствием.'
  } else if (ready) {
    status = 'ready_for_load'; title = 'Сегодня можно добавить нагрузку'
    summary = 'Организм выглядит восстановленным. Можно планировать тренировку или более активный день, если нет жалоб.'
  }

  return {
    status, title, summary,
    keyFactors: [
      {
        label: 'Сон',
        value: minutes(today.sleepDurationMinutes),
        explanation: baseline.sleepDuration.delta && baseline.sleepDuration.delta < 0
          ? `ниже личной нормы на ${minutes(Math.abs(baseline.sleepDuration.delta))}`
          : 'близко к личной норме',
        direction: lowSleep ? 'warning' : 'good',
      },
      {
        label: 'HRV',
        value: today.hrvMs ? `${Math.round(today.hrvMs)} мс` : '—',
        explanation: `${lowHrv ? 'ниже' : 'на уровне'} нормы на ${signed(baseline.hrv.deltaPercent)}`,
        direction: lowHrv ? 'warning' : 'good',
      },
      {
        label: 'Ночной пульс',
        value: today.restingHeartRate ? `${Math.round(today.restingHeartRate)} bpm` : '—',
        explanation: highRhr ? `выше нормы на ${Math.round(baseline.restingHeartRate.delta ?? 0)} bpm` : 'не выше личной нормы',
        direction: highRhr ? 'warning' : 'good',
      },
    ],
    todayPlan: [
      { area: 'activity', title: 'Снизить интенсивность', action: '20–40 минут прогулки или лёгкая зона 1–2 без тяжёлых интервалов.' },
      { area: 'nutrition', title: 'Поддержать восстановление', action: 'Добавить белок и сложные углеводы в основной приём пищи.' },
      { area: 'hydration', title: 'Вернуть воду', action: 'Распределить воду равномерно в течение дня; ориентироваться на жажду и нагрузку.' },
      { area: 'sleep', title: 'Защитить сон', action: 'Начать вечерний ритуал на 45 минут раньше и приглушить свет.' },
      { area: 'check_in', title: 'Проверить самочувствие', action: 'Отметить усталость, симптомы и уровень стресса вечером.' },
    ],
    healthosConnections: [
      { module: 'Среда', title: 'Питание для восстановления', description: 'Собрать простой рацион на день по текущей нагрузке.' },
      { module: 'Анализы', title: 'Связать с анализами', description: 'Проверить, есть ли лабораторные факторы усталости.' },
      { module: 'Врач', title: 'Подготовить данные врачу', description: 'Если есть симптомы, собрать понятное резюме наблюдений.' },
      { module: 'Health Memory', title: 'Сохранить паттерн', description: 'Добавить этот период в долгосрочную историю здоровья.' },
    ],
    disclaimer: 'Интерпретация основана на данных носимого устройства, не является диагнозом и не заменяет медицинскую консультацию.',
  }
}
