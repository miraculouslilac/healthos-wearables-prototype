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
  let title = 'Можно двигаться в обычном ритме'
  let summary = 'Показатели близки к твоей норме. Можно сохранить привычный ритм, если самочувствие тоже нормальное.'
  if (overload) {
    status = 'overload'; title = 'Сегодня лучше восстановиться'
    summary = 'Вчера нагрузка была высокой, а сегодня восстановление и HRV ниже обычного. Телу может не хватать отдыха, поэтому тяжёлую тренировку лучше отложить.'
  } else if (sleepDebt) {
    status = 'sleep_debt'; title = 'Сон просел — нагрузку лучше снизить'
    summary = 'Ты спала меньше своей нормы несколько дней подряд. Из-за этого может быстрее появляться усталость и сильнее хотеться кофеина или сладкого.'
  } else if (lowSleep && lowHrv && highRhr) {
    status = 'recovery_mode'; title = 'Сегодня лучше восстановиться'
    summary = 'Ты спала меньше обычного, HRV ниже нормы, а ночной пульс выше. Обычно так бывает, когда телу нужно больше восстановления.'
  } else if (stress) {
    status = 'stress_signal'; title = 'Похоже, телу нужен спокойный день'
    summary = 'Тренировки не было, но HRV ниже, а ночной пульс выше обычного. Причиной могут быть стресс, недосып, поздняя еда, алкоголь или начало простуды.'
  } else if (ready) {
    status = 'ready_for_load'; title = 'Организм готов к нагрузке'
    summary = 'Сон, HRV и ночной пульс выглядят спокойно. Можно планировать более активный день, если самочувствие тоже нормальное.'
  }

  return {
    status, title, summary,
    keyFactors: [
      {
        key: 'sleep',
        label: 'Сон',
        value: minutes(today.sleepDurationMinutes),
        explanation: baseline.sleepDuration.delta && baseline.sleepDuration.delta < 0
          ? `ниже личной нормы на ${minutes(Math.abs(baseline.sleepDuration.delta))}`
          : 'близко к личной норме',
        plainMeaning: lowSleep
          ? 'Организму могло не хватить времени на восстановление.'
          : 'Сна было достаточно для твоего обычного восстановления.',
        todayAction: lowSleep ? 'Лечь сегодня на 30–45 минут раньше.' : 'Сохранить привычное время сна.',
        direction: lowSleep ? 'warning' : 'good',
      },
      {
        key: 'hrv',
        label: 'HRV',
        value: today.hrvMs ? `${Math.round(today.hrvMs)} мс` : '—',
        explanation: lowHrv ? `ниже твоей нормы на ${signed(baseline.hrv.deltaPercent)}` : 'на уровне твоей нормы',
        plainMeaning: lowHrv
          ? 'Нервная система выглядит уставшей или перегруженной. Это не обязательно означает болезнь.'
          : 'Организм спокойно реагирует на обычную нагрузку.',
        todayAction: lowHrv ? 'Снизить интенсивность и проверить самочувствие.' : 'Можно оставить обычную активность.',
        direction: lowHrv ? 'warning' : 'good',
      },
      {
        key: 'rhr',
        label: 'Ночной пульс',
        value: today.restingHeartRate ? `${Math.round(today.restingHeartRate)} bpm` : '—',
        explanation: highRhr ? `выше нормы на ${Math.round(baseline.restingHeartRate.delta ?? 0)} bpm` : 'не выше личной нормы',
        plainMeaning: highRhr
          ? 'Тело работало активнее даже во сне. Так бывает после стресса, поздней еды, алкоголя, жары, тренировки или при простуде.'
          : 'Во сне тело работало в привычном спокойном режиме.',
        todayAction: highRhr ? 'Не делать тяжёлую тренировку и добавить отдых.' : 'Ориентироваться на самочувствие.',
        direction: highRhr ? 'warning' : 'good',
      },
      ...(yesterday?.strain !== undefined ? [{
        key: 'strain' as const,
        label: 'Нагрузка вчера',
        value: yesterday.strain.toFixed(1),
        explanation: above(yesterday.strain, baseline.strain.average, 1.15) ? 'была выше твоей обычной' : 'была привычной',
        plainMeaning: 'Нагрузка показывает, насколько тяжёлым для организма был день или тренировка.',
        todayAction: above(yesterday.strain, baseline.strain.average, 1.15) ? 'Дать телу паузу от высокой интенсивности.' : 'Можно сохранить обычный ритм.',
        direction: above(yesterday.strain, baseline.strain.average, 1.15) ? 'warning' as const : 'neutral' as const,
      }] : []),
    ],
    todayPlan: [
      { area: 'activity', title: 'Без тяжёлой тренировки', action: '20–40 минут прогулки или очень лёгкая нагрузка без интервалов.' },
      { area: 'nutrition', title: 'Нормально поесть', action: 'Добавить белок и углеводы: например, рыбу или яйца с крупой и овощами.' },
      { area: 'hydration', title: 'Не забыть про воду', action: 'Пить в течение дня, особенно если было жарко или была тренировка.' },
      { area: 'sleep', title: 'Лечь раньше', action: 'Начать готовиться ко сну на 45 минут раньше и убрать яркий свет.' },
      { area: 'check_in', title: 'Проверить самочувствие', action: 'Вечером отметить усталость, стресс и симптомы, если они появились.' },
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
