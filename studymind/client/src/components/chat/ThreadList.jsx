import { Plus, MessageSquare, Trash2 } from "lucide-react";

export default function ThreadList({ threads, activeId, onSelect, onNew, onDelete }) {
  return (
    <div className={`w-full sm:w-72 shrink-0 h-full glass border-r border-white/[0.08] flex-col p-3 ${activeId ? "hidden sm:flex" : "flex"}`}>
      <button onClick={onNew} className="btn-primary w-full flex items-center justify-center gap-2 mb-3">
        <Plus size={16} /> New chat
      </button>
      <div className="flex-1 overflow-y-auto space-y-1">
        {threads.length === 0 && (
          <p className="text-sm text-ink-500 text-center mt-8 px-2">
            No conversations yet. Start one and ask your AI tutor anything.
          </p>
        )}
        {threads.map((t) => (
          <div
            key={t._id}
            onClick={() => onSelect(t._id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-sm transition-colors ${
              activeId === t._id ? "bg-white/[0.08] border border-white/[0.1]" : "hover:bg-white/[0.05]"
            }`}
          >
            <MessageSquare size={15} className="text-ink-500 shrink-0" />
            <span className="truncate flex-1">{t.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(t._id); }}
              className="opacity-0 group-hover:opacity-100 text-ink-500 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
