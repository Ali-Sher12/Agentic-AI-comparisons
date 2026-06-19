const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const authMiddleware = require('./middleware/auth');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'pakistan_police_lost_and_found_default_secret';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

app.use(cors());
app.use(express.json());
// Serve claim uploads locally
app.use('/uploads', express.static(uploadsDir));

// Helper: Decode and verify JWT silently to determine if requester is a police HQ
const getPoliceUser = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      return jwt.verify(token, JWT_SECRET);
    }
  } catch (e) {
    // Fail silently, treated as civilian/unauthenticated
  }
  return null;
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const hq = await prisma.hQ.findUnique({
      where: { username }
    });

    if (!hq) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, hq.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: hq.id, username: hq.username, name: hq.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: hq.id,
        username: hq.username,
        name: hq.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/hqs - List all HQs (useful for dropdowns in Civilian & Police UI)
app.get('/api/hqs', async (req, res) => {
  try {
    const hqs = await prisma.hQ.findMany({
      select: { id: true, name: true, username: true }
    });
    res.json(hqs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve HQs.' });
  }
});

// ==========================================
// ITEM ROUTES
// ==========================================

// GET /api/items - Retrieve all items with search & filtering
app.get('/api/items', async (req, res) => {
  const { search, status, holdingLocationId, color } = req.query;
  const user = getPoliceUser(req);

  try {
    const whereClause = {};

    // Filter by status if specified, otherwise show all items (shared visibility)
    if (status) {
      whereClause.status = status.toUpperCase();
    }

    // Filter by holding HQ location
    if (holdingLocationId) {
      whereClause.holdingLocationId = holdingLocationId;
    }

    // Filter by color
    if (color) {
      whereClause.color = {
        contains: color
      };
    }

    // Comprehensive free-text search (searches description, numberPlate, color, recoveredLocation)
    if (search) {
      whereClause.OR = [
        { description: { contains: search } },
        { color: { contains: search } },
        { recoveredLocation: { contains: search } },
        { numberPlate: { contains: search } }
      ];
    }

    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        uploader: { select: { id: true, name: true } },
        holdingLocation: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Sanitize item details: strip private returned information if civilian
    const sanitizedItems = items.map(item => {
      if (!user) {
        const { returnedToName, returnedToCnic, returnedToContact, ...rest } = item;
        return rest;
      }
      return item;
    });

    res.json(sanitizedItems);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Failed to retrieve items.' });
  }
});

// GET /api/items/:id - Retrieve single item details
app.get('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const user = getPoliceUser(req);

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, name: true } },
        holdingLocation: { select: { id: true, name: true } }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    // Civilian check: block recipient metadata visibility
    if (!user) {
      const { returnedToName, returnedToCnic, returnedToContact, ...rest } = item;
      return res.json(rest);
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve item details.' });
  }
});

// POST /api/items - Add new item (Police HQ authenticated only)
app.post('/api/items', authMiddleware, async (req, res) => {
  const {
    size,
    weight,
    color,
    description,
    numberPlate,
    condition,
    recoveredLocation,
    recoveryTime,
    holdingLocationId
  } = req.body;

  // Basic validation
  if (!size || !weight || !color || !description || !condition || !recoveredLocation || !recoveryTime || !holdingLocationId) {
    return res.status(400).json({ error: 'All fields except number plate are required.' });
  }

  try {
    const newItem = await prisma.item.create({
      data: {
        size,
        weight,
        color,
        description,
        numberPlate: numberPlate || null,
        condition,
        recoveredLocation,
        recoveryTime,
        uploaderId: req.user.id, // Automatic setting based on logged-in token
        holdingLocationId,
        status: 'AVAILABLE'
      },
      include: {
        uploader: { select: { id: true, name: true } },
        holdingLocation: { select: { id: true, name: true } }
      }
    });

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to record the lost item.' });
  }
});

