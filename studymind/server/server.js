import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import plannerRoutes from "./routes/plannerRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "synapse-server", storage: "json-file" }));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Synapse server running on http://localhost:${PORT}`);
  console.log(`Data storage: local JSON files in server/data/ (no database needed)`);
  console.log(`AI system: Offline mock mode activated (no GEMINI_API_KEY required)`);
});
