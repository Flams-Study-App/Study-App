import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import api from "../../api/axios.js";

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function PomodoroTimer({ tasks }) {
  const [mode, setMode] = useState("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  const intervalRef = useRef(null);

  const totalSeconds = (mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60;
  const progressPct = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const handleComplete = async () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    await api.post("/planner/sessions", {
      taskId: taskId || undefined,
      durationMinutes: mode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES,
      sessionType: mode,
    });
    const nextMode = mode === "focus" ? "break" : "focus";
    setMode(nextMode);
    setSecondsLeft((nextMode === "focus" ? FOCUS_MINUTES : BREAK_MINUTES) * 60);
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="glass-panel p-6 flex flex-col items-center">
      <p className="text-xs uppercase tracking-wider text-ink-500 mb-4">{mode === "focus" ? "Focus session" : "Short break"}</p>

      <div className="relative w-40 h-40 focus-ring flex items-center justify-center" style={{ "--progress": `${progressPct}%` }}>
        <div className="w-32 h-32 rounded-full bg-base flex items-center justify-center">
          <span className="font-display font-bold text-3xl tabular-nums">{minutes}:{seconds}</span>
        </div>
      </div>

      <select value={taskId} onChange={(e) => setTaskId(e.target.value)} className="input-field mt-5 !py-1.5 text-xs">
        <option value="">No linked task</option>
        {tasks.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
      </select>

      <div className="flex gap-2 mt-4">
        <button onClick={() => setRunning((r) => !r)} className="btn-primary !px-4 flex items-center gap-2">
          {running ? <Pause size={15} /> : <Play size={15} />} {running ? "Pause" : "Start"}
        </button>
        <button onClick={reset} className="btn-ghost !px-3"><RotateCcw size={15} /></button>
      </div>
    </div>
  );
}
