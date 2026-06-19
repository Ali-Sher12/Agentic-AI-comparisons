# Pakistan Lost & Found System

A full-stack local web application for police headquarters across Pakistan to log, manage, and return lost & found items. Civilians can search items and submit ownership claims without an account.

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React + Vite + Tailwind CSS         |
| Backend  | Node.js + Express                   |
| Database | SQLite via Prisma ORM               |
| Files    | Local storage in `backend/uploads/` |

## Project Structure

```
/
├── frontend/          # React app (localhost:5173)
├── backend/           # Express API (localhost:3001)
│   ├── prisma/        # Schema, migrations, dev.db
│   ├── uploads/       # Claim document uploads
│   └── .env           # Local config (see .env.example)
└── README.md
```

## Setup

### 1. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The API runs at **http://localhost:3001**.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:5173**.

## Configuration

Copy `backend/.env.example` to `backend/.env` and adjust if needed:

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-here"
PORT=3001
```

## Seed Data

After `npx prisma db seed`, the database includes:

- **4 police HQs:** Lahore, Karachi, Islamabad, Peshawar
- **1 login per HQ** (see credentials below)
- **6 sample lost items** across varied categories

### Demo Police Credentials

| HQ          | Username          | Password      |
|-------------|-------------------|---------------|
| Lahore HQ   | `lahore_police`   | `lahore123`   |
| Karachi HQ  | `karachi_police`  | `karachi123`  |
| Islamabad HQ| `islamabad_police`| `islamabad123`|
| Peshawar HQ | `peshawar_police` | `peshawar123` |

## Features

### Police Portal (`/police/login`)

- JWT-authenticated login, one account per HQ
- All HQs see and manage items from every other HQ
- Add items with full metadata (size, weight, color, description, plate, condition, recovery details, holding location)
- Upload date set automatically on creation
- Mark items as "Returned to Owner" (irreversible; records recipient — police-only field)
- View, accept, or reject civilian claims

### Public Portal (`/`)

- No login required
- Search and filter items by all logged fields
- Submit claims with email or CNIC, contact info, and proof-of-ownership document
- Maximum 3 claims per email/CNIC per item (rejected claims count)
- Returned-to-owner details are never shown to civilians

## Uninstall

Delete the project folder. No cloud services or external dependencies to clean up.
