import { useState, useEffect, useCallback } from "react";

// ─── Storage Keys ───────────────────────────────────────────────────────────
const KEYS = { users: "ttm:users", projects: "ttm:projects", tasks: "ttm:tasks", session: "ttm:session" };

// ─── Seed Data ───────────────────────────────────────────────────────────────
const SEED_USERS = [
  { id: "u1", name: "Alice Admin", email: "alice@demo.com", password: "demo123", role: "admin", avatar: "AA" },
  { id: "u2", name: "Bob Member", email: "bob@demo.com", password: "demo123", role: "member", avatar: "BM" },
  { id: "u3", name: "Carol Dev", email: "carol@demo.com", password: "demo123", role: "member", avatar: "CD" },
];
const SEED_PROJECTS = [
  { id: "p1", name: "Website Redesign", description: "Overhaul the company website", color: "#6366f1", members: ["u1", "u2", "u3"], createdBy: "u1", createdAt: Date.now() - 86400000 * 10 },
  { id: "p2", name: "Mobile App v2", description: "Second version of our flagship app", color: "#0ea5e9", members: ["u1", "u3"], createdBy: "u1", createdAt: Date.now() - 86400000 * 5 },
];
const today = Date.now();
const SEED_TASKS = [
  { id: "t1", projectId: "p1", title: "Design system audit", description: "Audit existing components", status: "done", priority: "high", assigneeId: "u2", createdBy: "u1", dueDate: today - 86400000 * 2, createdAt: today - 86400000 * 8 },
  { id: "t2", projectId: "p1", title: "Figma prototype", description: "Create hi-fi prototype", status: "in-progress", priority: "high", assigneeId: "u3", createdBy: "u1", dueDate: today + 86400000 * 2, createdAt: today - 86400000 * 6 },
  { id: "t3", projectId: "p1", title: "Copywriting", description: "Write all page copy", status: "todo", priority: "medium", assigneeId: "u2", createdBy: "u1", dueDate: today + 86400000 * 5, createdAt: today - 86400000 * 4 },
  { id: "t4", projectId: "p1", title: "SEO Optimization", description: "On-page SEO pass", status: "todo", priority: "low", assigneeId: null, createdBy: "u1", dueDate: today + 86400000 * 10, createdAt: today - 86400000 * 3 },
  { id: "t5", projectId: "p2", title: "Auth flow", description: "JWT-based auth system", status: "in-progress", priority: "high", assigneeId: "u3", createdBy: "u1", dueDate: today - 86400000 * 1, createdAt: today - 86400000 * 4 },
  { id: "t6", projectId: "p2", title: "Push notifications", description: "Firebase integration", status: "todo", priority: "medium", assigneeId: "u3", createdBy: "u1", dueDate: today + 86400000 * 7, createdAt: today - 86400000 * 2 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (ts) => ts ? new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
const isOverdue = (task) => task.dueDate && task.status !== "done" && task.dueDate < Date.now();
const STATUSES = ["todo", "in-progress", "done"];
const STATUS_LABEL = { todo: "To Do", "in-progress": "In Progress", done: "Done" };
const STATUS_COLORS = { todo: "#64748b", "in-progress": "#f59e0b", done: "#10b981" };
const PRIORITY_COLORS = { high: "#ef4444", medium: "#f97316", low: "#6366f1" };

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: "#0f0f11", color: "#e2e8f0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", display: "flex" },
  sidebar: { width: 220, background: "#18181b", borderRight: "1px solid #27272a", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 },
  logo: { padding: "0 20px 24px", fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { width: 28, height: 28, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "9px 20px", cursor: "pointer", borderRadius: 0, fontSize: 14, color: active ? "#fff" : "#71717a", background: active ? "rgba(99,102,241,0.15)" : "transparent", borderLeft: active ? "2px solid #6366f1" : "2px solid transparent", transition: "all 0.15s" }),
  main: { flex: 1, overflow: "auto", background: "#0f0f11" },
  header: { padding: "20px 28px 16px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f0f11", position: "sticky", top: 0, zIndex: 10 },
  page: { padding: "24px 28px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "20px" },
  title: { fontSize: 20, fontWeight: 700, color: "#fff", margin: "0 0 4px" },
  sub: { fontSize: 13, color: "#71717a" },
  btn: (variant = "primary") => ({
    padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.15s",
    background: variant === "primary" ? "#6366f1" : variant === "danger" ? "#ef4444" : variant === "ghost" ? "transparent" : "#27272a",
    color: variant === "ghost" ? "#71717a" : "#fff",
    border: variant === "ghost" ? "1px solid #27272a" : "none",
  }),
  input: { width: "100%", padding: "9px 12px", background: "#27272a", border: "1px solid #3f3f46", borderRadius: 8, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  label: { fontSize: 12, color: "#a1a1aa", marginBottom: 6, display: "block", fontWeight: 500 },
  badge: (color) => ({ background: color + "22", color: color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }),
  row: { display: "flex", alignItems: "center", gap: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 },
  avatar: (color = "#6366f1") => ({ width: 32, height: 32, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }),
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" },
  modalBox: { background: "#18181b", border: "1px solid #27272a", borderRadius: 16, padding: 28, width: 440, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto" },
  stat: (accent) => ({ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "18px 20px", borderTop: `3px solid ${accent}` }),
  tag: (color) => ({ background: color + "18", border: `1px solid ${color}40`, color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }),
};

// ─── Storage Hook ─────────────────────────────────────────────────────────────
function useStore() {
  const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
  const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

  const [users, setUsersRaw] = useState(() => { const u = load(KEYS.users, null); if (!u) { save(KEYS.users, SEED_USERS); return SEED_USERS; } return u; });
  const [projects, setProjectsRaw] = useState(() => { const p = load(KEYS.projects, null); if (!p) { save(KEYS.projects, SEED_PROJECTS); return SEED_PROJECTS; } return p; });
  const [tasks, setTasksRaw] = useState(() => { const t = load(KEYS.tasks, null); if (!t) { save(KEYS.tasks, SEED_TASKS); return SEED_TASKS; } return t; });
  const [session, setSessionRaw] = useState(() => load(KEYS.session, null));

  const setUsers = (v) => { const r = typeof v === "function" ? v(users) : v; save(KEYS.users, r); setUsersRaw(r); };
  const setProjects = (v) => { const r = typeof v === "function" ? v(projects) : v; save(KEYS.projects, r); setProjectsRaw(r); };
  const setTasks = (v) => { const r = typeof v === "function" ? v(tasks) : v; save(KEYS.tasks, r); setTasksRaw(r); };
  const setSession = (v) => { save(KEYS.session, v); setSessionRaw(v); };

  return { users, setUsers, projects, setProjects, tasks, setTasks, session, setSession };
}

// ─── Auth Page ─────────────────────────────────────────────────────────────────
function AuthPage({ users, setSession, setUsers }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "member" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    setErr("");
    if (mode === "login") {
      const u = users.find(u => u.email === form.email && u.password === form.password);
      if (!u) return setErr("Invalid email or password.");
      setSession(u.id);
    } else {
      if (!form.name || !form.email || !form.password) return setErr("All fields required.");
      if (users.find(u => u.email === form.email)) return setErr("Email already registered.");
      const newUser = { id: uid(), name: form.name, email: form.email, password: form.password, role: form.role, avatar: form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() };
      setUsers(u => [...u, newUser]);
      setSession(newUser.id);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f11", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 22 }}>⚡</div>
          <h1 style={{ color: "#fff", margin: 0, fontSize: 24, fontWeight: 700 }}>TaskFlow</h1>
          <p style={{ color: "#71717a", fontSize: 13, margin: "6px 0 0" }}>Team task management, simplified</p>
        </div>
        <div style={{ ...S.card, padding: 28 }}>
          <div style={{ display: "flex", background: "#27272a", borderRadius: 8, padding: 3, marginBottom: 22 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: mode === m ? "#6366f1" : "transparent", color: mode === m ? "#fff" : "#71717a", transition: "all 0.15s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Full Name</label>
              <input style={S.input} placeholder="Alice Smith" value={form.name} onChange={set("name")} />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Email</label>
            <input style={S.input} placeholder="you@company.com" value={form.email} onChange={set("email")} />
          </div>
          <div style={{ marginBottom: mode === "signup" ? 14 : 20 }}>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
          </div>
          {mode === "signup" && (
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Role</label>
              <select style={{ ...S.input }} value={form.role} onChange={set("role")}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          {err && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 14px" }}>{err}</p>}
          <button onClick={submit} style={{ ...S.btn("primary"), width: "100%", padding: "10px 0", fontSize: 14 }}>
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
          {mode === "login" && (
            <p style={{ color: "#52525b", fontSize: 12, marginTop: 16, textAlign: "center" }}>
              Demo: alice@demo.com / demo123 (Admin) · bob@demo.com (Member)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ me, users, projects, tasks }) {
  const myTasks = tasks.filter(t => t.assigneeId === me.id);
  const overdue = tasks.filter(t => isOverdue(t));
  const byStatus = (s) => tasks.filter(t => t.status === s).length;

  const stats = [
    { label: "Total Projects", value: projects.length, accent: "#6366f1" },
    { label: "Total Tasks", value: tasks.length, accent: "#0ea5e9" },
    { label: "In Progress", value: byStatus("in-progress"), accent: "#f59e0b" },
    { label: "Overdue", value: overdue.length, accent: "#ef4444" },
  ];

  const recentTasks = [...tasks].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={S.title}>Welcome back, {me.name.split(" ")[0]} 👋</h2>
        <p style={S.sub}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div style={{ ...S.grid4, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={S.stat(s.accent)}>
            <p style={{ fontSize: 12, color: "#71717a", margin: "0 0 6px", fontWeight: 500 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>My Tasks</h3>
          {myTasks.length === 0 ? <p style={{ color: "#52525b", fontSize: 13 }}>No tasks assigned to you.</p> : myTasks.slice(0, 5).map(t => (
            <TaskRow key={t.id} task={t} users={users} projects={projects} />
          ))}
        </div>
        <div style={S.card}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 16px" }}>Recent Activity</h3>
          {recentTasks.map(t => (
            <TaskRow key={t.id} task={t} users={users} projects={projects} showProject />
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, users, projects, showProject }) {
  const assignee = users.find(u => u.id === task.assigneeId);
  const project = projects.find(p => p.id === task.projectId);
  const od = isOverdue(task);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #27272a" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, color: od ? "#ef4444" : "#e2e8f0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</p>
        {showProject && project && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#71717a" }}>{project.name}</p>}
      </div>
      <div style={{ ...S.row, gap: 8, flexShrink: 0, marginLeft: 8 }}>
        <span style={S.tag(STATUS_COLORS[task.status])}>{STATUS_LABEL[task.status]}</span>
        {assignee && <div style={S.avatar()}>{assignee.avatar}</div>}
      </div>
    </div>
  );
}

// ─── Projects Page ─────────────────────────────────────────────────────────────
function ProjectsPage({ me, users, projects, setProjects, tasks }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#6366f1", members: [me.id] });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const isAdmin = me.role === "admin";

  const myProjects = isAdmin ? projects : projects.filter(p => p.members.includes(me.id));

  const addProject = () => {
    if (!form.name.trim()) return;
    setProjects(ps => [...ps, { ...form, id: uid(), createdBy: me.id, createdAt: Date.now(), members: form.members.length ? form.members : [me.id] }]);
    setShowModal(false);
    setForm({ name: "", description: "", color: "#6366f1", members: [me.id] });
  };

  const deleteProject = (pid) => {
    if (!window.confirm("Delete this project?")) return;
    setProjects(ps => ps.filter(p => p.id !== pid));
  };

  const toggleMember = (uid) => {
    setForm(f => ({ ...f, members: f.members.includes(uid) ? f.members.filter(m => m !== uid) : [...f.members, uid] }));
  };

  const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div style={S.page}>
      <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={S.title}>Projects</h2>
          <p style={S.sub}>{myProjects.length} project{myProjects.length !== 1 ? "s" : ""}</p>
        </div>
        {isAdmin && <button onClick={() => setShowModal(true)} style={S.btn("primary")}>+ New Project</button>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {myProjects.map(p => {
          const ptasks = tasks.filter(t => t.projectId === p.id);
          const done = ptasks.filter(t => t.status === "done").length;
          const prog = ptasks.length ? Math.round((done / ptasks.length) * 100) : 0;
          return (
            <div key={p.id} style={{ ...S.card, borderTop: `3px solid ${p.color}` }}>
              <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                {isAdmin && <button onClick={() => deleteProject(p.id)} style={{ ...S.btn("ghost"), padding: "2px 8px", fontSize: 12 }}>✕</button>}
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff" }}>{p.name}</h3>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "#71717a" }}>{p.description || "No description"}</p>
              <div style={{ marginBottom: 12 }}>
                <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#71717a" }}>Progress</span>
                  <span style={{ fontSize: 11, color: "#a1a1aa" }}>{prog}%</span>
                </div>
                <div style={{ height: 4, background: "#27272a", borderRadius: 2 }}>
                  <div style={{ height: 4, width: `${prog}%`, background: p.color, borderRadius: 2, transition: "width 0.3s" }} />
                </div>
              </div>
              <div style={{ ...S.row, justifyContent: "space-between" }}>
                <div style={S.row}>
                  {p.members.slice(0, 4).map(mid => {
                    const u = users.find(u => u.id === mid);
                    return u ? <div key={mid} style={{ ...S.avatar(p.color), marginLeft: -6, border: "2px solid #18181b" }}>{u.avatar}</div> : null;
                  })}
                  {p.members.length > 4 && <span style={{ fontSize: 11, color: "#71717a", marginLeft: 4 }}>+{p.members.length - 4}</span>}
                </div>
                <span style={{ fontSize: 12, color: "#71717a" }}>{ptasks.length} tasks</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={S.modalBox}>
            <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: 16 }}>New Project</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Project Name</label>
              <input style={S.input} placeholder="e.g. Marketing Campaign" value={form.name} onChange={set("name")} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Description</label>
              <textarea style={{ ...S.input, resize: "vertical", minHeight: 70 }} placeholder="What's this project about?" value={form.description} onChange={set("description")} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Color</label>
              <div style={S.row}>
                {COLORS.map(c => <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 24, height: 24, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? "2px solid #fff" : "2px solid transparent" }} />)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Team Members</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {users.map(u => (
                  <div key={u.id} onClick={() => toggleMember(u.id)} style={{ ...S.row, gap: 6, padding: "5px 10px", borderRadius: 6, border: `1px solid ${form.members.includes(u.id) ? "#6366f1" : "#27272a"}`, cursor: "pointer", background: form.members.includes(u.id) ? "#6366f118" : "transparent", fontSize: 12, color: form.members.includes(u.id) ? "#a5b4fc" : "#71717a" }}>
                    {u.avatar} {u.name.split(" ")[0]}
                  </div>
                ))}
              </div>
            </div>
            <div style={S.row}>
              <button onClick={addProject} style={S.btn("primary")}>Create Project</button>
              <button onClick={() => setShowModal(false)} style={S.btn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tasks Page ────────────────────────────────────────────────────────────────
function TasksPage({ me, users, projects, tasks, setTasks }) {
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", projectId: "", assigneeId: "", status: "todo", priority: "medium", dueDate: "" });
  const isAdmin = me.role === "admin";
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const myProjects = isAdmin ? projects : projects.filter(p => p.members.includes(me.id));
  const visibleTasks = tasks.filter(t => {
    if (!isAdmin && !myProjects.some(p => p.id === t.projectId)) return false;
    if (filterProject !== "all" && t.projectId !== filterProject) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const openNew = () => { setEditTask(null); setForm({ title: "", description: "", projectId: myProjects[0]?.id || "", assigneeId: "", status: "todo", priority: "medium", dueDate: "" }); setShowModal(true); };
  const openEdit = (task) => { setEditTask(task); setForm({ ...task, dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "" }); setShowModal(true); };

  const save = () => {
    if (!form.title.trim() || !form.projectId) return;
    const dueTs = form.dueDate ? new Date(form.dueDate).getTime() : null;
    if (editTask) {
      setTasks(ts => ts.map(t => t.id === editTask.id ? { ...t, ...form, dueDate: dueTs } : t));
    } else {
      setTasks(ts => [...ts, { ...form, id: uid(), createdBy: me.id, createdAt: Date.now(), dueDate: dueTs, assigneeId: form.assigneeId || null }]);
    }
    setShowModal(false);
  };

  const del = (tid) => { if (!window.confirm("Delete task?")) return; setTasks(ts => ts.filter(t => t.id !== tid)); };
  const changeStatus = (tid, s) => setTasks(ts => ts.map(t => t.id === tid ? { ...t, status: s } : t));

  const projectMembers = myProjects.find(p => p.id === form.projectId)?.members || [];

  return (
    <div style={S.page}>
      <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={S.title}>Tasks</h2>
          <p style={S.sub}>{visibleTasks.length} task{visibleTasks.length !== 1 ? "s" : ""} found</p>
        </div>
        {isAdmin && <button onClick={openNew} style={S.btn("primary")}>+ New Task</button>}
      </div>

      <div style={{ ...S.row, flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {[
          { val: filterProject, set: setFilterProject, opts: [["all", "All Projects"], ...myProjects.map(p => [p.id, p.name])] },
          { val: filterStatus, set: setFilterStatus, opts: [["all", "All Statuses"], ...STATUSES.map(s => [s, STATUS_LABEL[s]])] },
          { val: filterPriority, set: setFilterPriority, opts: [["all", "All Priorities"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]] },
        ].map((f, i) => (
          <select key={i} value={f.val} onChange={e => f.set(e.target.value)} style={{ ...S.input, width: "auto", padding: "7px 12px", fontSize: 13 }}>
            {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 140px 80px", padding: "10px 16px", borderBottom: "1px solid #27272a", fontSize: 11, color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          <span>Task</span><span>Project</span><span>Status</span><span>Priority</span><span>Assignee</span><span>Due</span>
        </div>
        {visibleTasks.length === 0 && <p style={{ color: "#52525b", fontSize: 13, padding: "20px 16px" }}>No tasks found.</p>}
        {visibleTasks.map(t => {
          const proj = projects.find(p => p.id === t.projectId);
          const assignee = users.find(u => u.id === t.assigneeId);
          const od = isOverdue(t);
          const canEdit = isAdmin || t.assigneeId === me.id;
          return (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 140px 80px", padding: "12px 16px", borderBottom: "1px solid #1c1c1f", alignItems: "center", transition: "background 0.1s" }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{t.title}</p>
                {t.description && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description}</p>}
              </div>
              <div>{proj && <span style={{ fontSize: 11, color: "#71717a", display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: proj.color, flexShrink: 0 }} />{proj.name}</span>}</div>
              <div>
                <select value={t.status} onChange={e => changeStatus(t.id, e.target.value)} style={{ background: STATUS_COLORS[t.status] + "22", border: "none", borderRadius: 5, padding: "3px 6px", fontSize: 11, color: STATUS_COLORS[t.status], cursor: "pointer", fontWeight: 600 }}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div><span style={S.tag(PRIORITY_COLORS[t.priority])}>{t.priority}</span></div>
              <div style={S.row}>
                {assignee ? <><div style={S.avatar()}>{assignee.avatar}</div><span style={{ fontSize: 12, color: "#71717a" }}>{assignee.name.split(" ")[0]}</span></> : <span style={{ fontSize: 12, color: "#52525b" }}>Unassigned</span>}
              </div>
              <div style={{ ...S.row, gap: 6 }}>
                <span style={{ fontSize: 11, color: od ? "#ef4444" : "#71717a" }}>{fmtDate(t.dueDate)}</span>
                {canEdit && <button onClick={() => openEdit(t)} style={{ ...S.btn("ghost"), padding: "2px 6px", fontSize: 11 }}>✎</button>}
                {isAdmin && <button onClick={() => del(t.id)} style={{ ...S.btn("ghost"), padding: "2px 6px", fontSize: 11, color: "#ef4444" }}>✕</button>}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={S.modalBox}>
            <h3 style={{ color: "#fff", margin: "0 0 20px", fontSize: 16 }}>{editTask ? "Edit Task" : "New Task"}</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Title *</label>
              <input style={S.input} placeholder="Task title" value={form.title} onChange={set("title")} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Description</label>
              <textarea style={{ ...S.input, resize: "vertical", minHeight: 60 }} value={form.description} onChange={set("description")} />
            </div>
            <div style={{ ...S.grid2, marginBottom: 14 }}>
              <div>
                <label style={S.label}>Project *</label>
                <select style={S.input} value={form.projectId} onChange={set("projectId")}>
                  <option value="">Select project</option>
                  {myProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Assignee</label>
                <select style={S.input} value={form.assigneeId} onChange={set("assigneeId")}>
                  <option value="">Unassigned</option>
                  {users.filter(u => projectMembers.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ ...S.grid2, marginBottom: 14 }}>
              <div>
                <label style={S.label}>Status</label>
                <select style={S.input} value={form.status} onChange={set("status")}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Priority</label>
                <select style={S.input} value={form.priority} onChange={set("priority")}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={S.label}>Due Date</label>
              <input type="date" style={S.input} value={form.dueDate} onChange={set("dueDate")} />
            </div>
            <div style={S.row}>
              <button onClick={save} style={S.btn("primary")}>{editTask ? "Save Changes" : "Create Task"}</button>
              <button onClick={() => setShowModal(false)} style={S.btn("ghost")}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Team Page ─────────────────────────────────────────────────────────────────
function TeamPage({ me, users, tasks }) {
  const isAdmin = me.role === "admin";
  return (
    <div style={S.page}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={S.title}>Team</h2>
        <p style={S.sub}>{users.length} members</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
        {users.map(u => {
          const assigned = tasks.filter(t => t.assigneeId === u.id);
          const done = assigned.filter(t => t.status === "done").length;
          const inprog = assigned.filter(t => t.status === "in-progress").length;
          const COLORS2 = { admin: "#6366f1", member: "#0ea5e9" };
          return (
            <div key={u.id} style={S.card}>
              <div style={{ ...S.row, marginBottom: 14 }}>
                <div style={{ ...S.avatar(COLORS2[u.role] || "#6366f1"), width: 44, height: 44, fontSize: 14 }}>{u.avatar}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{u.name}</p>
                  <span style={S.tag(COLORS2[u.role] || "#6366f1")}>{u.role}</span>
                </div>
                {u.id === me.id && <span style={{ ...S.tag("#10b981"), marginLeft: "auto" }}>You</span>}
              </div>
              <p style={{ fontSize: 12, color: "#52525b", margin: "0 0 10px" }}>{u.email}</p>
              <div style={{ ...S.row, gap: 8, justifyContent: "space-between", borderTop: "1px solid #27272a", paddingTop: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>{assigned.length}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#52525b" }}>Assigned</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>{inprog}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#52525b" }}>In Progress</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#10b981" }}>{done}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#52525b" }}>Done</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Profile Page ──────────────────────────────────────────────────────────────
function ProfilePage({ me, users, setUsers, setSession }) {
  const [form, setForm] = useState({ name: me.name, email: me.email });
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = () => {
    setUsers(us => us.map(u => u.id === me.id ? { ...u, name: form.name, email: form.email, avatar: form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() } : u));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={S.page}>
      <h2 style={S.title}>Profile</h2>
      <div style={{ maxWidth: 440, marginTop: 20 }}>
        <div style={{ ...S.card, marginBottom: 16 }}>
          <div style={{ ...S.row, marginBottom: 20 }}>
            <div style={{ ...S.avatar(), width: 56, height: 56, fontSize: 18 }}>{me.avatar}</div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{me.name}</p>
              <span style={S.tag(me.role === "admin" ? "#6366f1" : "#0ea5e9")}>{me.role}</span>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={S.label}>Name</label>
            <input style={S.input} value={form.name} onChange={set("name")} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Email</label>
            <input style={S.input} value={form.email} onChange={set("email")} />
          </div>
          <div style={S.row}>
            <button onClick={save} style={S.btn("primary")}>{saved ? "✓ Saved!" : "Save Changes"}</button>
            <button onClick={() => setSession(null)} style={S.btn("danger")}>Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App Shell ──────────────────────────────────────────────────────────────────
export default function App() {
  const { users, setUsers, projects, setProjects, tasks, setTasks, session, setSession } = useStore();
  const [page, setPage] = useState("dashboard");

  const me = users.find(u => u.id === session);
  if (!session || !me) return <AuthPage users={users} setSession={setSession} setUsers={setUsers} />;

  const isAdmin = me.role === "admin";
  const overdue = tasks.filter(t => isOverdue(t)).length;

  const NAV = [
    { id: "dashboard", icon: "⊞", label: "Dashboard" },
    { id: "projects", icon: "◫", label: "Projects" },
    { id: "tasks", icon: "✓", label: "Tasks" },
    { id: "team", icon: "⊹", label: "Team" },
    { id: "profile", icon: "◯", label: "Profile" },
  ];

  const pages = { dashboard: <Dashboard me={me} users={users} projects={projects} tasks={tasks} />, projects: <ProjectsPage me={me} users={users} projects={projects} setProjects={setProjects} tasks={tasks} />, tasks: <TasksPage me={me} users={users} projects={projects} tasks={tasks} setTasks={setTasks} />, team: <TeamPage me={me} users={users} tasks={tasks} />, profile: <ProfilePage me={me} users={users} setUsers={setUsers} setSession={setSession} /> };

  return (
    <div style={S.app}>
      <div style={S.sidebar}>
        <div style={S.logo}><div style={S.logoIcon}>⚡</div>TaskFlow</div>
        <nav style={{ flex: 1 }}>
          {NAV.map(n => (
            <div key={n.id} style={S.navItem(page === n.id)} onClick={() => setPage(n.id)}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              <span>{n.label}</span>
              {n.id === "tasks" && overdue > 0 && <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{overdue}</span>}
            </div>
          ))}
        </nav>
        <div style={{ padding: "0 12px" }}>
          <div style={{ ...S.row, padding: "10px 8px", background: "#27272a", borderRadius: 8 }}>
            <div style={{ ...S.avatar(), width: 28, height: 28, fontSize: 10 }}>{me.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: "#52525b" }}>{me.role}</p>
            </div>
          </div>
        </div>
      </div>
      <div style={S.main}>
        <div style={S.header}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>{NAV.find(n => n.id === page)?.label}</h1>
          <div style={S.row}>
            {overdue > 0 && <span style={{ ...S.tag("#ef4444"), fontSize: 12 }}>{overdue} overdue</span>}
            <span style={S.tag(isAdmin ? "#6366f1" : "#0ea5e9")}>{me.role}</span>
          </div>
        </div>
        {pages[page]}
      </div>
    </div>
  );
}
