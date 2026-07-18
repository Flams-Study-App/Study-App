import { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Clock, Target, Layers, Flame, ListChecks, BookOpen } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass-panel p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon size={18} className="text-[#0A0C16]" />
      </div>
      <div>
        <p className="text-xl font-display font-bold leading-none">{value}</p>
        <p className="text-xs text-ink-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-7 w-64 bg-white/[0.06] rounded-lg mb-2" />
      <div className="h-4 w-80 bg-white/[0.05] rounded-lg mb-6" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 glass-panel" />)}
      </div>
      <div className="h-64 glass-panel" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setSummary(res.data));
  }, []);

  if (!summary) return <SkeletonDashboard />;

  const chartData = summary.dailyMinutes.map((d) => ({
    day: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
    minutes: d.minutes,
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1">Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</h1>
      <p className="text-ink-500 text-sm mb-6">Here's how your studying has been going.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Clock} label="Total focus time" value={`${Math.round(summary.totalFocusMinutes / 60)}h ${summary.totalFocusMinutes % 60}m`} accent="bg-gradient-to-br from-violet to-cyan" />
        <StatCard icon={Target} label="Avg. quiz accuracy" value={`${summary.avgAccuracy}%`} accent="bg-gradient-to-br from-cyan to-emerald-400" />
        <StatCard icon={Flame} label="Day streak" value={summary.streakCount} accent="bg-gradient-to-br from-amber to-orange-400" />
        <StatCard icon={Layers} label="Flashcards due" value={summary.dueToday} accent="bg-gradient-to-br from-violet to-fuchsia-400" />
        <StatCard icon={ListChecks} label="Tasks pending" value={summary.pendingTasks} accent="bg-gradient-to-br from-cyan to-blue-400" />
        <StatCard icon={BookOpen} label="Quizzes taken" value={summary.quizzesTaken} accent="bg-gradient-to-br from-emerald-400 to-cyan" />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mb-6">
        <div className="glass-panel p-6">
          <p className="text-sm font-medium mb-4">Focus minutes — last 14 days</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C5CFF" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#7C5CFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="#7C7B93" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#7C7B93" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#12142299", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
              <Area type="monotone" dataKey="minutes" stroke="#7C5CFF" fill="url(#colorMinutes)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-6">
          <p className="text-sm font-medium mb-4">Focus time by subject</p>
          {summary.subjectBreakdown.length === 0 ? (
            <p className="text-sm text-ink-500 py-16 text-center">Start a Pomodoro session to see this fill in.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.subjectBreakdown} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" stroke="#7C7B93" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="subject" stroke="#7C7B93" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: "#12142299", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="minutes" fill="#22D3EE" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass-panel p-6">
        <p className="text-sm font-medium mb-4">Recent quiz attempts</p>
        {summary.recentAttempts.length === 0 ? (
          <p className="text-sm text-ink-500 text-center py-6">No quizzes taken yet.</p>
        ) : (
          <div className="space-y-2">
            {summary.recentAttempts.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-1 py-2 border-b border-white/[0.06] last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.topic}</p>
                  <p className="text-xs text-ink-500 capitalize">{a.difficulty} · {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ${a.score / a.total >= 0.7 ? "text-emerald-400" : "text-amber"}`}>
                  {a.score}/{a.total}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
