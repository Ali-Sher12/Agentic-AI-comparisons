import express from "express";
import path from "path";
import fs from "fs";
import { prisma } from "../prismaClient.js";
import { requirePoliceAuth } from "../middleware/requirePoliceAuth.js";
import { UPLOAD_DIR } from "../middleware/upload.js";

const router = express.Router();

// GET /api/uploads/claim/:claimId
// Police-only: serves the proof-of-ownership document for a given claim.
// Not exposed to the public — proof documents may contain CNIC images,
// receipts, etc. that civilians should not be able to browse.
router.get("/claim/:claimId", requirePoliceAuth, async (req, res) => {
  try {
    const claim = await prisma.claim.findUnique({ where: { id: req.params.claimId } });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    const filePath = path.join(UPLOAD_DIR, claim.proofDocumentPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Proof document file is missing on disk." });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error("Failed to serve claim document:", err);
    res.status(500).json({ error: "Could not load this document." });
  }
});

export default router;
