# SKILL//INTELLIGENCE — Full-Stack Workforce Analytics Platform

Corporate Workforce & Software Skills Analytics powered by O*NET dataset intelligence and PostgreSQL integration.

---

## 1. Architecture & Project Layout

```
skill-intelligence/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── health.py        # GET /api/health
│   │   │   │   ├── database.py      # Status, Test-Connection, Connect
│   │   │   │   ├── analytics.py     # Aggregations, Top Occs, Categories, Demand
│   │   │   │   └── records.py       # Paginated records, Occupations, Software
│   │   │   └── router.py            # API router aggregator
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic settings & URI sanitizers
│   │   │   └── security.py          # Credential redaction & psycopg3 URI normalizer
│   │   ├── db/
│   │   │   └── database.py          # Engine pooling, sessionmaker & dynamic connect
│   │   ├── models/
│   │   │   └── onet.py              # SQLAlchemy 2.x model (onet_software_skills)
│   │   ├── schemas/
│   │   │   ├── database.py          # Connection & status schemas
│   │   │   ├── analytics.py         # Metrics, distribution & insights schemas
│   │   │   └── onet.py              # Paginated records & search schemas
│   │   ├── services/
│   │   │   ├── analytics.py         # SQL aggregation queries
│   │   │   └── onet.py              # Filtered queries & pagination
│   │   └── main.py                  # FastAPI application with CORS & lifespan
│   ├── tests/
│   │   ├── test_api.py              # Health, security & connection validation tests
│   │   └── test_database.py         # Schema, analytics calculations & pagination tests
│   ├── requirements.txt             # Python dependencies (FastAPI, SQLAlchemy, psycopg)
│   └── .env.example                 # Example backend environment variables
├── src/
│   ├── api/
│   │   └── client.ts                # Typed client for all backend REST endpoints
│   ├── components/
│   │   ├── Navigation.tsx           # Top Bar Contract header
│   │   ├── DatabaseModal.tsx        # Database connection configuration modal
│   │   └── DisconnectedState.tsx    # Technical standby state with connection CTA
│   ├── pages/
│   │   ├── OverviewPage.tsx         # The Skills Landscape dashboard & density charts
│   │   ├── OccupationExplorerPage.tsx # SOC occupation browser & software rosters
│   │   ├── SoftwareLandscapePage.tsx # Discrete software search & category filters
│   │   ├── DemandSignalsPage.tsx    # Hot tech vs standard & employer demand signals
│   │   └── DataExplorerPage.tsx     # Full paginated table with CSV export
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   ├── App.tsx                      # Root component & page router
│   ├── main.tsx                     # React root mount
│   └── index.css                    # Tailwind CSS v4 & technical command palette
├── server.ts                        # Full-stack orchestrator: FastAPI + Vite on port 3000
├── package.json                     # Node dependencies & npm scripts
└── README.md                        # Documentation & setup guide
```

---

## 2. Connecting Existing Supabase PostgreSQL Database

The application connects to your existing Supabase database table `public.onet_software_skills` (~31,821 records).

### Finding Your Supabase Connection String:
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project, click **Project Settings** (gear icon) in the bottom-left sidebar.
3. Navigate to **Database** &rarr; scroll to **Connection string**.
4. Select the **URI** tab.
5. Choose **Transaction Pooler** (recommended, port `6543`) or **Direct connection** (port `5432`).
6. Replace `[YOUR-PASSWORD]` with your actual database password.

Format:
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### In-App Connection Flow:
1. Click **Connect Database** in the top-right corner of the application.
2. Paste your PostgreSQL Connection URI.
3. Click **Test Connection** &rarr; The backend safely tests the connection, inspects the schema, verifies `public.onet_software_skills`, checks columns, and reports row count without storing credentials.
4. Click **Save & Connect** &rarr; The application establishes the active connection pool and unlocks the analytics dashboard!

Alternatively, set `DATABASE_URL` in your backend `.env` file before launching.

---

## 3. Deploying to Render + Supabase (separate frontend and backend)

This repository is designed to be deployed as two Render services. The frontend must call the public FastAPI service URL; the frontend cannot use the local `/api` proxy after it is deployed as a static site.

### A. Deploy the backend API first
1. Create a **Web Service** on Render connected to this repository.
2. Leave **Root Directory** empty (repository root).
3. Runtime: **Python**.
4. Build command: `pip install -r backend/requirements.txt`
5. Start command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables:
   - `DATABASE_URL`: the PostgreSQL connection URI copied from Supabase (use the appropriate pooler URI if direct connections are not supported by the host). Never commit this value.
   - `DEBUG`: `false`
   - `CORS_ORIGINS`: a JSON array containing the exact deployed frontend origin, for example `["https://your-frontend.onrender.com"]`. Include local origins only if needed for development.
7. After deployment, test `https://YOUR-BACKEND.onrender.com/` and `https://YOUR-BACKEND.onrender.com/api/health`. The root response should report whether the database connected.

### B. Deploy the frontend as a Static Site
1. Create a **Static Site** on Render using the same repository.
2. Leave **Root Directory** empty.
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add build environment variable `VITE_API_BASE_URL` with the backend origin only, e.g. `https://your-backend.onrender.com` (no trailing slash and do not append `/api`).
6. After deployment, copy the static site URL and add it to the backend `CORS_ORIGINS` JSON array. Save the variable and redeploy the backend.

### C. Supabase table requirement
The backend expects the table `public.onet_software_skills` and the core columns `id`, `onet_soc_code`, `occupation_title`, `software_example`, and `software_category`. The analytics endpoints may require additional columns; check the model and service queries against the actual Supabase table before deployment. The app validates the expected table when it connects.

### D. Security notes
- Keep `DATABASE_URL` only in the Render backend environment variables. Never add it to `VITE_*` variables or frontend code.
- `VITE_API_BASE_URL` is public by design and must contain only the backend URL, never credentials.
- Configure CORS to allow only the frontend origin you control; do not use `*` in production.
- Test the health endpoint and database status after each deployment.

## 4. Local Development (Ubuntu / Linux)

### Prerequisites:
- Python 3.10+
- Node.js 18+ & npm

### Option A: Unified Full-Stack Runner (Recommended)
This runs both the Python FastAPI backend on port 8001 and Express/Vite on port 3000:

```bash
# 1. Install Node dependencies
npm install

# 2. Install Python dependencies
pip install -r backend/requirements.txt

# 3. Start unified dev server
npm run dev
```

Visit `http://localhost:3000` in your browser.
API documentation (Swagger UI) is accessible at `http://localhost:3000/docs`.

### Option B: Separate Backend & Frontend Processes

Terminal 1 (Backend):
```bash
pip install -r backend/requirements.txt
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8001 --reload
```

Terminal 2 (Frontend):
```bash
npm install
npm run dev
```

---

## 5. Running Backend Tests

Run the complete automated test suite (verifying database validation, error redaction, analytics calculations, and pagination):

```bash
python3 -m pytest backend/tests/ -v
# or
npm run test:backend
```

---

## 6. Security Principles Enforced

- **Credential Redaction**: Passwords and secret connection strings are redacted before logging and error reporting.
- **Zero Frontend Secrets**: No database connection string or passwords exist in frontend source code or browser storage (`localStorage` / `sessionStorage`).
- **SQL Injection Prevention**: Safe SQLAlchemy 2.0 parameterized queries and expressions across all search and filter operations.
- **Graceful Error Handling**: Database errors return structured, informative status codes without leaking stack traces.
