import { useState } from "react";
import { Menu, Brain } from "lucide-react";
import Sidebar from "./Sidebar.jsx";

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen w-full flex overflow-hidden">
      <Sidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.08] glass shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/[0.08] text-ink-300">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet to-cyan flex items-center justify-center">
              <Brain size={13} className="text-[#0A0C16]" />
            </div>
            <span className="font-display font-bold text-sm">Synapse</span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
