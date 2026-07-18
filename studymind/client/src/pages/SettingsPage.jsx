import { useState } from "react";
import { User, Mail, Flame, LogOut, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl mb-1">Settings</h1>
      <p className="text-ink-500 text-sm mb-6">Your account details and preferences.</p>

      <div className="glass-panel p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-ink-500 mb-4">Account</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User size={16} className="text-ink-500" />
            <span className="text-sm">{user?.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-ink-500" />
            <span className="text-sm">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Flame size={16} className="text-amber" />
            <span className="text-sm">{user?.streakCount ?? 0} day study streak</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-ink-500 mb-3 flex items-center gap-2"><Shield size={13} /> Privacy</p>
        <p className="text-sm text-ink-300">
          Your documents, chat threads, flashcards, and study data are private to your account and are only
          used to power the AI features you interact with directly.
        </p>
      </div>

      <div className="glass-panel p-6">
        <p className="text-xs uppercase tracking-wider text-ink-500 mb-3">Session</p>
        {!confirmingLogout ? (
          <button onClick={() => setConfirmingLogout(true)} className="btn-ghost flex items-center gap-2 text-red-300">
            <LogOut size={15} /> Log out
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-300">Are you sure?</span>
            <button onClick={logout} className="btn-primary !px-3 !py-1.5 text-xs">Yes, log out</button>
            <button onClick={() => setConfirmingLogout(false)} className="btn-ghost !px-3 !py-1.5 text-xs">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
