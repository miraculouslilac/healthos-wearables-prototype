import { AppChrome } from '@/components/AppChrome'
import { demoWearableDays } from '@/lib/demo/data'
import { calculatePersonalBaseline } from '@/lib/healthos/personalBaseline'
import { buildRiskProfile } from '@/lib/healthos/riskProfile'

const labels = { low: 'низкий риск', moderate_attention: 'умеренное внимание', attention_zone: 'зона внимания' }

export default function DashboardPage() {
  const baseline = calculatePersonalBaseline(demoWearableDays)
  const risks = buildRiskProfile(demoWearableDays, baseline)
  return (
    <AppChrome>
      <div className="eyebrow">7 дней · риск-профилирование</div>
      <h1 className="page-title">Дашборд здоровья</h1>
      <p className="lead">Не диагноз, а карта устойчивых паттернов: где всё спокойно и чему стоит уделить внимание первым.</p>

      <section className="section">
        <div className="card impact-card">
          <div className="eyebrow">Текущее состояние</div>
          <p>Организм чаще находится в режиме недовосстановления: HRV снижен, сон короче личной нормы, ночной пульс выше обычного.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Риск-профиль</h2><span className="section-note">WHOOP · 30 дней</span></div>
        <div className="risk-list">
          {risks.map(risk => (
            <article className="card risk-card" key={risk.id}>
              <div className="risk-top">
                <h3 className="risk-title">{risk.title}</h3>
                <span className={`risk-status ${risk.status}`}>{labels[risk.status]}</span>
              </div>
              <p className="risk-summary">{risk.summary}</p>
              <div className="risk-lever"><span>Главный рычаг: </span>{risk.firstLever}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Если паттерн сохранится</h2></div>
        <div className="pattern-list">
          {risks.filter(risk => risk.status !== 'low').slice(0, 3).map(risk => (
            <div className="pattern" key={risk.id}><span className="pattern-dot" /><div><strong>{risk.title}</strong><span>{risk.futureImpact}</span></div></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="card hero-card">
          <div className="eyebrow">Главный рычаг недели</div>
          <h2 style={{ fontSize: 30, letterSpacing: '-.05em', margin: '12px 0' }}>Вернуть сон к норме</h2>
          <p className="lead">Стабильные 7+ часов могут улучшить восстановление, HRV и переносимость нагрузки.</p>
          <a className="button primary full" style={{ marginTop: 18 }} href="/plan">Открыть план недели</a>
        </div>
      </section>
      <p className="disclaimer">Риск-профиль основан на данных носимого устройства и введённых анализах. Он помогает заметить паттерны и подготовиться к разговору с врачом, но не является диагнозом.</p>
    </AppChrome>
  )
}
