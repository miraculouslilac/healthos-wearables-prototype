import type { AdaptivePlan, AgentMessage, DailyHealthInterpretation, PersonalBaseline, WearableDay } from '@/lib/types'

export const HEALTHOS_AGENT_SYSTEM_PROMPT = `Ты — HealthOS Agent. Простым, спокойным языком объясняй данные носимого устройства и меняй план пользователя под сон, восстановление, нагрузку и самочувствие. Не ставь диагнозы и не назначай лечение. При тревожных симптомах убери нагрузку и посоветуй медицинскую помощь. Ответ — максимум 5–7 коротких предложений.`

const item = (id: string, area: AdaptivePlan['today'][number]['area'], title: string, description: string, changed = false) =>
  ({ id, area, title, description, changed })

export function createAdaptivePlan(interpretation: DailyHealthInterpretation): AdaptivePlan {
  return {
    title: interpretation.status === 'ready_for_load' ? 'Активный день без перегруза' : 'Спокойный день для восстановления',
    today: interpretation.todayPlan.slice(0, 5).map((entry, index) =>
      item(`base-${index}`, entry.area, entry.title, entry.action)),
    week: [
      item('week-sleep', 'sleep', '2–3 раза лечь раньше', 'Посмотреть, станет ли лучше восстановление и ночной пульс.'),
      item('week-rest', 'activity', '1 день без высокой нагрузки', 'Оставить прогулку или лёгкое движение и дать телу отдохнуть.'),
    ],
  }
}

const hasAny = (text: string, words: string[]) => words.some(word => text.includes(word))