// POST /api/items/:id/return - Mark an item as returned (Police HQ authenticated only)
app.post('/api/items/:id/return', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { returnedToName, returnedToCnic, returnedToContact } = req.body;

  if (!returnedToName || !returnedToCnic || !returnedToContact) {
    return res.status(400).json({ error: 'Recipient name, CNIC, and contact number are required.' });
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.status === 'RETURNED') {
      return res.status(400).json({ error: 'Action denied. Return status is irreversible.' });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnedToName,
        returnedToCnic,
        returnedToContact,
        returnedAt: new Date()
      },
      include: {
        uploader: { select: { id: true, name: true } },
        holdingLocation: { select: { id: true, name: true } }
      }
    });

    res.json(updatedItem);
  } catch (error) {
    console.error('Return item error:', error);
    res.status(500).json({ error: 'Failed to log returned status.' });
  }
});

// ==========================================
// CLAIM ROUTES
// ==========================================

// POST /api/claims - File civilian claim on an item (Public, multer file upload)
app.post('/api/claims', upload.single('proofDocument'), async (req, res) => {
  const { itemId, emailOrCnic, contactInfo } = req.body;

  if (!itemId || !emailOrCnic || !contactInfo) {
    // Delete file if uploaded to avoid dangling resources
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: 'Item ID, email/CNIC, and contact info are required.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Proof of ownership document is required.' });
  }

  try {
    // Verify item exists and is still available
    const item = await prisma.item.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Item not found.' });
    }

    if (item.status !== 'AVAILABLE') {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'This item has already been returned to its owner.' });
    }

    // Constraint: Max 3 claims per person (by email/CNIC) per item.
    const existingClaimsCount = await prisma.claim.count({
      where: {
        itemId,
        emailOrCnic: emailOrCnic.trim()
      }
    });

    if (existingClaimsCount >= 3) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Submission blocked. You have reached the limit of 3 claims for this item.'
      });
    }

    const newClaim = await prisma.claim.create({
      data: {
        itemId,
        emailOrCnic: emailOrCnic.trim(),
        contactInfo,
        proofPath: `uploads/${req.file.filename}`,
        status: 'PENDING'
      }
    });

    res.status(201).json(newClaim);
  } catch (error) {
    console.error('File claim error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to submit ownership claim.' });
  }
});

// GET /api/claims - Fetch all claims for dashboard (Police HQ authenticated only)
app.get('/api/claims', authMiddleware, async (req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      include: {
        item: {
          include: {
            uploader: { select: { id: true, name: true } },
            holdingLocation: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(claims);
  } catch (error) {
    console.error('Get claims error:', error);
    res.status(500).json({ error: 'Failed to retrieve claims database.' });
  }
});

// POST /api/claims/:id/accept - Accept civilian claim (Police HQ authenticated only)
app.post('/api/claims/:id/accept', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { item: true }
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    // Auth Constraint: Only the police HQ officer who added/uploaded the item can accept or reject claims
    if (claim.item.uploaderId !== req.user.id) {
      return res.status(403).json({
        error: 'Authorization denied. Only the police HQ that uploaded this item can accept or reject claims.'
      });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: { status: 'ACCEPTED' }
    });

    res.json(updatedClaim);
  } catch (error) {
    console.error('Accept claim error:', error);
    res.status(500).json({ error: 'Failed to accept claim.' });
  }
});

// POST /api/claims/:id/reject - Reject civilian claim (Police HQ authenticated only)
app.post('/api/claims/:id/reject', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { item: true }
    });

    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    // Auth Constraint: Only the police HQ officer who added/uploaded the item can accept or reject claims
    if (claim.item.uploaderId !== req.user.id) {
      return res.status(403).json({
        error: 'Authorization denied. Only the police HQ that uploaded this item can accept or reject claims.'
      });
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    res.json(updatedClaim);
  } catch (error) {
    console.error('Reject claim error:', error);
    res.status(500).json({ error: 'Failed to reject claim.' });
  }
});

// Start express server
app.listen(PORT, () => {
  console.log(`Lost & Found Police server running on http://localhost:${PORT}`);
});
