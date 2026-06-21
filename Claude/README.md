# Lost & Found Registry — Police Department, Pakistan

A fully local, full-stack Lost & Found system for use by police HQs. No hosting,
no domain, no cloud services — everything runs on your own machine.

- **Frontend:** React + Vite + Tailwind CSS — `http://localhost:5173`
- **Backend:** Node.js + Express — `http://localhost:3001`
- **Database:** SQLite via Prisma ORM — a single file at `backend/prisma/dev.db`
- **File uploads:** stored locally at `backend/uploads`

---

## 1. Requirements

- Node.js 18+ and npm
- Nothing else. No Docker, no external database, no internet connection needed
  after the first `npm install`.

## 2. Setup (first time only)

Open two terminals — one for the backend, one for the frontend — or run them
one after another.

### Backend

```bash
cd backend
npm install
cp .env.example .env        # defaults work out of the box, edit if you like
npx prisma migrate dev      # creates backend/prisma/dev.db and applies the schema
npx prisma db seed          # creates 4 HQs, 4 police logins, and 6 sample items
npm run dev
```

The backend will start at `http://localhost:3001`. You should see:

```
Lost & Found backend running at http://localhost:3001
```

### Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`. Open that URL in your browser.

> Both servers need to stay running at the same time — the frontend talks to
> the backend over HTTP on `localhost:3001`.

## 3. Demo logins (from the seed data)

| HQ            | Username        | Password       |
|---------------|-----------------|----------------|
| Lahore HQ     | `lahore.hq`     | `lahore123`    |
| Karachi HQ    | `karachi.hq`    | `karachi123`   |
| Islamabad HQ  | `islamabad.hq`  | `islamabad123` |
| Peshawar HQ   | `peshawar.hq`   | `peshawar123`  |

Any of these can log in and will see items logged by **every** HQ, not just
their own — visibility is shared across the whole department.

## 4. What's included

- **Public side (no login):** search and filter recovered items by category,
  color, condition, number plate, recovery location/time, and holding HQ.
  Civilians can file a claim on an item with an email or CNIC, contact info,
  and a proof-of-ownership document (max 3 claims per person per item —
  rejected claims still count).
- **Police side (login required):** add new found items (upload date is set
  automatically), view incoming claims and accept/reject them, and mark an
  item as "Returned to Owner." Returned items are archived, never deleted,
  and the return action is irreversible once confirmed. Who an item was
  returned to is recorded but only ever visible to police — never to the
  public.

## 5. Resetting the data

To wipe everything and start over:

```bash
cd backend
rm prisma/dev.db
npx prisma migrate dev
npx prisma db seed
```

Uploaded claim documents live in `backend/uploads` — delete the contents of
that folder if you want to clear those too.

## 6. Uninstalling

Just delete the project folder. Nothing is installed outside of it — no
system services, no global database, no registry entries.

## 7. Project structure

```
/backend
  /prisma
    schema.prisma     — data model
    seed.js            — seed script (4 HQs, 4 logins, 6 items)
    dev.db              — SQLite database (created after migrate)
  /src
    /routes             — auth, hqs, items, claims, uploads
    /middleware          — police auth guard, file upload handling
    /utils               — identity normalization, item serializers
    server.js            — Express app entry point
  /uploads               — claim proof-of-ownership documents
  .env.example
  .env                    — your local config (gitignored)

/frontend
  /src
    /pages               — HomePage, ItemDetailPage, PoliceLoginPage,
                            PoliceDashboardPage, AddItemPage, PoliceItemDetailPage
    /components           — Navbar, ItemCard, CaseSeal, ItemFilterPanel, ProtectedRoute
    /context              — AuthContext (police login state)
    /lib                  — api.js (backend client), constants.js
```

## 8. Notes on security defaults

This is built for local/internal departmental use. Before using it beyond a
local demo:

- Change `JWT_SECRET` in `backend/.env` to a long random string.
- The seed passwords are intentionally simple for testing — change them (or
  add new police users with stronger passwords) before real-world use.
