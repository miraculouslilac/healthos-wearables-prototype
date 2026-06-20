'use client'

import { useState } from 'react'
import { AppChrome } from '@/components/AppChrome'
import { demoLabs, demoWearableDays } from '@/lib/demo/data'
import { matchLabsWithWearables } from '@/lib/healthos/labWearablesMatcher'
import { calculatePersonalBaseline } from '@/lib/healthos/personalBaseline'
import type { LabMarker } from '@/lib/types'

export function LabsClient() {
  const [labs, setLabs] = useState<LabMarker[]>([])
  const baseline = calculatePersonalBaseline(demoWearableDays)
  const result = matchLabsWithWearables(labs, demoWearableDays, baseline)
  const loadDemo = () => setLabs(demoLabs)

  return (
    <AppChrome>
      <div className="eyebrow">Lab Match · WHOOP + анализы</div>
      <h1 className="page-title">Связать анализы с данными WHOOP</h1>
      <p className="lead">HealthOS посмотрит, совпадают ли паттерны сна, восстановления и нагрузки с лабораторными показателями.</p>

      <section className="section">
        <div className="card lab-drop">
          <div style={{ fontSize: 30, marginBottom: 12 }}>⌁</div>
          <strong>PDF, фото или ручной ввод</strong>
          <p className="lead" style={{ fontSize: 11, marginTop: 8 }}>В прототипе файл обрабатывается как demo без загрузки на сервер.</p>
          <div className="lab-actions">
            <label className="button primary">
              Загрузить файл
              <input type="file" accept=".pdf,image/*" onChange={event => event.target.files?.length && loadDemo()} />
            </label>
            <button className="button" onClick={loadDemo}>Demo-анализы</button>
          </div>
        </div>
      </section>

      {labs.length > 0 && <>
        <section className="section">
          <div className="section-head"><h2 className="section-title">Показатели</h2><span className="section-note">{labs.length} маркеров</span></div>
          <div className="lab-grid">
            {labs.map(lab => (
              <div className="lab-marker" key={lab.id}>
                <div className="lab-marker-name">{lab.name}</div>
                <div className="lab-marker-value">{lab.value} <small>{lab.unit}</small></div>
                <div className="lab-marker-status">{lab.status === 'low' ? 'ниже оптимума' : lab.status === 'high' ? 'выше референса' : 'погранично'}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="card chat">
            <div className="chat-content">
              <h3>{result.title}</h3>
              <p>{result.summary}</p>
              {result.matches.map((match, index) => (
                <div className="match" key={`${match.area}-${index}`}>
                  <strong>{index + 1}. {match.wearableSignal}</strong>
                  <p>{match.labSignal}</p>
                  <p>{match.interpretation}</p>
                  <p style={{ color: 'var(--mint)' }}>Дальше: {match.nextStep}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <p className="disclaimer">{result.disclaimer}</p>
      </>}

      {!labs.length && <section className="section"><div className="pattern-list">
        <div className="pattern"><span className="pattern-dot" /><div><strong>Энергия и восстановление</strong><span>Ферритин, витамин D, B12, гемоглобин и ТТГ.</span></div></div>
        <div className="pattern"><span className="pattern-dot" /><div><strong>Метаболический контекст</strong><span>Глюкоза, инсулин, HbA1c и липидный профиль.</span></div></div>
        <div className="pattern"><span className="pattern-dot" /><div><strong>Нагрузочный сигнал</strong><span>CRP, HRV и ночной пульс в одной временной картине.</span></div></div>
      </div></section>}
    </AppChrome>
  )
}
