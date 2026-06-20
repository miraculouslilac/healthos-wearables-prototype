import { AppChrome } from '@/components/AppChrome'
import { demoWearableDays } from '@/lib/demo/data'
import { calculatePersonalBaseline } from '@/lib/healthos/personalBaseline'
import { interpretWearables } from '@/lib/healthos/wearablesInterpreter'

const icons: Record<string, string> = { activity: '↗', nutrition: '◌', hydration: '≈', sleep: '☾', stress: '◇', check_in: '✓' }

export default function PlanPage() {
  const baseline = calculatePersonalBaseline(demoWearableDays)
  const interpretation = interpretWearables(demoWearableDays, baseline)
  return (
    <AppChrome>
      <div className="eyebrow">План · сегодня и неделя</div>
      <h1 className="page-title">Вернуть ресурс без перегруза</h1>
      <p className="lead">Небольшие действия, выбранные по текущему паттерну восстановления. Не идеальный режим — следующий разумный шаг.</p>

      <section className="section">
        <div className="section-head"><h2 className="section-title">Сегодня</h2><span className="section-note">5 действий</span></div>
        <div className="plan-list">
          {interpretation.todayPlan.map(item => (
            <div className="plan-item" key={item.area}>
              <div className="plan-icon">{icons[item.area]}</div>
              <div><h3>{item.title}</h3><p>{item.action}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head"><h2 className="section-title">На этой неделе</h2></div>
        <div className="card">
          <div className="eyebrow">Приоритет 01</div>
          <h2 style={{ fontSize: 24, letterSpacing: '-.04em', margin: '12px 0 8px' }}>Два вечера с ранним отбоем</h2>
          <p className="lead">Сдвинуть начало вечернего ритуала на 45 минут. Не компенсировать усталость поздним кофеином.</p>
        </div>
        <div className="card" style={{ marginTop: 10 }}>
          <div className="eyebrow">Приоритет 02</div>
          <h2 style={{ fontSize: 24, letterSpacing: '-.04em', margin: '12px 0 8px' }}>Один день без интенсивности</h2>
          <p className="lead">Оставить прогулку и мобильность, затем оценить HRV, ночной пульс и самочувствие.</p>
        </div>
      </section>

      <section className="section">
        <div className="card impact-card">
          <div className="eyebrow">Что обсудить с врачом</div>
          <p>Если усталость или симптомы сохраняются, показать динамику HRV, ночного пульса, сна и сопоставление с анализами.</p>
          <a className="button full" style={{ marginTop: 15 }} href="/labs">Связать анализы с WHOOP</a>
        </div>
      </section>
    </AppChrome>
  )
}
