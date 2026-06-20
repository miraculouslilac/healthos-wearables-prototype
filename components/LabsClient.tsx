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
      <p className="lead">WHOOP показывает, как тело ведёт себя каждый день: сон, пульс, восстановление и нагрузку. Анализы помогают проверить, есть ли внутри причины усталости — например, железо, витамин D, щитовидка или сахар.</p>

      <section className="section">
        <div className="card impact-card">
          <div className="eyebrow">Зачем соединять данные</div>
          <p>Вместе они помогают понять не только «я устала», но и почему это может происходить. Например, низкое восстановление может быть связано не только со сном, но и с низким ферритином или витамином D.</p>
        </div>
      </section>

      <section className="section">
        <div className="card lab-drop">
          <div style={{ fontSize: 30, marginBottom: 12 }}>⌁</div>
          <strong>PDF, фото или ручной ввод</strong>
          <p className="lead" style={{ fontSize: 14, marginTop: 8 }}>В прототипе файл обрабатывается как demo без загрузки на сервер.</p>
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
        <div className="pattern"><span className="pattern-dot" /><div><strong>Энергия и усталость</strong><span>Ферритин, гемоглобин, B12, витамин D и ТТГ. Если они снижены, усталость может быть связана не только со сном.</span></div></div>
        <div className="pattern"><span className="pattern-dot" /><div><strong>Сахар и обмен веществ</strong><span>Глюкоза, инсулин, HOMA-IR, HbA1c, ЛПНП, ЛПВП и триглицериды. WHOOP их не измеряет, но даёт контекст по сну и энергии.</span></div></div>
        <div className="pattern"><span className="pattern-dot" /><div><strong>Воспаление и восстановление</strong><span>CRP, лейкоциты и СОЭ вместе с ночным пульсом и HRV. Если показатели меняются одновременно, это стоит обсудить с врачом.</span></div></div>
      </div></section>}
    </AppChrome>
  )
}
