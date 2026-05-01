import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, name, role, avatar, created_at FROM users ORDER BY name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
