import express from "express";
import fs from "fs";
import { prisma } from "../prismaClient.js";
import { requirePoliceAuth } from "../middleware/requirePoliceAuth.js";
import { uploadProofDocument } from "../middleware/upload.js";
import { normalizeIdentity, isValidCnic, isValidEmail } from "../utils/identity.js";

const router = express.Router();

const MAX_CLAIMS_PER_PERSON_PER_ITEM = 3;

// POST /api/claims
// Public: submit a claim on an item. Enforces max 3 claims per person
// (by email or CNIC) per item — rejected claims still count.
router.post("/", uploadProofDocument.single("proofDocument"), async (req, res) => {
  const { itemId, identityType, identityValue, fullName, contactPhone, contactEmail } = req.body;

  // Helper to clean up an uploaded file if validation fails after upload.
  const cleanupUploadedFile = () => {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  };

  if (!itemId || !identityType || !identityValue || !fullName || !contactPhone) {
    cleanupUploadedFile();
    return res.status(400).json({
      error: "Item, identity type and value, full name, and contact phone are all required.",
    });
  }

  if (!["EMAIL", "CNIC"].includes(identityType)) {
    cleanupUploadedFile();
    return res.status(400).json({ error: "Identity type must be EMAIL or CNIC." });
  }

  if (identityType === "CNIC" && !isValidCnic(identityValue)) {
    cleanupUploadedFile();
    return res.status(400).json({ error: "Please enter a valid 13-digit CNIC." });
  }

  if (identityType === "EMAIL" && !isValidEmail(identityValue)) {
    cleanupUploadedFile();
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  if (!req.file) {
    return res.status(400).json({ error: "A proof-of-ownership document is required." });
  }

  try {
    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      cleanupUploadedFile();
      return res.status(404).json({ error: "Item not found." });
    }
    if (item.isReturned) {
      cleanupUploadedFile();
      return res.status(409).json({ error: "This item has already been returned to its owner and can no longer receive claims." });
    }

    const claimantKey = normalizeIdentity(identityType, identityValue);

    // Count ALL prior claims by this person on this item — rejected ones count too.
    const priorClaimsCount = await prisma.claim.count({
      where: { itemId, claimantKey },
    });

    if (priorClaimsCount >= MAX_CLAIMS_PER_PERSON_PER_ITEM) {
      cleanupUploadedFile();
      return res.status(429).json({
        error: `You have reached the maximum of ${MAX_CLAIMS_PER_PERSON_PER_ITEM} claims allowed on this item.`,
      });
    }

    const claim = await prisma.claim.create({
      data: {
        itemId,
        claimantKey,
        identityType,
        identityValue,
        fullName,
        contactPhone,
        contactEmail: contactEmail || null,
        proofDocumentPath: req.file.filename,
      },
    });

    res.status(201).json({
      claim: {
        id: claim.id,
        itemId: claim.itemId,
        status: claim.status,
        createdAt: claim.createdAt,
        claimsUsed: priorClaimsCount + 1,
        claimsRemaining: MAX_CLAIMS_PER_PERSON_PER_ITEM - (priorClaimsCount + 1),
      },
    });
  } catch (err) {
    console.error("Failed to submit claim:", err);
    cleanupUploadedFile();
    res.status(500).json({ error: "Could not submit this claim." });
  }
});

// GET /api/claims/check
// Public: lets the civilian know how many claims they've already used on
// an item before they fill out the form (nice UX, not required, but cheap).
router.get("/check", async (req, res) => {
  const { itemId, identityType, identityValue } = req.query;
  if (!itemId || !identityType || !identityValue) {
    return res.status(400).json({ error: "itemId, identityType, and identityValue are required." });
  }
  try {
    const claimantKey = normalizeIdentity(identityType, identityValue);
    const count = await prisma.claim.count({ where: { itemId, claimantKey } });
    res.json({
      claimsUsed: count,
      claimsRemaining: Math.max(0, MAX_CLAIMS_PER_PERSON_PER_ITEM - count),
      maxClaims: MAX_CLAIMS_PER_PERSON_PER_ITEM,
    });
  } catch (err) {
    console.error("Failed to check claims:", err);
    res.status(500).json({ error: "Could not check claim history." });
  }
});

// ---------- Police-only routes below ----------

// GET /api/claims/police/item/:itemId
// Police: view all claims on a specific item to accept/reject.
router.get("/police/item/:itemId", requirePoliceAuth, async (req, res) => {
  try {
    const claims = await prisma.claim.findMany({
      where: { itemId: req.params.itemId },
      orderBy: { createdAt: "desc" },
      include: { decidedByUser: true },
    });
    res.json({
      claims: claims.map((c) => ({
        id: c.id,
        itemId: c.itemId,
        identityType: c.identityType,
        identityValue: c.identityValue,
        fullName: c.fullName,
        contactPhone: c.contactPhone,
        contactEmail: c.contactEmail,
        proofDocumentPath: c.proofDocumentPath,
        status: c.status,
        createdAt: c.createdAt,
        decidedAt: c.decidedAt,
        decidedByUser: c.decidedByUser ? { username: c.decidedByUser.username } : null,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch claims:", err);
    res.status(500).json({ error: "Could not load claims for this item." });
  }
});

// POST /api/claims/:id/decision
// Police: accept or reject a claim. Body: { decision: "ACCEPTED" | "REJECTED" }
router.post("/:id/decision", requirePoliceAuth, async (req, res) => {
  const { decision } = req.body;
  if (!["ACCEPTED", "REJECTED"].includes(decision)) {
    return res.status(400).json({ error: "Decision must be ACCEPTED or REJECTED." });
  }

  try {
    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } });
    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }
    if (claim.status !== "PENDING") {
      return res.status(409).json({ error: "This claim has already been decided." });
    }

    const updated = await prisma.claim.update({
      where: { id: req.params.id },
      data: {
        status: decision,
        decidedAt: new Date(),
        decidedByUserId: req.police.userId,
      },
    });

    res.json({ claim: updated });
  } catch (err) {
    console.error("Failed to decide claim:", err);
    res.status(500).json({ error: "Could not update this claim." });
  }
});

export default router;
