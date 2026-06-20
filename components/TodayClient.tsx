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
          <div className="eyebrow">Восстановление · готовность на сегодня</div>
          <div className="hero-number">{Math.round(current?.recoveryScore ?? 0)}</div>
          <div className="hero-unit">из 100 · общий показатель готовности к нагрузке</div>
          <p className="hero-summary">
            {(current?.recoveryScore ?? 0) < 34
              ? 'Сегодня тело хуже восстановилось. Лучше не добивать себя тяжёлой тренировкой, а выбрать лёгкое движение, еду и сон.'
              : (current?.recoveryScore ?? 0) < 67
                ? 'Организм в рабочем состоянии, но без большого запаса. Можно двигаться и тренироваться, но лучше без максимальной нагрузки.'
                : 'Организм хорошо восстановился. Сегодня можно планировать более активный день, если самочувствие тоже нормальное.'}
          </p>
          <div className="button-row">
            <LinkButton href="/plan" primary>Что делать сегодня</LinkButton>
            <button className="button" onClick={() => document.getElementById('factors')?.scrollIntoView({ behavior: 'smooth' })}>Почему так</button>
          </div>
        </div>
      </section>

      <section className="section" id="factors">
        <div className="section-head"><h2 className="section-title">Почему так</h2><span className="section-note">сравнение с твоей нормой за 30 дней</span></div>
        <div className="factor-grid">
          {data.interpretation.keyFactors.slice(0, 4).map(factor => (
            <div className={`factor ${factor.direction}`} key={factor.label}>
              <div className="factor-label">{factor.label}</div>
              <div className="factor-value">{factor.value}</div>
              <div className="factor-copy">{factor.explanation}</div>
              <div className="factor-meaning">{factor.plainMeaning}</div>
            </div>
          ))}
        </div>
        <button className="button full" style={{ marginTop: 10 }} onClick={() => sync()} disabled={loading}>
          {loading ? 'Обновляем…' : '↻ Обновить данные WHOOP'}
        </button>
      </section>

      <section className="section">
        <div className="card impact-card">
          <div className="eyebrow">Если так будет повторяться</div>
          <p>Если сон и восстановление будут проседать несколько недель подряд, может накопиться усталость. Это не диагноз, но повод посмотреть на режим, стресс и анализы.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Что повторялось на неделе</h2><LinkButton href="/dashboard">Подробнее →</LinkButton></div>
        <div className="pattern-list">
          <Pattern title="3 дня подряд HRV ниже обычного" copy="Снижение совпало с серией тренировочных дней." />
          <Pattern title="4 ночи сон короче личной нормы" copy="В эти дни ночной пульс в среднем был выше." />
          <Pattern title="После высокой нагрузки восстановление падает" copy="Похоже, телу нужно больше времени на отдых." />
        </div>
      </section>

      <section className="section">
        <div className="card agent-preview">
          <div className="eyebrow">Спросить HealthOS</div>
          <h2 className="section-title">План можно изменить под самочувствие</h2>
          <p>Напиши, если плохо спала, заболела, хочешь тренировку или у тебя мало времени. Агент изменит план, а не просто даст совет.</p>
          <a className="button primary full" href="/plan">Открыть ИИ-агента →</a>
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
