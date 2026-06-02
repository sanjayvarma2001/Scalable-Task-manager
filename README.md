# Scalable REST API — FastAPI + PostgreSQL + React

A production-ready REST API with JWT authentication, role-based access control, task management CRUD, and a React frontend — built as part of the Backend Developer Intern assignment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn (ASGI) |
| ORM | SQLAlchemy 2.0 (async), Alembic |
| Database | PostgreSQL 16 |
| Auth | JWT — python-jose, bcrypt 4.x |
| Validation | Pydantic v2 |
| API Docs | Swagger UI `/docs` · ReDoc `/redoc` (auto-generated) |
| Frontend | React 18, Vite, Axios, React Router v6 |
| Container | Docker, docker-compose |

---

## Project Structure

```
project/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, middleware, error handlers
│   │   ├── database.py          # Async SQLAlchemy engine + session
│   │   ├── core/
│   │   │   ├── config.py        # Env-based settings (pydantic-settings)
│   │   │   ├── security.py      # bcrypt hash/verify, JWT create/decode
│   │   │   ├── deps.py          # get_db, get_current_user, require_admin
│   │   │   └── exceptions.py    # Typed HTTP exceptions
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── user.py          # users table
│   │   │   ├── task.py          # tasks table
│   │   │   └── refresh_token.py # refresh_tokens table
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── task.py
│   │   │   └── user.py
│   │   ├── api/v1/              # Route handlers
│   │   │   ├── auth.py          # /register /login /refresh /logout /me
│   │   │   ├── tasks.py         # Full CRUD
│   │   │   └── admin.py         # Admin-only user management
│   │   └── services/            # Business logic (separated from routes)
│   │       ├── auth_service.py
│   │       ├── task_service.py
│   │       └── admin_service.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios instance + typed API calls
│   │   ├── context/             # AuthContext (JWT state, auto-refresh)
│   │   ├── pages/               # Login, Register, Dashboard, Admin
│   │   └── components/          # Navbar, TaskModal
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Database Schema

```sql
-- Users
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100),
    role            VARCHAR(10) DEFAULT 'user',   -- 'user' | 'admin'
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    status      VARCHAR(20) DEFAULT 'todo',      -- 'todo' | 'in_progress' | 'done'
    priority    VARCHAR(10) DEFAULT 'medium',    -- 'low' | 'medium' | 'high'
    owner_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) UNIQUE NOT NULL,    -- SHA-256 hash, never stored raw
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Quick Start

### Option 1 — Docker (recommended, one command)

```bash
git clone <your-repo-url>
cd project
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

### Option 2 — Local Development

**Prerequisites:** Python 3.11/3.12, Node.js 18+, PostgreSQL 16 running

**Backend**
```bash
cd backend
py -3.12 -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env           # edit DATABASE_URL if needed
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

---

## API Endpoints

### Auth — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register new user |
| POST | `/login` | Public | Login → access + refresh tokens |
| POST | `/refresh` | Public | Get new access token |
| POST | `/logout` | Public | Revoke refresh token |
| GET | `/me` | Bearer | Get current user profile |

### Tasks — `/api/v1/tasks`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Bearer | List tasks (paginated, filterable) |
| POST | `/` | Bearer | Create task |
| GET | `/:id` | Bearer | Get single task |
| PATCH | `/:id` | Bearer | Partial update |
| DELETE | `/:id` | Bearer | Delete task |

### Admin — `/api/v1/admin`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Admin | List all users |
| PATCH | `/users/:id/role` | Admin | Change user role |
| PATCH | `/users/:id/toggle-active` | Admin | Activate / deactivate |
| DELETE | `/users/:id` | Admin | Delete user + their tasks |

---

## Security Implementation

| Concern | Implementation |
|---|---|
| Password storage | bcrypt with gensalt (cost factor 12), truncated to 72 bytes safely |
| Access tokens | JWT, expires in **15 minutes** |
| Refresh tokens | JWT, expires in **7 days**, SHA-256 hashed before DB storage, revokable |
| Input validation | Pydantic v2 validators on every request body |
| CORS | Restricted to configured origins via `ALLOWED_ORIGINS` |
| Rate limiting | slowapi on all endpoints |
| Role enforcement | FastAPI dependency injection (`require_admin`) |
| Error responses | Typed exceptions — never leaks stack traces in production |

---

## Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/taskdb
SECRET_KEY=your-super-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## API Documentation

- **Swagger UI** — http://localhost:8000/docs (interactive, try endpoints directly)
- **ReDoc** — http://localhost:8000/redoc (clean reference docs)
- **Postman Collection** — see `/postman/TaskAPI.postman_collection.json`

To authenticate in Swagger UI:
1. Call `POST /api/v1/auth/login`
2. Copy the `access_token` from the response
3. Click **Authorize** → paste `<token>` → click Authorize

---

## Scalability Notes

See `SCALABILITY.md` for the full breakdown.

**Short version:**
- Async I/O throughout (SQLAlchemy async + asyncpg) — handles high concurrency with minimal threads
- Stateless JWT auth — any replica can verify tokens, enabling horizontal scaling
- Modular structure — adding a new entity requires only new files, zero changes to existing code
- Docker-ready — scales to Kubernetes with minimal config changes
- Next steps: Redis caching, PgBouncer connection pooling, Nginx load balancer

---

## Author

M Sanjay Varma