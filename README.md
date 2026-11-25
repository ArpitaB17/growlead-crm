# GrowLead – Lead Management System (Mini CRM)

React (Vite) + Express + MongoDB (Mongoose) with JWT authentication.

## Setup
Prerequisites: Node 18+, MongoDB running locally or an Atlas URI.

```bash
# Backend
cd server && cp .env.example .env   # edit values
npm install && npm start            # http://localhost:5000

# Frontend (new terminal)
cd client && npm install && npm run dev   # http://localhost:5173
```
Create your own account from the sign-up page, or log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env` (admin is seeded on first start). Each account sees only its own leads.
For production, set `VITE_API_URL` (e.g. `https://api.example.com/api`) before `npm run build`, and `CLIENT_ORIGIN` on the server.

## API (all `/api/leads` routes need `Authorization: Bearer <token>`)
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Create account (name, email, password) and get JWT |
| POST | /api/auth/login | Get JWT |
| GET | /api/leads?q=&status=&source= | List/search/filter |
| GET | /api/leads/stats | Counts per status + total |
| GET/PUT/DELETE | /api/leads/:id | Read / update / delete |
| POST | /api/leads | Create |

Errors: 400 validation (field-level `errors`), 401 unauthorized, 404 not found, 409 duplicate email, 500 server.

## Architecture
- **client/**: React SPA; `api.js` is the fetch wrapper, `App.jsx` holds Login + Dashboard (stats, form, search/filter, table).
- **server/src**: `routes/` (auth, leads), `models/Lead.js` (Mongoose schema + enums), `middleware/auth.js` (JWT check), central error handler in `index.js`.
- **Why MongoDB**: leads are flat documents; a unique index on email and a compound index on status/createdAt cover the queries.
- **Why JWT**: stateless auth; logout discards the token client-side.
