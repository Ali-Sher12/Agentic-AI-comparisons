import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const hq = await prisma.policeHQ.findUnique({ where: { username } });
  if (!hq) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, hq.password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ id: hq.id, username: hq.username, hqName: hq.name });

  res.json({
    token,
    police: { id: hq.id, username: hq.username, hqName: hq.name },
  });
});

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(header.slice(7), process.env.JWT_SECRET);
    const hq = await prisma.policeHQ.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, name: true },
    });
    if (!hq) return res.status(401).json({ error: 'Invalid token' });
    res.json({ police: { id: hq.id, username: hq.username, hqName: hq.name } });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
