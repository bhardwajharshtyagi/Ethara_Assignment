import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const STATUS = ['todo', 'in_progress', 'review', 'done'];
const PRIORITY = ['low', 'medium', 'high', 'urgent'];

const TaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().default(''),
  status: z.enum(STATUS).optional().default('todo'),
  priority: z.enum(PRIORITY).optional().default('medium'),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().datetime().nullable().optional(),
});

// List visible tasks
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const sql = isAdmin
      ? `SELECT * FROM tasks ORDER BY created_at DESC`
      : `SELECT DISTINCT t.* FROM tasks t
         LEFT JOIN project_members m ON m.project_id = t.project_id
         WHERE t.assignee_id = $1 OR m.user_id = $1 OR t.created_by = $1
         ORDER BY t.created_at DESC`;
    const { rows } = await query(sql, isAdmin ? [] : [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = TaskSchema.parse(req.body);
    const { rows } = await query(
      `INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, due_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [data.project_id, data.title, data.description, data.status, data.priority,
       data.assignee_id || null, data.due_date || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// Update task: admins can edit anything; assignees can update status only
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows: existing } = await query(`SELECT * FROM tasks WHERE id=$1`, [req.params.id]);
    const task = existing[0];
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isAdmin = req.user.role === 'admin';
    const isAssignee = task.assignee_id === req.user.id;
    if (!isAdmin && !isAssignee) return res.status(403).json({ error: 'Forbidden' });

    if (!isAdmin) {
      const { status } = z.object({ status: z.enum(STATUS) }).parse(req.body);
      const { rows } = await query(
        `UPDATE tasks SET status=$2 WHERE id=$1 RETURNING *`,
        [req.params.id, status]
      );
      return res.json(rows[0]);
    }

    const data = TaskSchema.partial().parse(req.body);
    const { rows } = await query(
      `UPDATE tasks SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         status = COALESCE($4, status),
         priority = COALESCE($5, priority),
         assignee_id = $6,
         due_date = $7,
         project_id = COALESCE($8, project_id)
       WHERE id=$1 RETURNING *`,
      [req.params.id, data.title, data.description, data.status, data.priority,
       data.assignee_id ?? task.assignee_id,
       data.due_date ?? task.due_date,
       data.project_id]
    );
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await query(`DELETE FROM tasks WHERE id=$1`, [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
