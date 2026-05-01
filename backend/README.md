# TaskFlow Backend — Node.js + Express + PostgreSQL

REST API for the TaskFlow Team Task Manager. Built to be deployed to **Railway**.

## Stack
- Node.js 18+ (ES modules)
- Express 4
- PostgreSQL (via `pg`)
- JWT auth (`jsonwebtoken` + `bcryptjs`)
- Zod validation

## Local development

```bash
cd backend
cp .env.example .env       # fill DATABASE_URL + JWT_SECRET
npm install
npm run migrate            # creates tables
npm run dev                # http://localhost:8080
```

## Deploy to Railway

1. Push this repo to GitHub.
2. On [railway.app](https://railway.app) → **New Project → Deploy from GitHub** → select repo.
3. Set the **Root Directory** to `backend` in service Settings.
4. Add a **PostgreSQL** plugin to the project. Railway injects `DATABASE_URL` automatically.
5. Add env var **`JWT_SECRET`** (any long random string). Optionally set `CORS_ORIGIN` to your frontend URL.
6. Deploy. The start command (`npm run migrate && npm start`) is in `railway.json` — migrations run automatically on each deploy.
7. Copy the public URL from Railway and set it as `VITE_API_URL` on your frontend.

## REST API

All protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Body | Access |
|---|---|---|---|
| POST | `/api/auth/signup` | `{email,password,name,role?}` | public |
| POST | `/api/auth/login` | `{email,password}` | public |
| GET  | `/api/auth/me` | — | auth |

### Users
| Method | Path | Access |
|---|---|---|
| GET | `/api/users` | auth |

### Projects
| Method | Path | Access |
|---|---|---|
| GET | `/api/projects` | auth (filtered by membership) |
| POST | `/api/projects` | **admin** |
| PUT | `/api/projects/:id` | **admin** |
| DELETE | `/api/projects/:id` | **admin** |
| GET | `/api/projects/:id/members` | auth |
| POST | `/api/projects/:id/members` | **admin** |
| DELETE | `/api/projects/:id/members/:userId` | **admin** |

### Tasks
| Method | Path | Access |
|---|---|---|
| GET | `/api/tasks` | auth (filtered) |
| POST | `/api/tasks` | **admin** |
| PUT | `/api/tasks/:id` | admin (full) / assignee (status only) |
| DELETE | `/api/tasks/:id` | **admin** |

## Role-based access control
- **Admin**: full CRUD on projects, members, tasks.
- **Member**: read projects/tasks they belong to or are assigned; can update status of their own tasks.
- Enforced in middleware (`requireAuth`, `requireAdmin`) and route logic.

## Schema relationships
`users 1—N projects (created_by)` · `projects N—N users (project_members)` · `projects 1—N tasks` · `tasks N—1 users (assignee)`

See `src/db/schema.sql`.
