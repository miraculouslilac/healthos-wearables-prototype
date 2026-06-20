import { AppChrome } from '@/components/AppChrome'
import { demoWearableDays } from '@/lib/demo/data'
import { calculatePersonalBaseline } from '@/lib/healthos/personalBaseline'
import { buildRiskProfile } from '@/lib/healthos/riskProfile'

const labels = { low: 'всё спокойно', moderate_attention: 'стоит посмотреть', attention_zone: 'обрати внимание' }

export default function DashboardPage() {
  const baseline = calculatePersonalBaseline(demoWearableDays)
  const risks = buildRiskProfile(demoWearableDays, baseline)
  return (
    <AppChrome>
      <div className="eyebrow">Твои данные за 7 дней</div>
      <h1 className="page-title">Дашборд здоровья</h1>
      <p className="lead">Простая карта: что выглядит спокойно, что повторяется и что можно улучшить первым.</p>

      <section className="section">
        <div className="card impact-card">
          <div className="eyebrow">Текущее состояние</div>
          <p>В несколько дней сон был короче обычного, HRV снижался, а ночной пульс был выше. Похоже, телу не всегда хватало отдыха.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">На что обратить внимание</h2><span className="section-note">WHOOP · твоя личная норма</span></div>
        <div className="risk-list">
          {risks.map(risk => (
            <article className="card risk-card" key={risk.id}>
              <div className="risk-top">
                <h3 className="risk-title">{risk.title}</h3>
                <span className={`risk-status ${risk.status}`}>{labels[risk.status]}</span>
              </div>
              <p className="risk-summary">{risk.summary}</p>
              <div className="risk-why"><strong>Почему это важно:</strong> {risk.futureImpact}</div>
              <div className="risk-lever"><span>Что сделать: </span>{risk.firstLever}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Если так будет повторяться</h2></div>
        <div className="pattern-list">
          {risks.filter(risk => risk.status !== 'low').slice(0, 3).map(risk => (
            <div className="pattern" key={risk.id}><span className="pattern-dot" /><div><strong>{risk.title}</strong><span>{risk.futureImpact}</span></div></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card hero-card">
          <div className="eyebrow">Главное на этой неделе</div>
          <h2 style={{ fontSize: 30, letterSpacing: '-.05em', margin: '12px 0' }}>2–3 раза лечь пораньше</h2>
          <p className="lead">Посмотри, станет ли после этого лучше восстановление, HRV и ночной пульс.</p>
          <a className="button primary full" style={{ marginTop: 18 }} href="/plan">Открыть план недели</a>
        </div>
      </section>
      <p className="disclaimer">Риск-профиль основан на данных носимого устройства и введённых анализах. Он помогает заметить паттерны и подготовиться к разговору с врачом, но не является диагнозом.</p>
    </AppChrome>
  )
}
