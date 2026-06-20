'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { href: '/', label: 'Сегодня', icon: '◉' },
  { href: '/dashboard', label: 'Дашборд', icon: '◇' },
  { href: '/labs', label: 'Анализы', icon: '⌁' },
  { href: '/plan', label: 'План', icon: '✓' },
]

export function AppChrome({ children, mode = 'Demo mode' }: { children: React.ReactNode; mode?: string }) {
  const pathname = usePathname()
  return (
    <>
      <main className="app-shell">
        <header className="brand">
          <Link href="/" className="brand-mark">
            <span className="orb" />
            <span>
              <span className="brand-name">Vespra Wearables</span>
              <span className="brand-sub">Wearables Agent by HealthOS</span>
            </span>
          </Link>
          <span className="demo-pill">{mode}</span>
        </header>
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Основная навигация">
        {navigation.map(item => (
          <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
