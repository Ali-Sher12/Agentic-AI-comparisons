import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import hqRoutes from "./routes/hqs.js";
import itemRoutes from "./routes/items.js";
import claimRoutes from "./routes/claims.js";
import uploadRoutes from "./routes/uploads.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "lost-and-found-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/hqs", hqRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/uploads", uploadRoutes);

// Multer / general error handler — keeps error responses in a consistent JSON shape.
app.use((err, _req, res, _next) => {
  if (err && err.message && err.message.includes("File too large")) {
    return res.status(413).json({ error: "File is too large." });
  }
  if (err) {
    console.error("Unhandled error:", err);
    return res.status(500).json({ error: err.message || "Something went wrong." });
  }
  _next();
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.listen(PORT, () => {
  console.log(`Lost & Found backend running at http://localhost:${PORT}`);
});
