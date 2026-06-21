import express from "express";
import { prisma } from "../prismaClient.js";
import { requirePoliceAuth } from "../middleware/requirePoliceAuth.js";
import { toPublicItem, toPoliceItem } from "../utils/serializeItem.js";

const router = express.Router();

const ITEM_CATEGORIES = [
  "ELECTRONICS",
  "DOCUMENTS",
  "JEWELRY",
  "CLOTHING",
  "BAGS_WALLETS",
  "VEHICLE",
  "KEYS",
  "MONEY",
  "OTHER",
];

const ITEM_CONDITIONS = ["NEW", "GOOD", "FAIR", "DAMAGED", "POOR"];

function buildFilterWhere(query) {
  const where = {};

  if (query.category && ITEM_CATEGORIES.includes(query.category)) {
    where.category = query.category;
  }
  if (query.condition && ITEM_CONDITIONS.includes(query.condition)) {
    where.condition = query.condition;
  }
  if (query.color) {
    where.color = { contains: query.color };
  }
  if (query.holdingHqId) {
    where.holdingHqId = query.holdingHqId;
  }
  if (query.numberPlate) {
    where.numberPlate = { contains: query.numberPlate };
  }
  if (query.recoveredFrom) {
    where.recoveredFrom = { contains: query.recoveredFrom };
  }
  if (query.recoveryPlace) {
    where.recoveryPlace = { contains: query.recoveryPlace };
  }
  if (query.isReturned === "true") {
    where.isReturned = true;
  } else if (query.isReturned === "false") {
    where.isReturned = false;
  }
  if (query.q) {
    // Free text search across description and color.
    where.OR = [
      { description: { contains: query.q } },
      { color: { contains: query.q } },
      { recoveredFrom: { contains: query.q } },
      { recoveryPlace: { contains: query.q } },
      { numberPlate: { contains: query.q } },
    ];
  }
  if (query.recoveryTimeFrom || query.recoveryTimeTo) {
    where.recoveryTime = {};
    if (query.recoveryTimeFrom) where.recoveryTime.gte = new Date(query.recoveryTimeFrom);
    if (query.recoveryTimeTo) where.recoveryTime.lte = new Date(query.recoveryTimeTo);
  }

  return where;
}

// GET /api/items
// Public: search and filter all items. Defaults to showing only
// not-yet-returned items unless isReturned filter says otherwise,
// so civilians searching for lost items see relevant results first.
router.get("/", async (req, res) => {
  try {
    const where = buildFilterWhere(req.query);

    const items = await prisma.item.findMany({
      where,
      include: { holdingHq: true },
      orderBy: { uploadDate: "desc" },
    });

    res.json({ items: items.map(toPublicItem) });
  } catch (err) {
    console.error("Failed to fetch items:", err);
    res.status(500).json({ error: "Could not load items." });
  }
});

// GET /api/items/:id
// Public: view a single item's detail.
router.get("/:id", async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: { holdingHq: true },
    });
    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }
    res.json({ item: toPublicItem(item) });
  } catch (err) {
    console.error("Failed to fetch item:", err);
    res.status(500).json({ error: "Could not load this item." });
  }
});

// ---------- Police-only routes below ----------

// GET /api/items/police/all
// Police: full list with police-only fields, shared across all HQs.
router.get("/police/all", requirePoliceAuth, async (req, res) => {
  try {
    const where = buildFilterWhere(req.query);

    const items = await prisma.item.findMany({
      where,
      include: {
        holdingHq: true,
        loggedByHq: true,
        returnedByUser: true,
        claims: true,
      },
      orderBy: { uploadDate: "desc" },
    });

    res.json({ items: items.map(toPoliceItem) });
  } catch (err) {
    console.error("Failed to fetch items for police:", err);
    res.status(500).json({ error: "Could not load items." });
  }
});

// GET /api/items/police/:id
// Police: full detail on one item, including claims.
router.get("/police/:id", requirePoliceAuth, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: req.params.id },
      include: {
        holdingHq: true,
        loggedByHq: true,
        returnedByUser: true,
        claims: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }
    res.json({ item: toPoliceItem(item), claims: item.claims });
  } catch (err) {
    console.error("Failed to fetch item for police:", err);
    res.status(500).json({ error: "Could not load this item." });
  }
});

// POST /api/items
// Police: add a new found item. uploadDate is always set server-side.
router.post("/", requirePoliceAuth, async (req, res) => {
  const {
    category,
    size,
    weight,
    color,
    description,
    numberPlate,
    condition,
    recoveredFrom,
    recoveryTime,
    recoveryPlace,
    holdingHqId,
  } = req.body;

  if (!category || !ITEM_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "A valid category is required." });
  }
  if (!condition || !ITEM_CONDITIONS.includes(condition)) {
    return res.status(400).json({ error: "A valid condition is required." });
  }
  if (!size || !color || !description) {
    return res.status(400).json({ error: "Size, color, and description are required." });
  }
  if (!recoveredFrom || !recoveryTime || !recoveryPlace) {
    return res.status(400).json({ error: "Recovery location, time, and place are all required." });
  }
  if (!holdingHqId) {
    return res.status(400).json({ error: "Holding location (HQ) is required." });
  }
  if (category === "VEHICLE" && !numberPlate) {
    return res.status(400).json({ error: "Number plate is required for vehicle/transport items." });
  }

  try {
    const holdingHq = await prisma.hQ.findUnique({ where: { id: holdingHqId } });
    if (!holdingHq) {
      return res.status(400).json({ error: "Selected holding location does not exist." });
    }

    const item = await prisma.item.create({
      data: {
        category,
        size,
        weight: weight || null,
        color,
        description,
        numberPlate: category === "VEHICLE" ? numberPlate : numberPlate || null,
        condition,
        recoveredFrom,
        recoveryTime: new Date(recoveryTime),
        recoveryPlace,
        holdingHqId,
        loggedByHqId: req.police.hqId, // recorded automatically from the logged-in officer's HQ
        // uploadDate intentionally not accepted from the client — defaults to now() in the schema
      },
      include: { holdingHq: true, loggedByHq: true },
    });

    res.status(201).json({ item: toPoliceItem(item) });
  } catch (err) {
    console.error("Failed to create item:", err);
    res.status(500).json({ error: "Could not save this item." });
  }
});

// POST /api/items/:id/return
// Police: mark an item as returned to its owner. Irreversible.
// Records who it was returned to — visible only to police.
router.post("/:id/return", requirePoliceAuth, async (req, res) => {
  const { returnedToName, returnedToContact } = req.body;

  if (!returnedToName || !returnedToContact) {
    return res.status(400).json({
      error: "Name and contact details of the person it was returned to are required.",
    });
  }

  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) {
      return res.status(404).json({ error: "Item not found." });
    }
    if (item.isReturned) {
      return res.status(409).json({ error: "This item has already been marked as returned and cannot be changed." });
    }

    const updated = await prisma.item.update({
      where: { id: req.params.id },
      data: {
        isReturned: true,
        returnedAt: new Date(),
        returnedToName,
        returnedToContact,
        returnedByUserId: req.police.userId,
      },
      include: { holdingHq: true, loggedByHq: true, returnedByUser: true },
    });

    res.json({ item: toPoliceItem(updated) });
  } catch (err) {
    console.error("Failed to mark item returned:", err);
    res.status(500).json({ error: "Could not update this item." });
  }
});

export default router;
