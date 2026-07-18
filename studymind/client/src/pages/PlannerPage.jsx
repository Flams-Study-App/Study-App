import { useEffect, useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import api from "../api/axios.js";
import PomodoroTimer from "../components/planner/PomodoroTimer.jsx";
import { useConfirm } from "../context/ConfirmContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const priorityColor = { low: "text-ink-500", medium: "text-cyan", high: "text-amber" };

export default function PlannerPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");

  const loadTasks = () => api.get("/planner/tasks").then((res) => setTasks(res.data.tasks));
  useEffect(() => { loadTasks(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post("/planner/tasks", { title, subject: subject || "General", dueDate: dueDate || null, priority });
    setTitle(""); setSubject(""); setDueDate("");
    loadTasks();
    toast.success("Task added");
  };

  const toggleComplete = async (task) => {
    await api.patch(`/planner/tasks/${task._id}`, { completed: !task.completed });
    loadTasks();
  };

  const handleDelete = async (id, title) => {
    const ok = await confirm("Delete this task?", `"${title}" will be permanently removed.`);
    if (!ok) return;
    await api.delete(`/planner/tasks/${id}`);
    loadTasks();
    toast.success("Task deleted");
  };

  const pending = tasks.filter((t) => !t.completed);

  return (
    <div className="p-8 max-w-5xl mx-auto grid lg:grid-cols-[1fr_320px] gap-8">
      <div>
        <h1 className="font-display font-bold text-2xl mb-1">Study Planner</h1>
        <p className="text-ink-500 text-sm mb-6">Keep track of what's due, and time your focus sessions.</p>

        <form onSubmit={handleAdd} className="glass-panel p-4 mb-6 grid sm:grid-cols-4 gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" className="input-field sm:col-span-2" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="input-field" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field" />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="input-field">
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <button type="submit" className="btn-primary sm:col-span-3 flex items-center justify-center gap-2">
            <Plus size={16} /> Add task
          </button>
        </form>

        <div className="space-y-2">
          {tasks.length === 0 && <p className="text-sm text-ink-500 text-center py-8">No tasks yet. Add one above.</p>}
          {tasks.map((task) => (
            <div key={task._id} className={`glass-panel p-3.5 flex items-center gap-3 animate-in ${task.completed ? "opacity-50" : ""}`}>
              <button onClick={() => toggleComplete(task)} className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${task.completed ? "bg-emerald-500 border-emerald-500" : "border-white/20"}`}>
                {task.completed && <Check size={12} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                <p className="text-xs text-ink-500">{task.subject}{task.dueDate ? ` · due ${new Date(task.dueDate).toLocaleDateString()}` : ""}</p>
              </div>
              <span className={`text-xs font-medium capitalize ${priorityColor[task.priority]}`}>{task.priority}</span>
              <button onClick={() => handleDelete(task._id, task.title)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-ink-500 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <PomodoroTimer tasks={pending} />
      </div>
    </div>
  );
}
