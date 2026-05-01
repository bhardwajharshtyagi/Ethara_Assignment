import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'member']).default('member'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function sign(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/signup', async (req, res, next) => {
  try {
    const data = SignupSchema.parse(req.body);
    const hash = await bcrypt.hash(data.password, 10);
    const avatar = data.name.replace(/[^a-zA-Z ]/g, '').slice(0, 2).toUpperCase();
    const { rows } = await query(
      `INSERT INTO users (email, password, name, role, avatar)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, email, name, role, avatar, created_at`,
      [data.email, hash, data.name, data.role, avatar]
    );
    const user = rows[0];
    res.json({ token: sign(user), user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);
    const { rows } = await query(`SELECT * FROM users WHERE email=$1`, [data.email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    delete user.password;
    res.json({ token: sign(user), user });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, email, name, role, avatar, created_at FROM users WHERE id=$1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
