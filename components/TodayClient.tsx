'use client'

import { useEffect, useState } from 'react'
import { AppChrome } from '@/components/AppChrome'
import type { DailyHealthInterpretation, PersonalBaseline, RiskProfileZone, WearableDay } from '@/lib/types'

type SyncData = {
  mode: 'demo' | 'live'
  days: WearableDay[]
  baseline: PersonalBaseline
  interpretation: DailyHealthInterpretation
  risks: RiskProfileZone[]
}

export function TodayClient({ initialData }: { initialData: SyncData }) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  const sync = async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const response = await fetch('/api/whoop/sync', { cache: 'no-store' })
      const next = await response.json()
      setData(next)
      if (!quiet) setToast(next.mode === 'live' ? 'WHOOP обновлён' : 'Показаны безопасные demo-данные')
    } catch {
      if (!quiet) setToast('Не удалось обновить данные')
    } finally {
      setLoading(false)
      setTimeout(() => setToast(''), 2500)
    }
  }

  // Initial sync is the client-side bridge from the protected httpOnly session to the UI.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void sync(true) }, [])
  const current = data.days.at(-1)

  return (
    <AppChrome mode={data.mode === 'live' ? 'WHOOP live' : 'Demo mode'}>
      {toast && <div className="toast">{toast}</div>}
      <div className="eyebrow">Твоё состояние · сегодня</div>
      <h1 className="page-title">{data.interpretation.title}</h1>
      <p className="lead">{data.interpretation.summary}</p>
      {data.mode === 'demo' && <a className="button full" style={{ marginTop: 16 }} href="/connect">Подключить реальные данные WHOOP →</a>}

      <section className="section">
        <div className="card hero-card">
          <div className="eyebrow">Recovery · личная динамика</div>
          <div className="hero-number">{Math.round(current?.recoveryScore ?? 0)}</div>
          <div className="hero-unit">из 100 · ниже твоей средней нормы</div>
          <p className="hero-summary">Сигнал не в одной цифре, а в сочетании сна, HRV и ночного пульса. Сегодня телу полезнее вернуть ресурс, чем добирать нагрузку.</p>
          <div className="button-row">
            <LinkButton href="/plan" primary>Что делать сегодня</LinkButton>
            <button className="button" onClick={() => document.getElementById('factors')?.scrollIntoView({ behavior: 'smooth' })}>Почему так</button>
          </div>
        </div>
      </section>

      <section className="section" id="factors">
        <div className="section-head"><h2 className="section-title">Почему такой вывод</h2><span className="section-note">vs личная норма · 30 дней</span></div>
        <div className="factor-grid">
          {data.interpretation.keyFactors.map(factor => (
            <div className={`factor ${factor.direction}`} key={factor.label}>
              <div className="factor-label">{factor.label}</div>
              <div className="factor-value">{factor.value}</div>
              <div className="factor-copy">{factor.explanation}</div>
            </div>
          ))}
        </div>
        <button className="button full" style={{ marginTop: 10 }} onClick={() => sync()} disabled={loading}>
          {loading ? 'Обновляем…' : '↻ Обновить данные WHOOP'}
        </button>
      </section>

      <section className="section">
        <div className="card impact-card">
          <div className="eyebrow">Если паттерн сохранится</div>
          <p>Недосып и низкое восстановление в течение нескольких недель могут повышать вероятность хронической усталости, снижать тренировочную адаптацию и влиять на аппетит.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Паттерны недели</h2><LinkButton href="/dashboard">Все зоны →</LinkButton></div>
        <div className="pattern-list">
          <Pattern title="3 дня подряд HRV ниже обычного" copy="Снижение совпало с серией тренировочных дней." />
          <Pattern title="4 ночи сон короче личной нормы" copy="В эти дни ночной пульс в среднем был выше." />
          <Pattern title="После высокой нагрузки recovery падает" copy="Организму не хватает окна для компенсации нагрузки." />
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">HealthOS Connections</h2></div>
        <div className="connection-grid">
          {data.interpretation.healthosConnections.map(item => (
            <div className="connection" key={item.module}>
              <div className="connection-label">{item.module}</div>
              <h3>{item.title}</h3><p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
      <p className="disclaimer">{data.interpretation.disclaimer}</p>
    </AppChrome>
  )
}

function Pattern({ title, copy }: { title: string; copy: string }) {
  return <div className="pattern"><span className="pattern-dot" /><div><strong>{title}</strong><span>{copy}</span></div></div>
}

function LinkButton({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return <a href={href} className={`button ${primary ? 'primary' : ''}`}>{children}</a>
}
