# Pakistan Police Lost & Found Integrated Registry

A secure, high-performance, and responsive full-stack web application designed for police headquarters across Pakistan to log and archive lost property, and for citizens to search and file ownership claims. 

Runs entirely locally on a single machine with zero external cloud dependencies.

---

## Technical Stack
* **Frontend**: React + Vite + Tailwind CSS v3 (localhost:5173)
* **Backend**: Node.js + Express (localhost:3001)
* **Database & ORM**: SQLite + Prisma ORM (stored in `backend/prisma/dev.db`)

---

## Project Structure
```
/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma   # SQLite Database Schema
│   │   ├── seed.js         # Preloaded Police HQs & lost items seed script
│   │   └── dev.db          # Active SQLite local file (generated on migration)
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js     # JWT Token Authorization
│   │   └── server.js       # Express server & API endpoints
│   ├── uploads/            # Citizens proof-of-ownership document storage
│   └── .env                # App configuration file
└── frontend/
    ├── src/
    │   ├── api.js          # REST Client API Wrapper
    │   ├── index.css       # Tailwind entry and visual theme
    │   └── App.jsx         # Central React views and workflow routing
    ├── tailwind.config.js  # Styling variables mapping
    └── index.html          # HTML entrypoint
```

---

## Credentials (Seeded for Immediate Testing)
The Prisma seed script automatically registers **4 Police HQs** with a universal secure password: `pakistan123`.

| Police HQ | Username | Secure Password |
| :--- | :--- | :--- |
| **Lahore HQ** | `lahore_police` | `pakistan123` |
| **Karachi HQ** | `karachi_police` | `pakistan123` |
| **Islamabad HQ** | `islamabad_police` | `pakistan123` |
| **Peshawar HQ** | `peshawar_police` | `pakistan123` |

---

## Local Setup Instructions

Ensure Node.js is installed on your PC. Then open your terminal inside the project root and execute the following:

### Step 1: Initialize Database & Run Seed Script
Navigate to `/backend` to install packages, run the database migrations, and seed sample data:
```bash
# 1. Enter backend directory
cd backend

# 2. Install backend dependencies
npm install

# 3. Create local dev database and apply migrations
npx prisma migrate dev --name init

# 4. Seed database with HQs and initial lost items
npx prisma db seed
```

### Step 2: Install Frontend Packages
Navigate to `/frontend` to download packages:
```bash
# 1. Go to frontend directory
cd ../frontend

# 2. Install frontend dependencies
npm install
```

---

## Running the Application

To run the application locally, you will start the server and client dev instances.

### 1. Launch the Backend Server
Inside `/backend`, run:
```bash
npm run dev
```
* The API server will run at: **`http://localhost:3001`**

### 2. Launch the React Client
Inside `/frontend`, run:
```bash
npm run dev
```
* The web app portal will open at: **`http://localhost:5173`**

---

## System Constraints & Business Logic

1. **Shared Visibility**: All police HQs can search and browse the global registry of items logged by any district.
2. **Access Control**: Only the specific HQ that originally uploaded an item is authorized to Accept or Reject claims filed against it. Read-only claim list is shown for other stations.
3. **Claim Limits**: Civilians can submit claims without registering accounts. However, each claimant identity (tracked by Email or CNIC) is constrained to a maximum of **3 claims per item**. Any rejected claims still count towards this limit.
4. **Permanent Archive**: Returned items are never deleted. When marked as returned, police must submit the recipient's Name, CNIC, and Phone. This recipient information is strictly confidential (visible *only* to police officers and hidden from the public).
