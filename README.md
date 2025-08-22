# PropEase CRM — Full Stack Property Management System

This repository contains the PropEase CRM full‑stack application:
- Frontend: Vite + React + TypeScript + Tailwind (located in `PropEase-CRM/`)
- Backend: Node.js + Express + MongoDB (located in `backend/`)

Quick links:
- Frontend app: [PropEase-CRM/README.md](PropEase-CRM/README.md)
- Backend app: [backend/README.md](backend/README.md)
- Frontend entry: [PropEase-CRM/src/main.tsx](PropEase-CRM/src/main.tsx)
- Backend server: [backend/server.js](backend/server.js)

Important: Remove any secret values from committed files before pushing. Do NOT commit `.env` files or tokens. Use the provided `.env.example` files and add actual secrets locally.

Prerequisites
- Node.js 18+
- npm (or yarn)
- MongoDB 6+ (local or Atlas)

Repository layout
- README.md (this file)
- PropEase-CRM/ — frontend (Vite + React + TypeScript)
  - [package.json](PropEase-CRM/package.json) (scripts: [`dev`, `build`, `preview`, `lint`])
- backend/ — API server (Express + MongoDB)
  - [package.json](backend/package.json) (scripts: [`dev`, `start`])
  - [env.example](backend/env.example)
  - [setup-env.bat](backend/setup-env.bat) — convenience script for Windows

Setup — local (recommended)
1. Clone
```bash
git clone <repository-url>
cd <repo-root>
```

2. Backend setup
```bash
cd backend
npm install
```
- Create a `.env` file in `backend/` (do NOT commit it). Use [backend/env.example](backend/env.example) as reference.
- You can run the bundled helper on Windows: [backend/setup-env.bat](backend/setup-env.bat)
- Start backend:
```bash
npm run dev
```
(See the [`dev` script](backend/package.json) in [backend/package.json](backend/package.json))

Default backend endpoints:
- API base: http://localhost:4000/api (default)
- Authentication: POST `/api/auth/login` and `/api/auth/register`
- Entities: `/api/properties`, `/api/tenants`, `/api/owners`, `/api/leads`, `/api/tasks`, `/api/support`, `/api/transactions`, ...

3. Frontend setup
From repo root:
```bash
cd PropEase-CRM
npm install
```
- Create `.env` in `PropEase-CRM/` with:
```
VITE_API_URL=http://localhost:4000/api
```
- Start frontend:
```bash
npm run dev
```
(See the [`dev` script](PropEase-CRM/package.json) in [PropEase-CRM/package.json](PropEase-CRM/package.json))

Open the frontend at: http://localhost:5173

Environment variables (do not commit)
- Backend: MONGO_URI, JWT_SECRET, PORT, ADMIN_EMAIL, ADMIN_PASSWORD (or ADMIN_HASH), SANITY_PROJECT_ID, DATASET, API_VERSION, SANITY_TOKEN
  - Example reference: [backend/env.example](backend/env.example)
- Frontend: VITE_API_URL, SANITY_PROJECT_ID, VITE_SOME_KEY (if used)

Security notes (must read before pushing)
- Remove any hard-coded tokens or passwords from the repo. I found potential secrets in `.env` files — ensure you replace them and never commit the real values.
- Add `.env` to `.gitignore` (already present in the frontend .gitignore; ensure backend also ignores env).
- If a secret was committed earlier, rotate or revoke it (e.g., Sanity tokens, JWT secrets).

Testing & linting
- Backend tests: `cd backend && npm test` (Jest)
- Frontend lint: `cd PropEase-CRM && npm run lint`

Build & deploy
- Frontend: `cd PropEase-CRM && npm run build` (build optimized static site)
- Backend: host on Render, Railway, Heroku, or similar; set env vars in platform
- Serve frontend via Vercel, Netlify, or static host. Point `VITE_API_URL` to the deployed backend.

Contributing
1. Fork -> branch -> changes -> tests -> PR
2. Keep environment secrets out of the repo
3. Run linters & tests before creating PR

License
- MIT (see package.json files)

Contact / Support
- support@propeasecrm.com

