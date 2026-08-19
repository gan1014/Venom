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

## Deploy on Vercel

The live app is inside `portal/`, not the repo root. If you skip this, you get `404: NOT_FOUND`.

1. Open the Vercel project → **Settings** → **General**
2. **Root Directory** → Edit → type `portal` → **Save**
3. **Settings** → **Environment Variables** → add:

```
AUTH_SECRET=change-me-to-a-long-random-string
ADMIN_EMAIL=admin@leviathan.local
ADMIN_PASSWORD=pick-a-strong-password
```

4. **Deployments** → latest → **Redeploy** (uncheck “Use existing Build Cache”)

After that, `https://venom-henna.vercel.app` should open the 3D film.

Note: Vercel’s disk is temporary. Registrations in `data/db.json` reset when the instance sleeps or you redeploy. The built-in store is fine for local/dev; a real database is needed if you want counts to survive on Vercel.

```bash
cd coming-soon
python3 -m http.server 3001 --bind 0.0.0.0
```

## Notes

- Event name spelling: **LEVIATHON**
- 100% free — no payment
- Live participant records stay in `portal/data/db.json` and are not committed
