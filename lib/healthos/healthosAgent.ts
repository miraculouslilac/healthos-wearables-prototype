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
  const ill = danger || fever || hasAny(text, ['болит горло', 'плохо себя чувств', 'сильная слабость', 'простуд', 'заболел', 'заболела', 'болею', 'разболел'])
  const short = hasAny(text, ['20 минут', 'мало времени', 'нет времени'])
  const wantsRun = hasAny(text, ['5 км', 'пробеж', 'бег'])
  const wantsStrength = hasAny(text, ['силов'])
  const softer = hasAny(text, ['мягче', 'мягкий день', 'сильно устал', 'плохо спал'])
  const active = hasAny(text, ['активнее', 'всё равно хочу тренировку', 'хочу тренировку'])
  const week = hasAny(text, ['план на неделю', 'неделю'])
  const decide = hasAny(text, ['реши сам', 'реши сама', 'на твое усмотрение', 'на твоё усмотрение', 'как лучше', 'что мне делать', 'выбери сам'])
  const asksWhy = hasAny(text, ['почему', 'объясни', 'откуда такой вывод'])
  const asksCoffee = hasAny(text, ['кофе', 'кофеин'])
  const asksFood = hasAny(text, ['есть', 'поесть', 'еда', 'питание', 'сладк'])
  const stress = hasAny(text, ['стресс', 'нервнича', 'дедлайн', 'работы много', 'тревож'])
  const travel = hasAny(text, ['поездк', 'перелет', 'перелёт', 'дорог'])
  const cycle = hasAny(text, ['цикл', 'месячн', 'менструац'])
  const sleepQuestion = hasAny(text, ['сон', 'спать', 'выспал', 'не спала', 'не спал'])
  let plan: AdaptivePlan
  let response: string
  let planUpdated = true

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
  } else if (ill || softer || decide && (lowRecovery || lowHrv || highRhr)) {
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
    response = ill
      ? `Поняла. Раз ты заболела, я убираю тренировку и делаю день мягче. Новый план — отдых, вода, нормальная еда, проверка температуры и ранний сон. Если состояние ухудшается, появляется высокая температура, боль в груди или одышка — лучше обратиться за медицинской помощью.`
      : `Ок, решаю по твоим показателям: сегодня лучше сделать день мягче. Восстановление сейчас без большого запаса, поэтому оставляю короткую прогулку, нормальную еду, проверку самочувствия и ранний сон.`
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
  } else if (stress || travel || cycle) {
    plan = {
      ...current,
      title: stress ? 'День с меньшим давлением на себя' : travel ? 'План для дня в дороге' : 'Более гибкий план на сегодня',
      today: [
        item('context-move', 'activity', 'Небольшое движение', travel ? 'Пройтись 10–20 минут, когда будет возможность.' : '15–30 минут прогулки без цели выполнить норму.', true),
        item('context-food', 'nutrition', 'Не пропускать еду', 'Выбрать простой нормальный приём пищи с белком и углеводами.', true),
        item('context-pause', 'stress', 'Короткая пауза', '5 минут без экрана, чтобы немного снизить напряжение.', true),
        item('context-sleep', 'sleep', 'Защитить сон', 'Не отнимать время у сна ради выполнения всего плана.', true),
      ],
      updatedAt: new Date().toISOString(),
    }
    response = stress
      ? `Поняла, учитываю стресс и дедлайны. Я сокращаю требования к дню: немного движения, нормальная еда, короткая пауза и сон без попытки успеть всё. Стресс тоже может снижать HRV и повышать ночной пульс, даже если тренировки не было.`
      : travel
        ? `Поняла, подстраиваю план под дорогу. Главное сегодня — немного пройтись, не забыть воду и еду и не жертвовать сном. Идеальный режим в поездке не нужен.`
        : `Поняла, учитываю цикл. В такие дни энергия и температура кожи могут меняться, поэтому лучше ориентироваться и на самочувствие, а не только на цифры WHOOP. Я сделала план гибче и убрала максимальную нагрузку.`
  } else if (asksWhy) {
    plan = current
    planUpdated = false
    response = `Я смотрю не на одну цифру, а на сочетание данных относительно твоей нормы. Сегодня recovery ${Math.round(today?.recoveryScore ?? 0)}, HRV ${Math.round(today?.hrvMs ?? 0)} мс, а ночной пульс ${Math.round(today?.restingHeartRate ?? 0)} bpm. ${lowRecovery || lowHrv || highRhr ? 'Вместе это похоже на день без большого запаса, поэтому план осторожнее.' : 'Показатели выглядят спокойно, поэтому строгих ограничений в плане нет.'}`
  } else if (asksCoffee) {
    plan = current
    planUpdated = false
    response = `Кофе можно, если ты обычно его хорошо переносишь. Но при плохом сне он может замаскировать усталость, а поздний кофеин — снова ухудшить сон. Лучше оставить обычную порцию в первой половине дня и не использовать кофе как замену отдыху.`
  } else if (asksFood) {
    plan = current
    planUpdated = false
    response = `Сегодня лучше не пропускать еду. Простой вариант — белок плюс углеводы: яйца или рыба, крупа или картофель, овощи. Если тянет на сладкое после короткого сна, это обычная реакция, а не недостаток силы воли.`
  } else if (sleepQuestion) {
    plan = current
    planUpdated = false
    const sleep = today?.sleepDurationMinutes
    response = sleep
      ? `Последний сон — примерно ${Math.floor(sleep / 60)} ч ${Math.round(sleep % 60)} мин. ${sleep < (baseline.sleepDuration.average ?? sleep) * .94 ? 'Это меньше твоей обычной нормы, поэтому сегодня лучше снизить нагрузку и лечь раньше.' : 'Это близко к твоей обычной норме; дальше ориентируйся на самочувствие и восстановление.'}`
      : `WHOOP пока не передал длительность последнего сна. Я бы не делала вывод только по этому пропуску: ориентируйся на самочувствие, recovery, HRV и ночной пульс.`
  } else if (decide) {
    plan = current
    planUpdated = false
    response = `По твоим данным я бы оставила текущий план. Показатели не требуют резко отменять день, но и идти на максимум не нужно. Сделай обычную активность с запасом, нормально поешь и сохрани сон.`
  } else {
    plan = current
    planUpdated = false
    response = `Я слышу тебя. По текущим данным восстановление ${lowRecovery || lowHrv || highRhr ? 'не идеальное, поэтому сегодня лучше оставить запас и не идти на максимум' : 'выглядит спокойно, поэтому можно сохранить обычный ритм'}. Если хочешь, напиши одним сообщением, что именно беспокоит или что ты планируешь — тренировку, работу, поездку, сон или питание — и я отвечу по ситуации.`
  }

  return {
    plan,
    message: {
      id: crypto.randomUUID(),
      role: 'agent',
      text: response,
      planUpdated,
      createdAt: new Date().toISOString(),
    },
  }
}
