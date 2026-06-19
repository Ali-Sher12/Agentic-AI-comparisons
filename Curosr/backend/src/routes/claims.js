import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();

function assertItemOwner(res, policeId, item) {
  if (item.loggedByHQId !== policeId) {
    res.status(403).json({
      error: 'Only the headquarters that logged this item can accept or reject its claims',
    });
    return false;
  }
  return true;
}

router.post('/:itemId', upload.single('proofDocument'), async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { identifierType, identifierValue, contactInfo } = req.body;

    if (!identifierType || !['email', 'cnic'].includes(identifierType)) {
      return res.status(400).json({ error: 'identifierType must be "email" or "cnic"' });
    }
    if (!identifierValue?.trim()) {
      return res.status(400).json({ error: 'Email or CNIC is required' });
    }
    if (!contactInfo?.trim()) {
      return res.status(400).json({ error: 'Contact info is required' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Proof-of-ownership document is required' });
    }

    const item = await prisma.lostItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.returnedToOwner) {
      return res.status(400).json({ error: 'This item has already been returned to its owner' });
    }

    const existingCount = await prisma.claim.count({
      where: {
        itemId,
        identifierType,
        identifierValue: identifierValue.trim(),
      },
    });

    if (existingCount >= 3) {
      return res.status(400).json({
        error: 'Maximum of 3 claims per person (email/CNIC) per item has been reached',
      });
    }

    const claim = await prisma.claim.create({
      data: {
        itemId,
        identifierType,
        identifierValue: identifierValue.trim(),
        contactInfo: contactInfo.trim(),
        proofDocumentPath: req.file.filename,
        status: 'pending',
      },
    });

    res.status(201).json({
      id: claim.id,
      itemId: claim.itemId,
      status: claim.status,
      createdAt: claim.createdAt,
      message: 'Claim submitted successfully. Police will review your claim.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/item/:itemId/count', async (req, res) => {
  try {
    const itemId = parseInt(req.params.itemId);
    const { identifierType, identifierValue } = req.query;

    if (!identifierType || !identifierValue) {
      return res.status(400).json({ error: 'identifierType and identifierValue are required' });
    }

    const count = await prisma.claim.count({
      where: { itemId, identifierType, identifierValue: identifierValue.trim() },
    });

    res.json({ count, remaining: Math.max(0, 3 - count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pending', authMiddleware, async (req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      where: {
        status: 'pending',
        item: { loggedByHQId: req.police.id },
      },
      include: {
        item: {
          include: { loggedByHQ: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'pending') {
      return res.status(400).json({ error: `Claim is already ${claim.status}` });
    }
    if (claim.item.returnedToOwner) {
      return res.status(400).json({ error: 'Item has already been returned' });
    }
    if (!assertItemOwner(res, req.police.id, claim.item)) return;

    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: 'accepted',
        reviewedAt: new Date(),
        reviewedByHQId: req.police.id,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.status !== 'pending') {
      return res.status(400).json({ error: `Claim is already ${claim.status}` });
    }
    if (!assertItemOwner(res, req.police.id, claim.item)) return;

    const updated = await prisma.claim.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedByHQId: req.police.id,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
