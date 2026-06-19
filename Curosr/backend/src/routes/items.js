import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { stripPoliceFields, stripPoliceFieldsFromList } from '../lib/serialize.js';

const router = Router();

const ITEM_FIELDS = [
  'size',
  'weight',
  'color',
  'detailedDescription',
  'numberPlate',
  'conditionFoundIn',
  'recoveredFromLocation',
  'recoveryTimeAndPlace',
  'holdingLocation',
];

function buildWhere(query, includeReturned = true) {
  const where = {};

  if (!includeReturned || query.status === 'returned') {
    where.returnedToOwner = true;
  } else if (query.status === 'available') {
    where.returnedToOwner = false;
  }

  for (const field of ITEM_FIELDS) {
    if (query[field]) {
      where[field] = { contains: query[field] };
    }
  }

  if (query.uploadDateFrom || query.uploadDateTo) {
    where.uploadDate = {};
    if (query.uploadDateFrom) where.uploadDate.gte = new Date(query.uploadDateFrom);
    if (query.uploadDateTo) where.uploadDate.lte = new Date(query.uploadDateTo);
  }

  return where;
}

router.get('/public', async (req, res) => {
  try {
    const where = buildWhere(req.query, true);
    if (req.query.status === 'available') {
      where.returnedToOwner = false;
    } else if (req.query.status === 'returned') {
      where.returnedToOwner = true;
    }

    const items = await prisma.lostItem.findMany({
      where,
      include: { loggedByHQ: { select: { name: true } } },
      orderBy: { uploadDate: 'desc' },
    });

    res.json(stripPoliceFieldsFromList(items));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/public/:id', async (req, res) => {
  try {
    const item = await prisma.lostItem.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { loggedByHQ: { select: { name: true } } },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(stripPoliceFields(item));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const where = buildWhere(req.query, true);

    const items = await prisma.lostItem.findMany({
      where,
      include: {
        loggedByHQ: { select: { name: true } },
        claims: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { uploadDate: 'desc' },
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/meta/hqs', authMiddleware, async (_req, res) => {
  try {
    const hqs = await prisma.policeHQ.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(hqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const item = await prisma.lostItem.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        loggedByHQ: { select: { name: true } },
        claims: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const data = {};
    for (const field of ITEM_FIELDS) {
      if (!req.body[field] && field !== 'numberPlate') {
        return res.status(400).json({ error: `${field} is required` });
      }
      data[field] = req.body[field] || null;
    }

    const item = await prisma.lostItem.create({
      data: {
        ...data,
        loggedByHQId: req.police.id,
      },
      include: { loggedByHQ: { select: { name: true } } },
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/return', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { returnedTo } = req.body;

    if (!returnedTo?.trim()) {
      return res.status(400).json({ error: 'returnedTo is required' });
    }

    const item = await prisma.lostItem.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.returnedToOwner) {
      return res.status(400).json({ error: 'Item is already marked as returned. This action is irreversible.' });
    }

    const updated = await prisma.lostItem.update({
      where: { id },
      data: {
        returnedToOwner: true,
        returnedTo: returnedTo.trim(),
        returnedAt: new Date(),
      },
      include: { loggedByHQ: { select: { name: true } } },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
