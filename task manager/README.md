# ⚡ TaskFlow — Team Task Manager

A full-stack team task management web app: create projects, assign tasks, and track progress with **role-based access control** (Admin / Member).

Built on **React + TypeScript + Tailwind** on the frontend and **PostgreSQL + Auth + REST APIs** (via Lovable Cloud / Supabase) on the backend.

---

## 🚀 Features

### Authentication
- Email + password sign up / sign in
- **Role selection at registration** (Admin or Member)
- Sessions persisted automatically (JWT-based)
- Server-side input validation (zod)

### Role-Based Access Control (enforced by Postgres Row-Level Security)
| Feature | Admin | Member |
|---|---|---|
| Create / delete projects | ✅ | ❌ |
| Create / delete tasks | ✅ | ❌ |
| Update task status (own assigned tasks) | ✅ | ✅ |
| View all projects & tasks | ✅ | Own / member-of only |
| View team page | ✅ | ✅ |

### Dashboard
- Stats: total projects, total tasks, in-progress, overdue
- "My Tasks" panel (assigned to current user)
- "Recent Activity" panel (latest tasks)

### Projects
- Create with name, description, color, team members
- Per-project progress bar (% done)
- Avatar stack with overflow indicator
- Admin-only delete (cascades to tasks)

### Tasks
- Create / edit / delete (Admin)
- Status, priority, project, assignee, due date
- Inline status change (assignees can update their own)
- Filter by project / status / priority
- Overdue tasks highlighted in red

### Team
- All members with role badges
- Per-member stats (assigned / in-progress / done)

### Profile
- Edit name & email, sign out

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, lucide-react, sonner |
| Backend | Lovable Cloud (PostgreSQL + GoTrue Auth + PostgREST) |
| Validation | zod (client + server) |
| Security | Row-Level Security on every table; SECURITY DEFINER role-check helpers |
| Deployment | Lovable hosting (one-click publish) |

---

## 🗄 Database Schema

```
profiles          (id, name, email, avatar)            ← 1:1 with auth user
user_roles        (user_id, role)                      ← 'admin' | 'member'
projects          (id, name, description, color, created_by)
project_members   (project_id, user_id)                ← M:N
tasks             (id, project_id, title, description,
                   status, priority, assignee_id,
                   created_by, due_date)
```

Roles live in a separate `user_roles` table to prevent privilege-escalation
(never trust a `role` column on a user-editable table). All policy checks go
through SECURITY DEFINER functions (`is_admin`, `is_project_member`) to
avoid recursive RLS.

---

## 🔌 REST API

The backend automatically exposes a REST API for each table at:

```
GET    /rest/v1/projects        ← list (filtered by RLS)
POST   /rest/v1/projects        ← admin only
DELETE /rest/v1/projects?id=eq.<uuid>

GET    /rest/v1/tasks
POST   /rest/v1/tasks           ← admin only
PATCH  /rest/v1/tasks?id=eq.<uuid>
DELETE /rest/v1/tasks?id=eq.<uuid>
```

Auth endpoints:

```
POST /auth/v1/signup
POST /auth/v1/token?grant_type=password
POST /auth/v1/logout
```

All access is scoped to the authenticated user via JWT + RLS.

---

## 🏃 Local Development

```bash
git clone <repo>
cd taskflow
npm install
npm run dev
```

The `.env` file contains the public backend URL & anon key — no extra setup needed.

---

## 🌐 Deployment

The app is deployed via **Lovable** (one-click publish). To publish your own copy:

1. Open the project in Lovable
2. Click **Publish** in the top right
3. (Optional) Connect a custom domain from Project Settings → Domains

> The original assignment specifies Railway, but this project uses Lovable's hosting which provides equivalent live HTTPS deployment with zero config. The same React frontend can also be deployed to Railway/Vercel/Netlify if preferred — only the env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) need to be provided.

---

## 📝 First-time Setup

1. Sign up as an **Admin** first — admins are the only role that can create projects and tasks.
2. Have teammates sign up as **Members**.
3. As admin, create projects and add team members to them.
4. Create tasks and assign them — assignees can update status from any page.

---

## 📂 Project Structure

```
src/
├── App.tsx                       Route shell + providers
├── components/
│   └── taskflow/
│       ├── AppShell.tsx          Sidebar layout
│       └── Atoms.tsx             Avatar / Tag
├── hooks/
│   ├── useAuth.tsx               Session + profile + role context
│   └── useTaskflowData.tsx       Fetch all tables
├── lib/taskflow.ts               Constants & helpers
├── pages/
│   ├── Auth.tsx
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── Tasks.tsx
│   ├── Team.tsx
│   └── Profile.tsx
├── integrations/supabase/        (auto-generated client)
└── index.css                     Design tokens
supabase/
└── migrations/                   SQL schema + RLS
```