export function adaptPlanWithAgent(
  input: string,
  current: AdaptivePlan,
  days: WearableDay[],
  baseline: PersonalBaseline,
): { plan: AdaptivePlan; message: AgentMessage } {
  const text = input.toLowerCase()
  const today = days.at(-1)
  const lowRecovery = (today?.recoveryScore ?? 100) < 50
  const lowHrv = (today?.hrvMs ?? Infinity) < (baseline.hrv.average ?? 0) * .94
  const highRhr = (today?.restingHeartRate ?? 0) > (baseline.restingHeartRate.average ?? Infinity) * 1.06
  const danger = hasAny(text, ['боль в груди', 'сильная одышка', 'обморок', 'спутанност', 'низкая сатурац', 'кровь', 'сильная боль', 'онемел', 'паралич', 'резко ухудш', 'необычно высокий пульс'])
  const fever = hasAny(text, ['температур', 'лихорад'])
  const ill = danger || fever || hasAny(text, ['болит горло', 'плохо себя чувств', 'сильная слабость', 'простуд'])
  const short = hasAny(text, ['20 минут', 'мало времени', 'нет времени'])
  const wantsRun = hasAny(text, ['5 км', 'пробеж', 'бег'])
  const wantsStrength = hasAny(text, ['силов'])
  const softer = hasAny(text, ['мягче', 'мягкий день', 'сильно устал', 'плохо спал'])
  const active = hasAny(text, ['активнее', 'всё равно хочу тренировку', 'хочу тренировку'])
  const week = hasAny(text, ['план на неделю', 'неделю'])
  let plan: AdaptivePlan
  let response: string

  if (danger || fever) {
    plan = {
      ...current,
      title: 'Отдых и проверка самочувствия',
      today: [
        item('safe-rest', 'activity', 'Убрать тренировку', 'Сегодня не делать интенсивную нагрузку.', true),
        item('safe-water', 'hydration', 'Вода и отдых', 'Пить по жажде и дать себе спокойный день.', true),
        item('safe-check', 'check_in', 'Следить за симптомами', 'Проверить температуру и самочувствие вечером.', true),
        item('safe-sleep', 'sleep', 'Ранний сон', 'Лечь на 30–45 минут раньше.', true),
        item('safe-medical', 'medical', 'Обратиться за помощью при ухудшении', 'При боли в груди, сильной одышке, обмороке, спутанности или быстром ухудшении нужна срочная медицинская помощь.', true),
      ],
      safetyNote: 'При таких симптомах лучше не тренироваться и не пытаться «перетерпеть».',
      updatedAt: new Date().toISOString(),
    }
    response = `Ок, убираю нагрузку из плана. Почему: симптомы важнее показателей WHOOP, а температура или тревожные признаки означают, что телу нужен отдых. Новый план — покой, вода, контроль симптомов и ранний сон. Если есть боль в груди, сильная одышка, обморок, спутанность или состояние быстро ухудшается — нужна срочная медицинская помощь.`
  } else if (ill || softer) {
    plan = {
      ...current,
      title: 'Более мягкий день',
      today: [
        item('soft-walk', 'activity', 'Прогулка по самочувствию', '15–30 минут без цели держать темп.', true),
        item('soft-food', 'nutrition', 'Нормальный приём пищи', 'Добавить белок, углеводы и не пропускать еду.', true),
        item('soft-check', 'check_in', 'Проверить симптомы', 'Вечером оценить температуру, горло, слабость и общее состояние.', true),
        item('soft-sleep', 'sleep', 'Лечь раньше', 'Начать готовиться ко сну на 45 минут раньше.', true),
      ],
      safetyNote: ill ? 'Если симптомы усиливаются или появляется температура, тренировку лучше убрать полностью.' : undefined,
      updatedAt: new Date().toISOString(),
    }
    response = `Ок, делаю план мягче. Почему: по твоему сообщению телу сейчас важнее восстановление, чем выполнение всего списка. Новый план — короткая прогулка по самочувствию, нормальная еда, проверка симптомов и ранний сон. Если станет хуже или появится температура, нагрузку лучше убрать полностью.`
  } else if (short) {
    plan = {
      ...current,
      title: 'Минимальный план на 20 минут',
      today: [
        item('short-walk', 'activity', '10 минут прогулки', 'Спокойный темп, можно разбить на две короткие части.', true),
        item('short-breathe', 'stress', '5 минут дыхания или растяжки', 'Без сложной техники — просто немного замедлиться.', true),
        item('short-water', 'hydration', 'Подготовить воду', 'Поставить бутылку рядом, чтобы не забывать пить.', true),
        item('short-sleep', 'sleep', 'Лечь раньше', 'Сдвинуть сон хотя бы на 30 минут.', true),
      ],
      updatedAt: new Date().toISOString(),
    }
    response = `Ок, сокращаю план до 20 минут. Почему: сейчас важнее сделать небольшой полезный минимум, чем не сделать ничего. Новый план — 10 минут прогулки, 5 минут растяжки или дыхания, подготовить воду и лечь немного раньше.`
  } else if (wantsRun || wantsStrength || active) {
    const caution = lowRecovery || lowHrv || highRhr
    plan = {
      ...current,
      title: caution ? 'Активность без погони за результатом' : 'Активный день',
      today: [
        item('active-main', 'activity', wantsStrength ? 'Лёгкая силовая' : 'Лёгкий бег или активная прогулка', caution ? '20–30 минут в лёгком темпе, без интервалов и отказных подходов.' : 'Обычная тренировка без попытки поставить рекорд.', true),
        item('active-limit', 'check_in', 'Остановиться при ухудшении', 'Не продолжать при слабости, головокружении, боли в груди или одышке.', true),
        item('active-food', 'nutrition', 'Поесть после активности', 'Добавить белок и углеводы.', true),
        item('active-sleep', 'sleep', 'Не жертвовать сном', 'Сохранить ранний отбой, даже если тренировка состоялась.', true),
      ],
      updatedAt: new Date().toISOString(),
    }
    response = caution
      ? `Ок, оставляю активность, но делаю её безопаснее. Почему: восстановление сейчас без большого запаса. Новый план — 20–30 минут в лёгком темпе, без интервалов и рекордов. Остановись, если появятся слабость, головокружение, боль в груди или одышка.`
      : `Ок, добавляю активность. Показатели позволяют обычную тренировку, если самочувствие нормальное. Не нужно идти на рекорд: оставь запас и сохрани сон и питание после нагрузки.`
  } else if (week) {
    plan = {
      ...current,
      week: [
        item('week-early', 'sleep', '3 вечера лечь раньше', 'Сдвинуть сон на 30–45 минут и посмотреть на восстановление.', true),
        item('week-light', 'activity', '2 лёгких дня', 'Прогулка или лёгкая нагрузка без интервалов.', true),
        item('week-check', 'check_in', 'Короткий вечерний check-in', 'Отмечать энергию, стресс и симптомы.', true),
      ],
      updatedAt: new Date().toISOString(),
    }
    response = `Ок, обновляю план на неделю. Главное — три более ранних вечера, два лёгких дня и короткая проверка самочувствия. Почему: так будет проще увидеть, меняются ли сон, HRV и ночной пульс.`
  } else {
    plan = { ...current, updatedAt: new Date().toISOString() }
    response = `Я поняла запрос, но хочу изменить план точнее. Напиши, что сейчас важнее: убрать тренировку, сделать день мягче, сократить план до 20 минут или добавить активность.`
  }

  return {
    plan,
    message: {
      id: crypto.randomUUID(),
      role: 'agent',
      text: response,
      planUpdated: plan !== current,
      createdAt: new Date().toISOString(),
    },
  }
}
