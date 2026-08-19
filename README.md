# LEGO LEVIATHON

Free AI Hackathon 2026 site.

- `portal/` — Next.js event site, 3D homepage film, registration, Command Center
- `coming-soon/` — standalone trailer (port 3001)
- `leviathan/` — original 3D film source

## Run the event site

```bash
cd portal
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000

- `/` — 3D film
- `/start` — event site after the film
- `/register` — free team registration
- `/admin` — Command Center (QR check-in)

Default local admin (change in `.env.local`):

```
ADMIN_EMAIL=admin@leviathan.local
ADMIN_PASSWORD=LEVIATHAN-ADMIN-2026
```

## Coming-soon trailer

```bash
cd coming-soon
python3 -m http.server 3001 --bind 0.0.0.0
```

## Notes

- Event name spelling: **LEVIATHON**
- 100% free — no payment
- Live participant records stay in `portal/data/db.json` and are not committed
