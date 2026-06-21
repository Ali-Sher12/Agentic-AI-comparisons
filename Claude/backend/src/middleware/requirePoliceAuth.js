import jwt from "jsonwebtoken";

// Verifies the police login token on protected routes.
// Attaches { userId, username, hqId, hqName } to req.police on success.
export function requirePoliceAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Login required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.police = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}
