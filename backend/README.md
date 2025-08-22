# PropEase-CRM — Backend

Node.js + Express API for PropEase CRM. Provides CRUD endpoints for properties, tenants, owners, leads, tasks, transactions and support tickets. Uses MongoDB (Mongoose) and optional Sanity integration.

Quick links
- Entry: server.js
- Routes: backend/routes/
- Models: backend/models/
- Sanity client: backend/sanity/client.js
- Example env: env.example
- Windows helper: setup-env.bat

Prerequisites
- Node.js 18+
- npm
- MongoDB (local or Atlas)

Environment variables (create .env in backend/ — do NOT commit)
- PORT=4000
- MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/propease?retryWrites=true&w=majority
- JWT_SECRET=your-jwt-secret
- ADMIN_EMAIL=admin@example.com
- ADMIN_PASSWORD=admin123 (or ADMIN_HASH=precomputed-bcrypt-hash)
- SANITY_PROJECT_ID=your-project-id
- DATASET=production
- API_VERSION=2023-01-01
- SANITY_TOKEN=only-if-needed-for-private-dataset

Install & run (development)
```bash
cd backend
npm install
# create .env (use env.example)
npm run dev
```
Default base URL: http://localhost:4000/api (unless PORT changed)

Available routes (examples)
- POST /api/auth/register
- POST /api/auth/login
- GET/POST/PUT/DELETE /api/properties
- GET/POST/PUT/DELETE /api/tenants
- GET/POST/PUT/DELETE /api/owners
- GET/POST/PUT/DELETE /api/leads
- GET/POST/PUT/DELETE /api/tasks
- GET/POST/PUT/DELETE /api/support
- GET/POST/PUT/DELETE /api/transactions
- Sanity helper: /api/sanity/* (if enabled)

Scripts (package.json)
- npm run dev — start server with nodemon (development)
- npm start — start production server
- npm test — run tests (if present)

Security & checklist before pushing
- Ensure backend/.env is ignored in .gitignore.
- Remove any hard-coded credentials or tokens from the repo.
- If secrets were committed previously, rotate them (MongoDB credentials, JWT secret, Sanity tokens).
- Limit Sanity token scope; prefer server-side-only usage.

Testing & linting
- Add and run tests: npm test (configure if not present)
- Use linting tools as configured in package.json

Deployment
- Set environment variables in your hosting platform (Render, Railway, Heroku, etc.)
- Use a managed MongoDB (Atlas) in production
- Ensure CORS configuration allows your frontend origin or use a reverse proxy

Troubleshooting
- Mongoose connection errors: verify MONGO_URI and network access (IP whitelist for Atlas)
- JWT auth errors: confirm JWT_SECRET matches across services
- CORS issues: check backend CORS settings in server.js

Contact
- support@propeasecrm.com
