import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

const ProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(''),
  color: z.string().max(20).optional().default('#6366f1'),
  member_ids: z.array(z.string().uuid()).optional().default([]),
});

// List projects user can see
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const sql = isAdmin
      ? `SELECT * FROM projects ORDER BY created_at DESC`
      : `SELECT p.* FROM projects p
         LEFT JOIN project_members m ON m.project_id = p.id
         WHERE p.created_by = $1 OR m.user_id = $1
         GROUP BY p.id ORDER BY p.created_at DESC`;
    const { rows } = await query(sql, isAdmin ? [] : [req.user.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = ProjectSchema.parse(req.body);
    const { rows } = await query(
      `INSERT INTO projects (name, description, color, created_by)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.name, data.description, data.color, req.user.id]
    );
    const project = rows[0];
    for (const uid of data.member_ids) {
      await query(
        `INSERT INTO project_members (project_id, user_id) VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
        [project.id, uid]
      );
    }
    res.status(201).json(project);
  } catch (err) { next(err); }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = ProjectSchema.partial().parse(req.body);
    const { rows } = await query(
      `UPDATE projects SET
         name = COALESCE($2, name),
         description = COALESCE($3, description),
         color = COALESCE($4, color)
       WHERE id=$1 RETURNING *`,
      [req.params.id, data.name, data.description, data.color]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await query(`DELETE FROM projects WHERE id=$1`, [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// Members
router.get('/:id/members', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar
       FROM project_members m JOIN users u ON u.id = m.user_id
       WHERE m.project_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/:id/members', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { user_id } = z.object({ user_id: z.string().uuid() }).parse(req.body);
    await query(
      `INSERT INTO project_members (project_id, user_id) VALUES ($1,$2)
       ON CONFLICT DO NOTHING`,
      [req.params.id, user_id]
    );
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:id/members/:userId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await query(
      `DELETE FROM project_members WHERE project_id=$1 AND user_id=$2`,
      [req.params.id, req.params.userId]
    );
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
