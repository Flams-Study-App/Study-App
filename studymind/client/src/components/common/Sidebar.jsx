import { NavLink } from "react-router-dom";
import { MessageSquare, FileText, Layers, ListChecks, Calendar, LayoutDashboard, LogOut, Flame, Brain, Settings, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const navItems = [
  { to: "/chat", label: "AI Tutor", icon: MessageSquare },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/flashcards", label: "Flashcards", icon: Layers },
  { to: "/quizzes", label: "Quizzes", icon: ListChecks },
  { to: "/planner", label: "Planner", icon: Calendar },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" />
      )}
      <aside
        className={`w-64 shrink-0 h-full glass border-r border-white/[0.08] flex flex-col p-4 fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-cyan flex items-center justify-center shadow-glow">
              <Brain size={18} className="text-[#0A0C16]" />
            </div>
            <div>
              <p className="font-display font-bold text-lg leading-none">Synapse</p>
              <p className="text-[11px] text-ink-500 leading-none mt-1">AI Study Platform</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.08] text-ink-500">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/[0.08] text-ink-100 border border-white/[0.1]"
                    : "text-ink-300 hover:bg-white/[0.05] hover:text-ink-100"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="glass-panel p-3 mb-3 flex items-center gap-2">
          <Flame size={16} className="text-amber" />
          <span className="text-sm text-ink-300">
            <span className="font-semibold text-ink-100">{user?.streakCount ?? 0}</span> day streak
          </span>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-ink-500 truncate">{user?.email}</p>
          </div>
          <button onClick={logout} title="Log out" className="p-2 rounded-lg hover:bg-white/[0.08] text-ink-300 hover:text-ink-100 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
