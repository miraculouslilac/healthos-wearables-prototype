'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppChrome } from '@/components/AppChrome'
import { adaptPlanWithAgent, createAdaptivePlan } from '@/lib/healthos/healthosAgent'
import type { AdaptivePlan, AgentMessage, DailyHealthInterpretation, PersonalBaseline, WearableDay } from '@/lib/types'

type Props = {
  days: WearableDay[]
  baseline: PersonalBaseline
  interpretation: DailyHealthInterpretation
}

const icons: Record<string, string> = { activity: '↗', nutrition: '◌', hydration: '≈', sleep: '☾', stress: '◇', check_in: '✓', medical: '!' }
const quickActions = ['Я плохо спала', 'Я всё равно хочу тренировку', 'Болит горло', 'Сильно устала', 'Нет времени на план', 'Хочу более мягкий день', 'Хочу силовую', 'Сделай план на неделю']
const STORAGE = 'healthos-agent-state-v1'

export function PlanClient({ days, baseline, interpretation }: Props) {
  const [health, setHealth] = useState({ days, baseline, interpretation })
  const basePlan = useMemo(() => createAdaptivePlan(health.interpretation), [health.interpretation])
  const [plan, setPlan] = useState<AdaptivePlan>(basePlan)
  const [previousPlan, setPreviousPlan] = useState<AdaptivePlan | null>(null)
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/whoop/sync', { cache: 'no-store' })
      .then(response => response.json())
      .then(next => {
        setHealth({ days: next.days, baseline: next.baseline, interpretation: next.interpretation })
        if (!localStorage.getItem(STORAGE)) setPlan(createAdaptivePlan(next.interpretation))
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as { plan: AdaptivePlan; messages: AgentMessage[] }
      // Restore the user's last agent-edited plan after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan(parsed.plan)
      setMessages(parsed.messages)
    } catch {
      localStorage.removeItem(STORAGE)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ plan, messages }))
  }, [plan, messages])

  const send = (value = input) => {
    const clean = value.trim()
    if (!clean) return
    const user: AgentMessage = { id: crypto.randomUUID(), role: 'user', text: clean, createdAt: new Date().toISOString() }
    const result = adaptPlanWithAgent(clean, plan, health.days, health.baseline)
    setPreviousPlan(plan)
    setPlan(result.plan)
    setMessages(current => [...current.slice(-5), user, result.message])
    setInput('')
    setSaved(false)
  }

  const adjust = (kind: 'softer' | 'active') => send(kind === 'softer' ? 'Сделай план мягче' : 'Сделай план активнее')

  return (
    <AppChrome>
      <div className="eyebrow">План · меняется вместе с тобой</div>
      <h1 className="page-title">{plan.title}</h1>
      <p className="lead">Это не жёсткое расписание. Напиши, как ты себя чувствуешь или что изменилось, и HealthOS подстроит день.</p>

      {plan.safetyNote && <section className="section"><div className="card safety-card"><strong>Сначала безопасность</strong><p>{plan.safetyNote}</p></div></section>}

      <section className="section">
        <div className="section-head"><h2 className="section-title">Сегодня</h2><span className="section-note">{plan.today.length} действий</span></div>
        <div className="plan-list">
          {plan.today.map(entry => (
            <div className={`plan-item ${entry.changed ? 'changed' : ''}`} key={entry.id}>
              <div className="plan-icon">{icons[entry.area]}</div>
              <div>
                <div className="plan-item-top"><h3>{entry.title}</h3>{entry.changed && <span className="updated-badge">изменено</span>}</div>
                <p>{entry.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Спросить HealthOS</h2><span className="section-note">план изменится сразу</span></div>
        <div className="card agent-card">
          <div className="agent-messages">
            {!messages.length && <div className="agent-welcome">Расскажи, что изменилось. Например: «Я плохо себя чувствую, убери тренировку» или «Хочу сегодня пробежать 5 км».</div>}
            {messages.map(message => (
              <div className={`agent-message ${message.role}`} key={message.id}>
                <div>{message.text}</div>
                {message.planUpdated && <span className="updated-badge">План обновлён</span>}
              </div>
            ))}
          </div>
          <div className="quick-actions">
            {quickActions.map(action => <button key={action} onClick={() => send(action)}>{action}</button>)}
          </div>
          <form className="agent-input" onSubmit={event => { event.preventDefault(); send() }}>
            <input value={input} onChange={event => setInput(event.target.value)} placeholder="Например: хочу сегодня пробежать 5 км, можно?" />
            <button type="submit" aria-label="Отправить">→</button>
          </form>
          <div className="agent-tools">
            <button onClick={() => adjust('softer')}>Сделать мягче</button>
            <button onClick={() => adjust('active')}>Сделать активнее</button>
            <button disabled={!previousPlan} onClick={() => { if (previousPlan) { setPlan(previousPlan); setPreviousPlan(null) } }}>Вернуть прежний план</button>
            <button onClick={() => setSaved(true)}>{saved ? 'Сохранено ✓' : 'Сохранить в Health Memory'}</button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">На этой неделе</h2></div>
        <div className="plan-list">
          {plan.week.map(entry => (
            <div className={`plan-item ${entry.changed ? 'changed' : ''}`} key={entry.id}>
              <div className="plan-icon">{icons[entry.area]}</div>
              <div><div className="plan-item-top"><h3>{entry.title}</h3>{entry.changed && <span className="updated-badge">изменено</span>}</div><p>{entry.description}</p></div>
            </div>
          ))}
        </div>
      </section>
      <p className="disclaimer">Это не диагноз и не медицинское назначение. HealthOS помогает заметить изменения и выбрать более разумный план на сегодня.</p>
    </AppChrome>
  )
}
