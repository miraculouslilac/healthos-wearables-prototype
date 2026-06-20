# HealthOS Wearables Agent

Отдельный mobile-first прототип Vespra Wearables: WHOOP OAuth, персональная 30-дневная норма, интерпретация дня, риск-профиль и сопоставление с анализами.

## Запуск

```bash
npm install
cp .env.example .env.local
npm run dev
```

Без env приложение работает в demo-mode. Для WHOOP OAuth заполните переменные из `.env.example`. Секреты и пользовательские данные нельзя коммитить или выводить в логи.

Redirect URI:

- локально: `http://localhost:3000/api/whoop/callback`
- production: `https://YOUR-DOMAIN.vercel.app/api/whoop/callback`

## API

- `GET /api/whoop/login`
- `GET /api/whoop/callback`
- `GET /api/whoop/sync`
- `POST /api/whoop/refresh`
- `POST /api/whoop/logout`
