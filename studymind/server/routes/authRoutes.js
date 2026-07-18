import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { insert, findOne, updateById } from "../utils/jsonStore.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  streakCount: user.streakCount || 0,
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are all required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const existing = findOne("users", (u) => u.email === normalizedEmail);
    if (existing) return res.status(409).json({ message: "An account with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = insert("users", {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      streakCount: 0,
      lastActiveDate: null,
    });

    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").toLowerCase().trim();
    const user = findOne("users", (u) => u.email === normalizedEmail);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
