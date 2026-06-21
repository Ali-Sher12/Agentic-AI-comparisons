import express from "express";
import { prisma } from "../prismaClient.js";

const router = express.Router();

// GET /api/hqs
// Public list of all police HQs — used to populate "holding location" dropdowns
// and to label items, for both police and civilian views.
router.get("/", async (_req, res) => {
  try {
    const hqs = await prisma.hQ.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, city: true },
    });
    res.json({ hqs });
  } catch (err) {
    console.error("Failed to fetch HQs:", err);
    res.status(500).json({ error: "Could not load police HQs." });
  }
});

export default router;
