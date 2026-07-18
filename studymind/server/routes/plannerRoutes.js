import express from "express";
import { protect } from "../middleware/auth.js";
import { insert, findMany, findOne, updateById, deleteById, findById } from "../utils/jsonStore.js";

const router = express.Router();

// Tasks
router.get("/tasks", protect, async (req, res) => {
  const tasks = findMany("tasks", (t) => t.userId === req.user.id)
    .sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  res.json({ tasks: tasks.map((t) => ({ ...t, _id: t.id })) });
});

router.post("/tasks", protect, async (req, res) => {
  const { title, subject, dueDate, priority } = req.body;
  if (!title) return res.status(400).json({ message: "Task title is required" });
  const task = insert("tasks", {
    userId: req.user.id,
    title,
    subject: subject || "General",
    dueDate: dueDate || null,
    priority: priority || "medium",
    completed: false,
  });
  res.status(201).json({ task: { ...task, _id: task.id } });
});

router.patch("/tasks/:id", protect, async (req, res) => {
  const task = findOne("tasks", (t) => t.id === req.params.id && t.userId === req.user.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  const updated = updateById("tasks", task.id, req.body);
  res.json({ task: { ...updated, _id: updated.id } });
});

router.delete("/tasks/:id", protect, async (req, res) => {
  const task = findOne("tasks", (t) => t.id === req.params.id && t.userId === req.user.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  deleteById("tasks", task.id);
  res.json({ message: "Task deleted" });
});

// Pomodoro / study sessions
router.post("/sessions", protect, async (req, res) => {
  const { taskId, subject, durationMinutes, sessionType } = req.body;
  if (!durationMinutes) return res.status(400).json({ message: "durationMinutes is required" });

  const session = insert("sessions", {
    userId: req.user.id,
    taskId: taskId || null,
    subject: subject || "General",
    durationMinutes,
    sessionType: sessionType || "focus",
  });

  // Update daily streak: only bump once per calendar day, and only for focus sessions
  if (session.sessionType === "focus") {
    const user = findById("users", req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (last) last.setHours(0, 0, 0, 0);

    if (!last || last.getTime() !== today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const newStreak = last && last.getTime() === yesterday.getTime() ? (user.streakCount || 0) + 1 : 1;
      updateById("users", user.id, { streakCount: newStreak, lastActiveDate: today.toISOString() });
    }
  }

  res.status(201).json({ session });
});

router.get("/sessions", protect, async (req, res) => {
  const sessions = findMany("sessions", (s) => s.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 200);
  res.json({ sessions });
});

export default router;
