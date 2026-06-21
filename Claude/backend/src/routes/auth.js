import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";
import { requirePoliceAuth } from "../middleware/requirePoliceAuth.js";

const router = express.Router();

// POST /api/auth/login
// Police login, one account per HQ.
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const user = await prisma.policeUser.findUnique({
      where: { username },
      include: { hq: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        hqId: user.hqId,
        hqName: user.hq.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        hqId: user.hqId,
        hqName: user.hq.name,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong while logging in." });
  }
});

// GET /api/auth/me
// Returns the currently logged-in police user, based on the token.
router.get("/me", requirePoliceAuth, (req, res) => {
  res.json({ user: req.police });
});

export default router;
