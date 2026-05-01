-- TaskFlow schema (PostgreSQL)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  avatar      TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT '#6366f1',
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  status       TEXT NOT NULL CHECK (status IN ('todo','in_progress','review','done')) DEFAULT 'todo',
  priority     TEXT NOT NULL CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  assignee_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON project_members(user_id);
