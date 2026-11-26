# GrowLead – Lead Management System (Mini CRM)

GrowLead helps a business capture potential customers, track each lead's status, and keep follow-ups organised. Every account has its own private set of leads.

**Live demo:** _add your deployment link here_  
**Repository:** _add your GitHub link here_

## Features
- Sign up, log in and log out (JWT authentication); each account sees only its own leads
- Dashboard with a sidebar, a personalised greeting, and stat cards: total, new, contacted and converted leads
- Add, view, edit and delete leads
- Lead status workflow: New → Contacted → Interested → Converted / Lost (changeable inline from the table)
- Search by name, email, company or phone, and filter by status and source
- Server-side validation with clear field-level error messages
- Responsive layout (collapsible sidebar on mobile) with automatic dark mode

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), plain CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcryptjs |

## Prerequisites
- [Node.js](https://nodejs.org) 18 or newer (check with `node -v`)
- A MongoDB database: either a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster or a local MongoDB installation
- Git

## Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/ArpitaB17/growlead-crm
cd https://github.com/ArpitaB17/growlead-crm
```

### 2. Set up the backend
```bash
cd server
npm install
```
Create your environment file from the template:
```bash
# macOS / Linux
cp .env.example .env
# Windows (Command Prompt / PowerShell)
copy .env.example .env
```
Open `server/.env` and fill in your own values (see the table below), then start the API:
```bash
npm start
```
You should see `API running`. Health check: `http://localhost:5001/api/health`.

### 3. Set up the frontend
Open a **second terminal**:
```bash
cd client
npm install
npm run dev
```
Open the link it prints (usually `http://localhost:5173`).

> The Vite dev server forwards `/api` requests to the backend. If you change `PORT` in `server/.env`, update the proxy target in `client/vite.config.js` to the same port and restart the frontend.

### 4. Use the app
Click **Create account** to register, or log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` (the admin account is created automatically on the first start).

## Environment Variables (`server/.env`)
| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the API listens on | `5001` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/lead-crm` |
| `JWT_SECRET` | Long random string used to sign tokens | `a-long-random-secret` |
| `ADMIN_EMAIL` | Email of the seeded admin account | `admin@example.com` |
| `ADMIN_PASSWORD` | Password of the seeded admin account | `choose-a-strong-one` |
| `CLIENT_ORIGIN` | Allowed frontend origin (CORS) | `http://localhost:5173` |

Never commit `.env`; it is listed in `.gitignore`.

## Scripts
| Folder | Command | Purpose |
|---|---|---|
| `server` | `npm start` | Start the API |
| `server` | `npm run dev` | Start the API with auto-restart |
| `client` | `npm run dev` | Start the frontend dev server |
| `client` | `npm run build` | Production build into `client/dist` |

## API
All `/api/leads` routes require the header `Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account (name, email, password) and get a JWT |
| POST | `/api/auth/login` | Log in and get a JWT |
| GET | `/api/leads?q=&status=&source=` | List, search and filter your leads |
| GET | `/api/leads/stats` | Counts per status plus total |
| GET | `/api/leads/:id` | Get one lead |
| POST | `/api/leads` | Create a lead |
| PUT | `/api/leads/:id` | Update lead details or status |
| DELETE | `/api/leads/:id` | Delete a lead |

**Lead fields:** full name, email, phone, company, source (Website, Referral, LinkedIn, Cold Call, Event, Other), status (New, Contacted, Interested, Converted, Lost), created date.

**Errors:** 400 validation failed (with field-level `errors`), 401 unauthorized, 404 not found, 409 duplicate email, 500 server error.

## Project Structure
```
├── client/                 React frontend (Vite)
│   ├── index.html
│   └── src/
│       ├── App.jsx         Auth pages, sidebar, dashboard
│       ├── api.js          Fetch wrapper
│       ├── main.jsx
│       └── styles.css
└── server/                 Express backend
    └── src/
        ├── index.js        App setup, DB connection, error handler
        ├── models/Lead.js  Mongoose schema and enums
        ├── routes/auth.js  Register, login, admin seeding
        ├── routes/leads.js Lead CRUD, search, stats
        └── middleware/auth.js  JWT verification
```

## Architecture & Technology Choices
- **Frontend:** a React single-page app. `api.js` wraps `fetch` and attaches the JWT; `App.jsx` holds the sign-in/sign-up pages and the dashboard (sidebar, stat cards, lead form, search/filter, table).
- **Backend:** a REST API in Express. Routes are split into auth and leads, JWT middleware protects lead routes, and a central error handler maps database and validation errors to clean HTTP responses.
- **Data isolation:** every lead stores an `owner`, and all queries filter by the logged-in user, so accounts never see each other's data.
- **Why MongoDB:** leads are flat documents, so a document store fits well. A unique index on `owner + email` prevents duplicate leads within an account, and an index on `status + createdAt` speeds up the dashboard queries.
- **Why JWT:** stateless authentication keeps the API simple to scale; logout discards the token on the client.

## Screenshots
Add images to a `screenshots/` folder and link them here:

![Login](screenshots/login.png)
![Dashboard](screenshots/dashboard.png)
![Mobile view](screenshots/mobile.png)

## Troubleshooting
- **`MONGO_URI` is `undefined`:** `server/.env` is missing or misnamed; create it from `.env.example`.
- **`querySrv ECONNREFUSED`:** your network blocks the Atlas DNS lookup. Add `require('dns').setServers(['8.8.8.8', '1.1.1.1']);` as the first line of `server/src/index.js`, turn off any VPN, or use the non-SRV (`mongodb://`) connection string from Atlas.
- **`EADDRINUSE`:** the port is already in use; stop the old process or change `PORT`.
- **Frontend shows "Request failed" or proxy errors:** the backend is not running, or the proxy port in `client/vite.config.js` does not match `PORT`.
- **Atlas connection refused:** add your IP address under Atlas → Network Access.
