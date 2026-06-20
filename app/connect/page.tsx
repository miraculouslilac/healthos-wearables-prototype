import { AppChrome } from '@/components/AppChrome'
import Link from 'next/link'

export default function ConnectPage() {
  return (
    <AppChrome>
      <div className="connect">
        <div className="connect-visual"><div className="connect-ring" /></div>
        <div className="eyebrow">Безопасное подключение · OAuth 2.0</div>
        <h1 className="page-title">WHOOP измеряет. HealthOS помогает решить.</h1>
        <p className="lead">Vespra подключит данные WHOOP, чтобы собрать персональный отчёт: восстановление, сон, нагрузка, риск-профиль и план на день.</p>
        <a className="button primary full" style={{ marginTop: 24 }} href="/api/whoop/login">Подключить WHOOP</a>
        <Link className="button full" style={{ marginTop: 9 }} href="/">Посмотреть demo-mode</Link>
        <p className="disclaimer">Доступ предоставляется через WHOOP OAuth. Токены хранятся только в защищённой httpOnly cookie и не видны браузерному JavaScript.</p>
      </div>
    </AppChrome>
  )
}
